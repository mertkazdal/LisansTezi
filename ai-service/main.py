import asyncio
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from services.books_service import get_book_recommendations
from services.demo_mode import analyze_demo, get_demo_recommendations, is_demo_mode
from services.emotion_catalog import VALID_EMOTIONS, is_valid_emotion, normalize_emotion_key
from services.gemini_service import GeminiServiceError, analyze_emotion, generate_life_advice
from services.spotify_service import get_music_recommendations
from services.tmdb_service import get_movie_recommendations

app = FastAPI(
    title="MoodLens AI Service",
    description="AI-powered emotion detection and recommendation engine",
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


class RecommendationsRequest(BaseModel):
    emotion: str
    context: Optional[str] = None
    language: Optional[str] = "en"
    prefer_followup_key: Optional[bool] = False


class RecommendationsResponse(BaseModel):
    music: list
    movies: list
    books: list
    lifeAdvice: list


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai-service"}


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    """
    Analyze selfie, text, or both for emotion detection using Gemini API.
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
        return RecommendationsResponse(
            music=demo_bundle["music"],
            movies=demo_bundle["movies"],
            books=demo_bundle["books"],
            lifeAdvice=demo_bundle["lifeAdvice"],
        )

    music_task = get_music_recommendations(emotion, context)
    movies_task = get_movie_recommendations(emotion, context, language)
    books_task = get_book_recommendations(emotion, context, language)
    advice_task = generate_life_advice(
        emotion,
        context,
        language,
        request.prefer_followup_key or False,
    )

    music, movies, books, advice = await asyncio.gather(
        music_task,
        movies_task,
        books_task,
        advice_task,
        return_exceptions=True,
    )

    if isinstance(music, Exception):
        print(f"Music recommendation error: {music}")
        music = []
    if isinstance(movies, Exception):
        print(f"Movie recommendation error: {movies}")
        movies = []
    if isinstance(books, Exception):
        print(f"Book recommendation error: {books}")
        books = []
    if isinstance(advice, Exception):
        print(f"Life advice error: {advice}")
        advice = []

    demo_bundle = get_demo_recommendations(emotion, language)
    if not music:
        music = demo_bundle["music"]
    if not movies:
        movies = demo_bundle["movies"]
    if not books:
        books = demo_bundle["books"]
    if not advice:
        advice = demo_bundle["lifeAdvice"]

    return RecommendationsResponse(
        music=music,
        movies=movies,
        books=books,
        lifeAdvice=advice,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
