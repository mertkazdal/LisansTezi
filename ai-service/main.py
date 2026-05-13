import asyncio
from typing import Optional

from fastapi import FastAPI, HTTPException
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
from services.personality_service import detect_personality, load_survey_questions
from services.personality_update_service import update_personality_from_behavior
from services.spotify_service import get_music_recommendations
from services.tmdb_service import get_movie_recommendations

app = FastAPI(
    title="Yaşam Koçu AI Service",
    description="AI-powered emotion detection and recommendation engine with local face analysis, Gemini text analysis, and recommendation providers",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    image_base64: Optional[str] = None
    text: Optional[str] = None
    mime_type: Optional[str] = "image/jpeg"
    language: Optional[str] = "en"
    analysis_key_env: Optional[str] = None


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


class RecommendationsRequest(BaseModel):
    emotion: str
    context: Optional[str] = None
    language: Optional[str] = "en"
    prefer_followup_key: Optional[bool] = False


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


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai-service"}


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
        needsReason=False,
        followUpQuestion="",
        reasonProvided=True,
        warning=result.get("warning"),
        imageFallbackUsed=result.get("image_fallback_used", False),
        contradictionDetected=result.get("contradiction_detected", False),
        clarificationMessage=result.get("clarification_message"),
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

    if is_demo_mode():
        demo_bundle = get_demo_recommendations(emotion, language)
        coach_comment = build_demo_coach_comment(emotion, context, language)
        return RecommendationsResponse(
            coachComment=coach_comment,
            coach_advice=coach_comment,
            music=demo_bundle["music"],
            movies=demo_bundle["movies"],
            films=demo_bundle["movies"],
            books=demo_bundle["books"],
            lifeAdvice=demo_bundle["lifeAdvice"],
            activities=demo_bundle["lifeAdvice"],
            status="complete",
            missing_recommendations=[],
        )

    partial_errors: list[str] = []
    try:
        followup_bundle = await generate_followup_bundle(
            emotion,
            context,
            language,
            request.prefer_followup_key or False,
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
    music_task = get_music_recommendations(emotion, context, query_bundle.get("music_queries"))
    movies_task = get_movie_recommendations(emotion, context, language, query_bundle.get("film_queries"))
    books_task = get_book_recommendations(emotion, context, language, query_bundle.get("book_queries"))

    music, movies, books = await asyncio.gather(
        music_task,
        movies_task,
        books_task,
        return_exceptions=True,
    )

    missing_recommendations: list[str] = []

    if isinstance(music, Exception):
        print(f"Music recommendation error: {music}")
        missing_recommendations.append("music")
        music = []
    if isinstance(movies, Exception):
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
    )


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
