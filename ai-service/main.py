import asyncio
import json
import logging
import os
import sys
from pathlib import Path
from typing import Optional

sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")

import structlog
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from services.books_service import get_book_recommendations
from services.demo_mode import analyze_demo, get_demo_recommendations, is_demo_mode
from services.emotion_catalog import VALID_EMOTIONS, is_valid_emotion, normalize_emotion_key
from services.gemini_service import (
    GeminiServiceError,
    analyze_emotion,
    generate_followup_bundle,
    generate_personality_avatar,
)
from services.image_validation_service import ImageValidationError, validate_image_payload
from services.local_face_emotion_service import LocalFaceEmotionError, warmup_local_face_emotion_model
from services.personality_service import detect_personality, load_survey_questions
from services.personality_update_service import update_personality_from_behavior
from services.recommendation_runtime import redis_health
from services.spotify_service import get_music_recommendations
from services.tmdb_service import MovieRecommendationProviderError, get_movie_recommendations

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(message)s",
)
structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.add_log_level,
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
)
logger = structlog.get_logger("ai-service")

_REQUIRED_EXTERNAL_KEYS = {
    "SPOTIFY_CLIENT_ID": "Music recommendations",
    "SPOTIFY_CLIENT_SECRET": "Music recommendations",
    "TMDB_API_KEY": "Film recommendations",
    "GOOGLE_BOOKS_API_KEY": "Book recommendations",
}
_REQUIRED_GEMINI_KEYS = [
    "GEMINI_KEY_PERSONALITY",
    "GEMINI_KEY_TEXT_EMOTION",
    "GEMINI_KEY_CONFLICT_1",
    "GEMINI_KEY_CONFLICT_2",
    "GEMINI_KEY_CONFLICT_3",
    "GEMINI_KEY_RECOMMENDATIONS",
    "GEMINI_KEY_PERSONALITY_UPDATE",
    "GEMINI_KEY_FILM_QUERIES",
]


def _print_startup_key_check() -> None:
    print("=== AI Service Startup Check ===")
    for key, purpose in _REQUIRED_EXTERNAL_KEYS.items():
        if not os.getenv(key):
            print(f"WARNING: {key} is not set - {purpose} will use demo fallback")
            logger.warning("startup_key_missing", key=key, purpose=purpose)
        else:
            print(f"OK: {key} is set")
            logger.info("startup_key_present", key=key, purpose=purpose)

    for key in _REQUIRED_GEMINI_KEYS:
        if not os.getenv(key):
            print(f"WARNING: {key} is not set - related Gemini step will fail")
            logger.warning("startup_gemini_key_missing", key=key)
        else:
            print(f"OK: {key} is set")
            logger.info("startup_gemini_key_present", key=key)
    print("================================")


def _print_image_emotion_startup_check() -> None:
    provider = (os.getenv("IMAGE_EMOTION_PROVIDER") or "local").strip().lower() or "local"
    allow_fallback = (os.getenv("ALLOW_GEMINI_VISION_FALLBACK") or "false").strip().lower()
    model_id = (os.getenv("LOCAL_FACE_MODEL_ID") or "trpakov/vit-face-expression").strip()
    model_dir = (os.getenv("LOCAL_FACE_MODEL_DIR") or "/opt/models/trpakov-vit-face-expression").strip()
    model_path = Path(model_dir)
    onnx_files = list(model_path.rglob("*.onnx")) if model_path.exists() else []

    print("=== Image Emotion Provider Check ===")
    print(f"IMAGE_EMOTION_PROVIDER={provider}")
    print(f"ALLOW_GEMINI_VISION_FALLBACK={allow_fallback}")
    if provider == "local":
        print("OK: Local image emotion provider is enabled")
        print(f"OK: LOCAL_FACE_MODEL_ID={model_id}")
        if model_path.exists():
            print(f"OK: LOCAL_FACE_MODEL_DIR exists: {model_dir}")
            if (model_path / "config.json").exists():
                print("OK: local face model config.json exists")
            else:
                print("WARNING: local face model config.json is missing; first valid image may download/repair model files")

            if onnx_files:
                print(f"OK: local face ONNX model exists: {onnx_files[0]}")
            else:
                print("WARNING: local face ONNX model is missing; first valid image will download model files")
        else:
            print(f"WARNING: LOCAL_FACE_MODEL_DIR not found: {model_dir}; first valid image will download model files")
    elif provider == "gemini":
        print("WARNING: Gemini image emotion provider selected; local visual emotion is not the active provider")
    else:
        print(f"WARNING: Unknown IMAGE_EMOTION_PROVIDER value: {provider}")
    print("====================================")


_print_startup_key_check()
_print_image_emotion_startup_check()

def _parse_allowed_origins() -> tuple[list[str], bool]:
    raw = (
        os.getenv("AI_ALLOWED_ORIGINS")
        or os.getenv("ALLOWED_ORIGINS")
        or "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173"
    )
    origins = [origin.strip() for origin in raw.split(",") if origin.strip()]
    if "*" in origins:
        return ["*"], False
    return origins, True


_allowed_origins, _allow_credentials = _parse_allowed_origins()

app = FastAPI(
    title="Yaşam Koçu AI Service",
    description="AI-powered emotion detection and recommendation engine with local face analysis, Gemini text analysis, and recommendation providers",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def _warmup_local_face_model_background() -> None:
    provider = (os.getenv("IMAGE_EMOTION_PROVIDER") or "local").strip().lower() or "local"
    if provider != "local":
        return

    try:
        print("Local face emotion model warmup started")
        info = await asyncio.to_thread(warmup_local_face_emotion_model, "tr")
        print(f"Local face emotion model warmup finished: {info['model_used']} at {info['model_dir']}")
        logger.info("local_face_model_warmup_finished", **info)
    except LocalFaceEmotionError as exc:
        print(f"WARNING: local face emotion model warmup failed: {exc.code} {exc.message}")
        logger.warning("local_face_model_warmup_failed", code=exc.code, message=exc.message)
    except Exception as exc:
        print(f"WARNING: local face emotion model warmup failed: {exc}")
        logger.warning("local_face_model_warmup_failed", error=str(exc))


@app.on_event("startup")
async def startup_warmups() -> None:
    asyncio.create_task(_warmup_local_face_model_background())


class AnalyzeRequest(BaseModel):
    image_base64: Optional[str] = None
    text: Optional[str] = None
    mime_type: Optional[str] = "image/jpeg"
    language: Optional[str] = "en"
    analysis_key_env: Optional[str] = None
    user_id: Optional[str] = None
    personality_json: Optional[str] = None


class AnalyzeResponse(BaseModel):
    emotion: str
    confidence: float
    explanation: str
    faceEmotion: Optional[str] = None
    faceConfidence: Optional[float] = None
    textEmotion: Optional[str] = None
    textConfidence: Optional[float] = None
    needsReason: Optional[bool] = False
    followUpQuestion: Optional[str] = None
    reasonProvided: Optional[bool] = True
    warning: Optional[str] = None
    imageFallbackUsed: Optional[bool] = False
    contradictionDetected: Optional[bool] = False
    clarificationMessage: Optional[str] = None
    textValidationFailed: Optional[bool] = False
    textValidationReason: Optional[str] = None
    textValidationCode: Optional[str] = None
    textQualityScore: Optional[float] = None
    modelUsed: Optional[str] = None
    imageModelUsed: Optional[str] = None
    imageProvider: Optional[str] = None


class RecommendationsRequest(BaseModel):
    emotion: str
    context: Optional[str] = None
    language: Optional[str] = "en"
    prefer_followup_key: Optional[bool] = False
    personality_json: Optional[str] = None
    age_group: Optional[str] = None
    confidence: Optional[float] = None
    analysis_text: Optional[str] = None
    user_id: Optional[str] = None
    survey_movie_genres: Optional[list[str]] = None
    excluded_movie_ids: Optional[list[int]] = None


class RecommendationsResponse(BaseModel):
    coachComment: str
    coach_advice: Optional[str] = None
    music: list
    movies: list
    films: Optional[list] = None
    books: list
    lifeAdvice: list
    activities: Optional[list] = None
    status: Optional[str] = "complete"
    partial_error: Optional[str] = None
    missing_recommendations: Optional[list[str]] = None
    data_sources: Optional[dict[str, str]] = None


class ImageValidationRequest(BaseModel):
    image_base64: str
    mime_type: Optional[str] = "image/jpeg"
    language: Optional[str] = "en"


class PersonalityDetectRequest(BaseModel):
    answers: dict
    language: Optional[str] = "tr"


class PersonalityUpdateRequest(BaseModel):
    current_personality: Optional[dict] = None
    last_updated: Optional[str] = None
    spotify_summary: Optional[dict] = None
    recent_content: Optional[dict] = None
    language: Optional[str] = "tr"


class AvatarGenerationRequest(BaseModel):
    big_five: Optional[dict] = None
    mbti_type: Optional[str] = None
    dominant_emotion: Optional[str] = "calm"


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception(
        "unhandled_exception",
        path=str(request.url.path),
        method=request.method,
        error_type=exc.__class__.__name__,
    )
    return JSONResponse(
        status_code=500,
        content={
            "code": "UNHANDLED_ERROR",
            "message": "Unexpected server error.",
        },
    )


@app.get("/health")
async def health_check():
    model_dir = Path(os.getenv("LOCAL_FACE_MODEL_DIR") or "/opt/models/trpakov-vit-face-expression")
    onnx_files = list(model_dir.rglob("*.onnx")) if model_dir.exists() else []
    redis = await redis_health()
    local_model = {
        "provider": (os.getenv("IMAGE_EMOTION_PROVIDER") or "local").strip().lower() or "local",
        "modelId": os.getenv("LOCAL_FACE_MODEL_ID") or "trpakov/vit-face-expression",
        "modelDir": str(model_dir),
        "directoryExists": model_dir.exists(),
        "configExists": (model_dir / "config.json").exists(),
        "onnxExists": bool(onnx_files),
    }
    required_keys = {
        key: bool(os.getenv(key))
        for key in [*_REQUIRED_EXTERNAL_KEYS.keys(), *_REQUIRED_GEMINI_KEYS]
    }
    healthy = bool(redis.get("available")) and (
        local_model["provider"] != "local" or local_model["onnxExists"]
    )

    return {
        "status": "healthy" if healthy else "degraded",
        "service": "ai-service",
        "dependencies": {
            "redis": redis,
            "localFaceModel": local_model,
            "requiredKeys": required_keys,
        },
    }


@app.get("/survey/questions")
async def survey_questions(language: str = "tr"):
    return load_survey_questions(language)


@app.post("/personality/detect")
async def personality_detect(request: PersonalityDetectRequest):
    return detect_personality(
        {"answers": request.answers},
        request.language or "tr",
    )


@app.post("/personality/update")
async def personality_update(request: PersonalityUpdateRequest):
    return update_personality_from_behavior(
        request.current_personality,
        request.last_updated,
        request.spotify_summary,
        request.recent_content,
        request.language or "tr",
    )


@app.post("/api/profile/generate-avatar")
async def profile_generate_avatar(request: AvatarGenerationRequest):
    return await generate_personality_avatar(
        request.big_five,
        request.mbti_type,
        request.dominant_emotion or "calm",
    )


async def _validate_image(request: ImageValidationRequest):
    try:
        return validate_image_payload(
            request.image_base64,
            request.mime_type or "image/jpeg",
            request.language or "en",
        )
    except ImageValidationError as exc:
        return JSONResponse(
            status_code=400,
            content={
                "valid": False,
                "message": exc.message,
                "code": exc.code,
            },
        )


@app.post("/api/validate-image")
async def validate_image_api(request: ImageValidationRequest):
    return await _validate_image(request)


@app.post("/validate-image")
async def validate_image(request: ImageValidationRequest):
    return await _validate_image(request)


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    """
    Analyze selfie, text, or both for emotion detection.
    Text analysis uses Gemini unless demo mode is explicitly enabled.
    """
    has_image = bool((request.image_base64 or "").strip())
    has_text = bool((request.text or "").strip())
    if not has_image and not has_text:
        raise HTTPException(status_code=400, detail="At least one input is required")

    if is_demo_mode():
        result = analyze_demo(
            request.text,
            request.image_base64,
            request.language or "en",
        )
    else:
        try:
            result = await analyze_emotion(
                request.image_base64,
                request.text,
                request.mime_type,
                request.language or "en",
                request.analysis_key_env,
                request.personality_json,
                request.user_id,
            )
        except GeminiServiceError as exc:
            return JSONResponse(
                status_code=exc.status_code,
                content={
                    "code": exc.code,
                    "message": exc.message,
                    **(
                        {"retryAfterSeconds": exc.retry_after_seconds}
                        if exc.retry_after_seconds is not None
                        else {}
                    ),
                },
            )

    return AnalyzeResponse(
        emotion=result["emotion"],
        confidence=result["confidence"],
        explanation=result["explanation"],
        faceEmotion=result.get("face_emotion"),
        faceConfidence=result.get("face_confidence"),
        textEmotion=result.get("text_emotion"),
        textConfidence=result.get("text_confidence"),
        needsReason=result.get("needs_reason", False),
        followUpQuestion=result.get("follow_up_question", ""),
        reasonProvided=result.get("reason_provided", True),
        warning=result.get("warning"),
        imageFallbackUsed=result.get("image_fallback_used", False),
        contradictionDetected=result.get("contradiction_detected", False),
        clarificationMessage=result.get("clarification_message"),
        textValidationFailed=result.get("text_validation_failed", False),
        textValidationReason=result.get("text_validation_reason"),
        textValidationCode=result.get("text_validation_code"),
        textQualityScore=result.get("text_quality_score"),
        modelUsed=result.get("model_used"),
        imageModelUsed=result.get("image_model_used"),
        imageProvider=result.get("image_provider"),
    )


@app.post("/recommendations", response_model=RecommendationsResponse)
async def recommendations(request: RecommendationsRequest):
    """
    Get personalized recommendations based on the detected emotion and any extra context.
    """
    emotion = request.emotion.lower().strip()
    if not is_valid_emotion(emotion):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid emotion. Must be one of: {', '.join(VALID_EMOTIONS)}",
        )
    emotion = normalize_emotion_key(emotion)

    context = request.context or ""
    language = request.language or "en"
    analysis_excerpt = (request.analysis_text or "").strip()[:100]
    enriched_context_parts = [context]
    if request.confidence is not None:
        enriched_context_parts.append(f"emotion confidence: {request.confidence:.2f}")
    if request.age_group:
        enriched_context_parts.append(f"age group: {request.age_group}")
    if analysis_excerpt:
        enriched_context_parts.append(f"analysis excerpt: {analysis_excerpt}")
    enriched_context = "\n".join(part for part in enriched_context_parts if part.strip())

    if is_demo_mode():
        demo_bundle = get_demo_recommendations(emotion, language)
        coach_comment = build_demo_coach_comment(emotion, context, language)
        music = _limit_and_pad(demo_bundle["music"], demo_bundle["music"])
        movies = _limit_and_pad(demo_bundle["movies"], demo_bundle["movies"])
        books = _limit_and_pad(demo_bundle["books"], demo_bundle["books"])
        advice = _limit_and_pad(demo_bundle["lifeAdvice"], demo_bundle["lifeAdvice"])
        music, music_source = _tag_items_source(music, "music", forced_source="demo")
        movies, movies_source = _tag_items_source(movies, "movies", forced_source="demo")
        books, books_source = _tag_items_source(books, "books", forced_source="demo")
        return RecommendationsResponse(
            coachComment=coach_comment,
            coach_advice=coach_comment,
            music=music,
            movies=movies,
            films=movies,
            books=books,
            lifeAdvice=advice,
            activities=advice,
            status="complete",
            missing_recommendations=[],
            data_sources={
                "music": music_source,
                "films": movies_source,
                "books": books_source,
            },
        )

    partial_errors: list[str] = []
    try:
        followup_bundle = await generate_followup_bundle(
            emotion,
            enriched_context,
            language,
            request.prefer_followup_key or False,
            request.personality_json,
            request.age_group,
            request.confidence,
        )
    except Exception as exc:
        print(f"Follow-up bundle error: {exc}")
        partial_errors.append("coach")
        followup_bundle = {
            "coach_comment": build_demo_coach_comment(emotion, context, language),
            "advice": get_demo_recommendations(emotion, language)["lifeAdvice"],
            "queries": {},
        }

    query_bundle = followup_bundle.get("queries") if isinstance(followup_bundle, dict) else {}
    query_bundle = query_bundle if isinstance(query_bundle, dict) else {}
    music_task = get_music_recommendations(
        emotion,
        enriched_context,
        query_bundle.get("music_queries"),
        request.age_group,
    )
    movies_task = get_movie_recommendations(
        emotion,
        enriched_context,
        language,
        query_bundle.get("film_queries"),
        request.age_group,
        request.survey_movie_genres or [],
        request.user_id,
        request.excluded_movie_ids or [],
        analysis_excerpt,
    )
    books_task = get_book_recommendations(emotion, enriched_context, language, query_bundle.get("book_queries"))

    music, movies, books = await asyncio.gather(
        music_task,
        movies_task,
        books_task,
        return_exceptions=True,
    )

    missing_recommendations: list[str] = []
    movies_provider_failed = False

    if isinstance(music, Exception):
        print(f"Music recommendation error: {music}")
        missing_recommendations.append("music")
        music = []
    if isinstance(movies, MovieRecommendationProviderError):
        print(f"Movie recommendation provider error: {movies}")
        missing_recommendations.append("films")
        movies = movies.fallback_movies
        movies_provider_failed = True
    elif isinstance(movies, Exception):
        print(f"Movie recommendation error: {movies}")
        missing_recommendations.append("films")
        movies = []
    if isinstance(books, Exception):
        print(f"Book recommendation error: {books}")
        missing_recommendations.append("books")
        books = []

    demo_bundle = get_demo_recommendations(emotion, language)
    if not music:
        if "music" not in missing_recommendations:
            missing_recommendations.append("music")
        music = demo_bundle["music"]
    if not movies:
        if "films" not in missing_recommendations:
            missing_recommendations.append("films")
        movies = demo_bundle["movies"]
    if not books:
        if "books" not in missing_recommendations:
            missing_recommendations.append("books")
        books = demo_bundle["books"]

    coach_comment = followup_bundle.get("coach_comment") or build_demo_coach_comment(emotion, context, language)
    advice = followup_bundle.get("advice") or demo_bundle["lifeAdvice"]
    music = _limit_and_pad(music, demo_bundle["music"])
    movies = _limit_and_pad(movies, demo_bundle["movies"])
    books = _limit_and_pad(books, demo_bundle["books"])
    advice = _limit_and_pad(advice, demo_bundle["lifeAdvice"])
    music, music_source = _tag_items_source(music, "music")
    movies, movies_source = _tag_items_source(
        movies,
        "movies",
        forced_source="demo" if movies_provider_failed else None,
    )
    books, books_source = _tag_items_source(books, "books")

    partial_error = None
    if missing_recommendations:
        partial_error = "Some external recommendation providers were unavailable; fallback recommendations were returned."
    elif partial_errors:
        partial_error = "Coach recommendation provider was unavailable; fallback guidance was returned."

    return RecommendationsResponse(
        coachComment=coach_comment,
        coach_advice=coach_comment,
        music=music,
        movies=movies,
        films=movies,
        books=books,
        lifeAdvice=advice,
        activities=advice,
        status="partial" if partial_error else "complete",
        partial_error=partial_error,
        missing_recommendations=missing_recommendations,
        data_sources={
            "music": music_source,
            "films": movies_source,
            "books": books_source,
        },
    )


def _dedupe_key(item):
    if isinstance(item, dict):
        return item.get("tmdb_id") or item.get("title") or item.get("name") or item.get("spotify_url") or json.dumps(item, sort_keys=True, default=str)
    return str(item)


def _limit_and_pad(items: list | None, fallback: list | None, limit: int = 3) -> list:
    result = []
    seen = set()
    for source in (items or []), (fallback or []):
        for item in source:
            key = _dedupe_key(item)
            if key in seen:
                continue
            seen.add(key)
            result.append(item)
            if len(result) >= limit:
                return result[:limit]
    return result[:limit]


def _tag_items_source(
    items: list | None,
    category: str,
    forced_source: str | None = None,
) -> tuple[list, str]:
    source = forced_source or "demo"
    tagged_items = []

    for item in items or []:
        if not isinstance(item, dict):
            tagged_items.append(item)
            continue

        tagged = dict(item)
        item_source = forced_source
        if item_source is None:
            if category == "music" and tagged.get("spotify_url"):
                item_source = "spotify"
                source = "spotify"
            elif category == "movies" and tagged.get("tmdb_url"):
                item_source = "tmdb"
                source = "tmdb"
            elif category == "books" and tagged.get("link"):
                item_source = "google_books"
                source = "google_books"
            else:
                item_source = "demo"

        tagged["source"] = item_source
        tagged_items.append(tagged)

    return tagged_items, source


def build_demo_coach_comment(emotion: str, context: str | None, language: str) -> str:
    normalized_language = "tr" if str(language or "en").lower().startswith("tr") else "en"
    normalized_emotion = normalize_emotion_key(emotion)
    has_context = bool((context or "").strip())

    if normalized_language == "tr":
        if has_context:
            return (
                f"Bugün baskın duygu {normalized_emotion}. Bu sonucu sert bir etiket gibi değil, "
                "günlük ritmini ayarlamana yardım eden bir sinyal gibi kullan ve sana iyi gelen küçük adımları seç."
            )

        return (
            f"Bugün baskın duygu {normalized_emotion}. Ritmini biraz yavaşlatmak ve kendine iyi gelen birkaç sade adım seçmek "
            "sonucu daha dengeli kullanmana yardım edebilir."
        )

    if has_context:
        return (
            f"The dominant emotion today looks like {normalized_emotion}. Use that result as a helpful signal, "
            "slow the pace where needed, and choose one or two small actions that genuinely support you."
        )

    return (
        f"The dominant emotion today looks like {normalized_emotion}. Try to use that signal gently and pick a couple "
        "of realistic steps that can support your pace today."
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
