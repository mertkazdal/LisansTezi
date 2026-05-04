from __future__ import annotations

import os

import httpx
from dotenv import load_dotenv

from services.context_utils import append_context_to_query
from services.emotion_catalog import normalize_emotion_key
from services.recommendation_runtime import (
    AsyncTTLCache,
    build_cache_key,
    compact_context,
    default_http_timeout,
)

load_dotenv()

TMDB_API_KEY = os.getenv("TMDB_API_KEY", "")
TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500"
TMDB_CACHE = AsyncTTLCache(ttl_seconds=3600, max_entries=256)

MOOD_GENRES = {
    "happy": [35, 10402],
    "sad": [18, 10749],
    "angry": [28, 53],
    "anxious": [16, 10751],
    "excited": [12, 878],
    "calm": [99, 36],
    "tired": [35, 16],
    "stressed": [35, 10751],
    "nostalgic": [10749, 18],
    "motivated": [28, 12],
    "hopeful": [18, 10751],
    "overwhelmed": [35, 99],
}
MOOD_KEYWORDS = {
    "happy": "feel good",
    "sad": "emotional drama",
    "angry": "revenge action",
    "anxious": "heartwarming family",
    "excited": "adventure epic",
    "calm": "peaceful documentary",
    "tired": "light comedy",
    "stressed": "comedy relaxing",
    "nostalgic": "classic love story",
    "motivated": "inspirational sports",
    "hopeful": "uplifting inspiring",
    "overwhelmed": "gentle comforting",
}


def _normalize_language(language: str | None) -> str:
    return "tr-TR" if (language or "").lower().startswith("tr") else "en-US"


def _map_movies(items: list[dict]) -> list[dict]:
    movies: list[dict] = []
    for item in items[:8]:
        poster_path = item.get("poster_path")
        movies.append(
            {
                "title": item.get("title", "Unknown"),
                "overview": item.get("overview", ""),
                "poster": f"{TMDB_IMAGE_BASE}{poster_path}" if poster_path else None,
                "rating": round(item.get("vote_average", 0), 1),
                "release_date": item.get("release_date", ""),
                "tmdb_url": f"https://www.themoviedb.org/movie/{item.get('id', '')}",
                "genre_ids": item.get("genre_ids", []),
            }
        )
    return movies


async def _search_movies(query: str, api_language: str) -> list[dict]:
    async with httpx.AsyncClient(timeout=default_http_timeout(12.0)) as client:
        response = await client.get(
            f"{TMDB_BASE_URL}/search/movie",
            params={
                "api_key": TMDB_API_KEY,
                "query": query,
                "language": api_language,
                "page": 1,
                "include_adult": False,
            },
        )
        response.raise_for_status()
        results = response.json().get("results", [])
    return [item for item in results if item.get("vote_count", 0) >= 20]


async def _discover_movies(genre_str: str, api_language: str) -> list[dict]:
    async with httpx.AsyncClient(timeout=default_http_timeout(12.0)) as client:
        response = await client.get(
            f"{TMDB_BASE_URL}/discover/movie",
            params={
                "api_key": TMDB_API_KEY,
                "with_genres": genre_str,
                "sort_by": "popularity.desc",
                "language": api_language,
                "page": 1,
                "vote_average.gte": 6.0,
                "vote_count.gte": 100,
            },
        )
        response.raise_for_status()
        data = response.json()
    return data.get("results", [])


async def get_movie_recommendations(
    emotion: str,
    context: str | None = None,
    language: str = "en",
) -> list:
    normalized_emotion = normalize_emotion_key(emotion, "calm")
    compacted_context = compact_context(context, max_chars=200)
    api_language = _normalize_language(language)
    base_keyword = MOOD_KEYWORDS.get(normalized_emotion, MOOD_KEYWORDS["calm"])
    query = append_context_to_query(base_keyword, compacted_context) if compacted_context else base_keyword
    genre_ids = MOOD_GENRES.get(normalized_emotion, MOOD_GENRES["calm"])
    genre_str = ",".join(str(genre_id) for genre_id in genre_ids)
    cache_key = build_cache_key(
        "tmdb",
        {
            "emotion": normalized_emotion,
            "context": compacted_context,
            "language": api_language,
        },
    )
    cached_movies = await TMDB_CACHE.get(cache_key)
    if cached_movies is not None:
        return cached_movies

    stale_movies = await TMDB_CACHE.get(cache_key, allow_stale=True)

    try:
        if not TMDB_API_KEY:
            raise ValueError("TMDB API key not configured")

        movies = []
        if compacted_context:
            movies = await _search_movies(query, api_language)
            if not movies and query != base_keyword:
                movies = await _search_movies(base_keyword, api_language)

        if not movies:
            movies = await _discover_movies(genre_str, api_language)

        mapped_movies = _map_movies(movies)
        if mapped_movies:
            await TMDB_CACHE.set(cache_key, mapped_movies)
            return mapped_movies

        return stale_movies or []
    except Exception as exc:
        print(f"TMDB API error: {exc}")
        return stale_movies or []
