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

GOOGLE_BOOKS_API_KEY = os.getenv("GOOGLE_BOOKS_API_KEY", "")
BOOKS_BASE_URL = "https://www.googleapis.com/books/v1/volumes"
BOOKS_CACHE = AsyncTTLCache(ttl_seconds=3600, max_entries=256)

MOOD_BOOK_QUERIES = {
    "happy": "happiness joy positive thinking",
    "sad": "healing grief comfort",
    "angry": "anger management inner peace",
    "anxious": "anxiety relief mindfulness meditation",
    "excited": "adventure thrilling inspiring",
    "calm": "meditation peace mindfulness",
    "tired": "self-care rest recovery wellness",
    "stressed": "stress management relaxation techniques",
    "nostalgic": "memoir coming of age classic literature",
    "motivated": "motivation success habits self-improvement",
    "hopeful": "hope optimism resilience personal growth",
    "overwhelmed": "overwhelm boundaries simplicity mental clarity",
}


def _normalize_language(language: str | None) -> str:
    return "tr" if (language or "").lower().startswith("tr") else "en"


def _truncate_description(description: str | None) -> str:
    text = (description or "").strip()
    if not text:
        return "No description available."
    if len(text) <= 200:
        return text
    return f"{text[:197].rstrip()}..."


def _map_books(items: list[dict]) -> list[dict]:
    books: list[dict] = []
    for item in items[:8]:
        info = item.get("volumeInfo", {})
        image_links = info.get("imageLinks", {})
        thumbnail = image_links.get("thumbnail", image_links.get("smallThumbnail"))
        if thumbnail and thumbnail.startswith("http://"):
            thumbnail = thumbnail.replace("http://", "https://")

        books.append(
            {
                "title": info.get("title", "Unknown"),
                "authors": info.get("authors", ["Unknown Author"]),
                "description": _truncate_description(info.get("description")),
                "thumbnail": thumbnail,
                "link": info.get("infoLink", ""),
                "published_date": info.get("publishedDate", ""),
                "rating": info.get("averageRating"),
                "page_count": info.get("pageCount"),
            }
        )
    return books


async def _fetch_books(query: str, language: str) -> list[dict]:
    params = {
        "q": query,
        "maxResults": 8,
        "orderBy": "relevance",
        "printType": "books",
    }

    if language != "tr":
        params["langRestrict"] = "en"

    if GOOGLE_BOOKS_API_KEY:
        params["key"] = GOOGLE_BOOKS_API_KEY

    async with httpx.AsyncClient(timeout=default_http_timeout(12.0)) as client:
        response = await client.get(BOOKS_BASE_URL, params=params)
        response.raise_for_status()
        data = response.json()

    return data.get("items", [])


async def get_book_recommendations(
    emotion: str,
    context: str | None = None,
    language: str = "en",
) -> list:
    normalized_emotion = normalize_emotion_key(emotion, "calm")
    normalized_language = _normalize_language(language)
    compacted_context = compact_context(context, max_chars=220)
    base_query = MOOD_BOOK_QUERIES.get(normalized_emotion, MOOD_BOOK_QUERIES["calm"])
    query = append_context_to_query(base_query, compacted_context) if compacted_context else base_query
    cache_key = build_cache_key(
        "books",
        {
            "emotion": normalized_emotion,
            "context": compacted_context,
            "language": normalized_language,
        },
    )
    cached_books = await BOOKS_CACHE.get(cache_key)
    if cached_books is not None:
        return cached_books

    stale_books = await BOOKS_CACHE.get(cache_key, allow_stale=True)

    try:
        items = await _fetch_books(query, normalized_language)
        if query != base_query and not items:
            items = await _fetch_books(base_query, normalized_language)

        books = _map_books(items)
        if books:
            await BOOKS_CACHE.set(cache_key, books)
            return books

        return stale_books or []
    except Exception as exc:
        print(f"Google Books API error: {exc}")
        return stale_books or []
