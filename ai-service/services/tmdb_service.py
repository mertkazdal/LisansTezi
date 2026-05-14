from __future__ import annotations

import asyncio
import hashlib
import json
import os
import random
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv

from services.emotion_catalog import normalize_emotion_key
from services.gemini_service import generate_film_search_queries
from services.recommendation_runtime import (
    AsyncTTLCache,
    build_cache_key,
    compact_context,
    default_http_timeout,
)

load_dotenv()

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
FALLBACK_PATH = DATA_DIR / "film_fallback.json"
TMDB_API_KEY = os.getenv("TMDB_API_KEY", "")
TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500"
TMDB_CACHE = AsyncTTLCache(ttl_seconds=86400, max_entries=512)


class MovieRecommendationProviderError(Exception):
    def __init__(self, message: str, fallback_movies: list[dict[str, Any]]):
        super().__init__(message)
        self.fallback_movies = fallback_movies


EMOTION_GENRES = {
    "happy": [35, 10402, 16],
    "sad": [18, 10749],
    "angry": [28, 53, 80],
    "anxious": [53, 9648, 878],
    "excited": [28, 12, 35],
    "calm": [99, 36, 18],
    "tired": [35, 16, 10751],
    "stressed": [35, 10749, 18],
    "nostalgic": [36, 10402, 18],
    "motivated": [28, 12, 36],
    "hopeful": [18, 10751, 10749],
    "overwhelmed": [99, 18, 9648],
}

SURVEY_GENRE_IDS = {
    "comedy": 35,
    "drama": 18,
    "adventure": 12,
    "science_fiction": 878,
    "science fiction": 878,
    "documentary": 99,
    "romance": 10749,
}

AGE_CONTEXT_GENRES = {
    "teen": [10751, 16, 12, 35],
    "young_adult": [12, 35, 18, 10749, 878],
    "adult": [18, 35, 53, 99],
    "mature": [18, 36, 99, 10749],
}

AGE_SUITABILITY_GENRES = {
    "teen": [10751, 16],
    "young_adult": [12, 35, 878],
    "adult": [18, 35, 53],
    "mature": [18, 36],
}


def _normalize_language(language: str | None) -> str:
    return "tr-TR" if (language or "").lower().startswith("tr") else "en-US"


def _normalize_age_group(age_group: str | None) -> str:
    normalized = (age_group or "").strip().lower()
    return normalized if normalized in AGE_CONTEXT_GENRES else "adult"


def _normalize_survey_genres(survey_genres: list[str] | None) -> list[str]:
    normalized: list[str] = []
    for item in survey_genres or []:
        candidate = str(item or "").strip().lower().replace("-", "_")
        if candidate and candidate not in normalized:
            normalized.append(candidate)
    return normalized


def _survey_genre_ids(survey_genres: list[str]) -> list[int]:
    ids: list[int] = []
    for genre in survey_genres:
        genre_id = SURVEY_GENRE_IDS.get(genre) or SURVEY_GENRE_IDS.get(genre.replace("_", " "))
        if genre_id and genre_id not in ids:
            ids.append(genre_id)
    return ids


def _movie_id(item: dict[str, Any]) -> int | None:
    raw_id = item.get("id", item.get("tmdb_id"))
    try:
        return int(raw_id)
    except (TypeError, ValueError):
        return None


def _release_year(item: dict[str, Any]) -> int | None:
    date = str(item.get("release_date") or "")
    match = re.match(r"(\d{4})", date)
    return int(match.group(1)) if match else None


def _decade(item: dict[str, Any]) -> int | None:
    year = _release_year(item)
    return (year // 10) * 10 if year else None


def _primary_genre(item: dict[str, Any]) -> int | None:
    genres = item.get("genre_ids") or []
    return int(genres[0]) if genres else None


def _franchise_key(title: str) -> str:
    normalized = re.sub(r"\b(part|chapter|episode)\s+\w+\b", "", title.lower())
    normalized = re.split(r"[:\-]", normalized, maxsplit=1)[0]
    normalized = re.sub(r"\b\d+\b", "", normalized)
    normalized = re.sub(r"[^a-z0-9]+", " ", normalized).strip()
    return normalized or title.lower().strip()


def _overlap_score(source: list[int], target: list[int]) -> float:
    if not source or not target:
        return 0.0
    overlap = len(set(source) & set(target))
    return min(1.0, overlap / max(1, min(len(set(source)), len(set(target)))))


def _novelty_score(item: dict[str, Any]) -> float:
    year = _release_year(item)
    if year is None:
        return 0.45
    if 2015 <= year <= 2024:
        return 1.0
    if year >= 2025:
        return 0.75
    if year >= 2000:
        return 0.7
    return 0.35


def _rating_score(item: dict[str, Any]) -> float:
    try:
        rating = float(item.get("vote_average", item.get("rating", 0)) or 0)
    except (TypeError, ValueError):
        rating = 0.0
    return max(0.0, min(1.0, (rating - 6.2) / 3.8))


def _age_suitability(item: dict[str, Any], age_group: str) -> float:
    genres = [int(genre_id) for genre_id in item.get("genre_ids", []) if isinstance(genre_id, int)]
    preferred = AGE_SUITABILITY_GENRES.get(age_group, AGE_SUITABILITY_GENRES["adult"])
    if set(genres) & set(preferred):
        return 1.0
    if age_group == "teen" and ({80, 53} & set(genres)):
        return 0.25
    return 0.55


def _context_match(item: dict[str, Any], age_group: str) -> float:
    genres = [int(genre_id) for genre_id in item.get("genre_ids", []) if isinstance(genre_id, int)]
    return _overlap_score(genres, AGE_CONTEXT_GENRES.get(age_group, AGE_CONTEXT_GENRES["adult"]))


def _score_item(item: dict[str, Any], emotion: str, survey_ids: list[int], age_group: str) -> float:
    genres = [int(genre_id) for genre_id in item.get("genre_ids", []) if isinstance(genre_id, int)]
    emotion_match = _overlap_score(genres, EMOTION_GENRES.get(emotion, EMOTION_GENRES["calm"]))
    survey_match = _overlap_score(genres, survey_ids) if survey_ids else 0.5
    context_match = _context_match(item, age_group)
    novelty = _novelty_score(item)
    rating = _rating_score(item)
    age = _age_suitability(item, age_group)
    return (
        emotion_match * 0.30
        + survey_match * 0.25
        + context_match * 0.15
        + novelty * 0.15
        + rating * 0.10
        + age * 0.05
    )


def _apply_repeat_penalty(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[str] = set()
    sorted_items = sorted(items, key=lambda item: item["_score"], reverse=True)
    for item in sorted_items:
        franchise = _franchise_key(str(item.get("title") or ""))
        if franchise in seen:
            item["_score"] -= 0.3
        else:
            seen.add(franchise)
    return sorted(sorted_items, key=lambda item: item["_score"], reverse=True)


def _diversity_select(items: list[dict[str, Any]], limit: int = 3) -> list[dict[str, Any]]:
    selected: list[dict[str, Any]] = []
    remaining = list(items)
    while remaining and len(selected) < limit:
        best_item = None
        best_score = -999.0
        for item in remaining:
            diversity_penalty = 0.0
            item_primary = _primary_genre(item)
            item_decade = _decade(item)
            item_director = str(item.get("director") or "").strip().lower()
            for chosen in selected:
                if item_primary is not None and item_primary == _primary_genre(chosen):
                    diversity_penalty += 0.12
                if item_decade is not None and item_decade == _decade(chosen):
                    diversity_penalty += 0.08
                if item_director and item_director == str(chosen.get("director") or "").strip().lower():
                    diversity_penalty += 0.12
            candidate_score = float(item.get("_score", 0)) - diversity_penalty
            if candidate_score > best_score:
                best_score = candidate_score
                best_item = item
        if best_item is None:
            break
        selected.append(best_item)
        remaining = [item for item in remaining if _movie_id(item) != _movie_id(best_item)]
    return selected


def _seed_value(user_id: str | None, date_bucket: str, emotion: str, analysis_text: str | None) -> int:
    seed_text = f"{user_id or 'guest'}|{date_bucket}|{emotion}|{(analysis_text or '')[:50]}"
    return int(hashlib.sha256(seed_text.encode("utf-8")).hexdigest()[:16], 16)


def _stable_shuffle(items: list[dict[str, Any]], seed: int) -> list[dict[str, Any]]:
    shuffled = list(items)
    random.Random(seed).shuffle(shuffled)
    return shuffled


def _map_movie(item: dict[str, Any]) -> dict[str, Any]:
    movie_id = _movie_id(item)
    poster_path = item.get("poster_path")
    return {
        "tmdb_id": movie_id,
        "title": item.get("title", "Unknown"),
        "overview": item.get("overview", ""),
        "poster": item.get("poster") or (f"{TMDB_IMAGE_BASE}{poster_path}" if poster_path else None),
        "rating": round(float(item.get("vote_average", item.get("rating", 0)) or 0), 1),
        "release_date": item.get("release_date", ""),
        "tmdb_url": item.get("tmdb_url") or f"https://www.themoviedb.org/movie/{movie_id or ''}",
        "genre_ids": item.get("genre_ids", []),
        "director": item.get("director"),
    }


def _load_fallback_pool() -> list[dict[str, Any]]:
    try:
        with FALLBACK_PATH.open("r", encoding="utf-8") as handle:
            payload = json.load(handle)
        return payload if isinstance(payload, list) else []
    except Exception as exc:
        print(f"Film fallback load error: {exc}")
        return []


def _fallback_movies(seed: int, excluded_ids: set[int], limit: int = 3) -> list[dict[str, Any]]:
    pool = _stable_shuffle(_load_fallback_pool(), seed)
    selected = [_map_movie(item) for item in pool if (_movie_id(item) not in excluded_ids)][:limit]
    if len(selected) < limit:
        selected.extend(_map_movie(item) for item in pool if _movie_id(item) in excluded_ids)
    return selected[:limit]


async def _search_movies_page(client: httpx.AsyncClient, query: str, api_language: str, page: int) -> list[dict[str, Any]]:
    response = await client.get(
        f"{TMDB_BASE_URL}/search/movie",
        params={
            "api_key": TMDB_API_KEY,
            "query": query,
            "language": api_language,
            "page": page,
            "include_adult": False,
        },
    )
    response.raise_for_status()
    results = response.json().get("results", [])
    return [
        item
        for item in results
        if item.get("vote_count", 0) >= 80
        and float(item.get("vote_average", 0) or 0) >= 6.2
        and not item.get("adult", False)
    ]


async def _discover_movies(client: httpx.AsyncClient, genre_ids: list[int], api_language: str) -> list[dict[str, Any]]:
    response = await client.get(
        f"{TMDB_BASE_URL}/discover/movie",
        params={
            "api_key": TMDB_API_KEY,
            "with_genres": ",".join(str(genre_id) for genre_id in genre_ids),
            "sort_by": "popularity.desc",
            "language": api_language,
            "page": 1,
            "include_adult": False,
            "vote_average.gte": 6.2,
            "vote_count.gte": 80,
        },
    )
    response.raise_for_status()
    return response.json().get("results", [])


async def _fetch_director(client: httpx.AsyncClient, movie_id: int) -> tuple[int, str | None]:
    try:
        response = await client.get(
            f"{TMDB_BASE_URL}/movie/{movie_id}/credits",
            params={"api_key": TMDB_API_KEY},
        )
        response.raise_for_status()
        crew = response.json().get("crew", [])
        director = next((item.get("name") for item in crew if item.get("job") == "Director"), None)
        return movie_id, director
    except Exception:
        return movie_id, None


async def _hydrate_directors(items: list[dict[str, Any]], api_language: str) -> None:
    del api_language
    top_items = items[:30]
    async with httpx.AsyncClient(timeout=default_http_timeout(12.0)) as client:
        tasks = [
            _fetch_director(client, movie_id)
            for movie_id in (_movie_id(item) for item in top_items)
            if movie_id is not None
        ]
        for movie_id, director in await asyncio.gather(*tasks, return_exceptions=False):
            if not director:
                continue
            for item in top_items:
                if _movie_id(item) == movie_id:
                    item["director"] = director
                    break


async def get_movie_recommendations(
    emotion: str,
    context: str | None = None,
    language: str = "en",
    queries: list[str] | None = None,
    age_group: str | None = None,
    survey_genres: list[str] | None = None,
    user_id: str | None = None,
    excluded_movie_ids: list[int] | None = None,
    analysis_text: str | None = None,
) -> list:
    normalized_emotion = normalize_emotion_key(emotion, "calm")
    normalized_age_group = _normalize_age_group(age_group)
    normalized_survey_genres = _normalize_survey_genres(survey_genres)
    survey_ids = _survey_genre_ids(normalized_survey_genres)
    api_language = _normalize_language(language)
    date_bucket = datetime.now(timezone.utc).date().isoformat()
    compacted_context = compact_context(context, max_chars=240)
    seed = _seed_value(user_id, date_bucket, normalized_emotion, analysis_text or compacted_context)
    excluded_ids = {int(item) for item in (excluded_movie_ids or []) if item is not None}

    film_query_payload = await generate_film_search_queries(
        normalized_emotion,
        normalized_age_group,
        normalized_survey_genres,
        language,
    )
    generated_queries = [
        film_query_payload.get("query_emotion", ""),
        film_query_payload.get("query_genre", ""),
        film_query_payload.get("query_context", ""),
    ]
    search_queries = [item.strip() for item in [*(queries or []), *generated_queries] if str(item).strip()]
    search_queries = list(dict.fromkeys(search_queries))[:3]
    query_hash = hashlib.sha256(json.dumps(search_queries, ensure_ascii=False, sort_keys=True).encode("utf-8")).hexdigest()
    cache_key = build_cache_key(
        "tmdb",
        {
            "user_id": user_id or "guest",
            "emotion": normalized_emotion,
            "age_group": normalized_age_group,
            "survey_movie_genres": normalized_survey_genres,
            "gemini_query_hash": query_hash,
            "date_bucket": date_bucket,
        },
    )
    cached_movies = await TMDB_CACHE.get(cache_key)
    if cached_movies is not None:
        filtered_cached = [
            item for item in cached_movies
            if _movie_id(item) not in excluded_ids
        ]
        if len(filtered_cached) >= 3:
            return filtered_cached[:3]

    try:
        if not TMDB_API_KEY:
            raise ValueError("TMDB API key not configured")

        discover_genres = survey_ids or EMOTION_GENRES.get(normalized_emotion, EMOTION_GENRES["calm"])
        async with httpx.AsyncClient(timeout=default_http_timeout(14.0)) as client:
            search_tasks = [
                _search_movies_page(client, search_query, api_language, page)
                for search_query in search_queries
                for page in (1, 2, 3)
            ]
            discover_task = _discover_movies(client, discover_genres, api_language)
            task_results = await asyncio.gather(*search_tasks, discover_task, return_exceptions=True)

        candidates: list[dict[str, Any]] = []
        provider_failures = 0
        for result in task_results:
            if isinstance(result, Exception):
                provider_failures += 1
                print(f"TMDB candidate fetch warning: {result}")
                continue
            candidates.extend(result)

        if provider_failures == len(task_results) or (provider_failures > 0 and not candidates):
            raise RuntimeError("TMDB provider unavailable")

        deduped: dict[int, dict[str, Any]] = {}
        for item in candidates:
            movie_id = _movie_id(item)
            if movie_id is None or movie_id in excluded_ids or item.get("adult", False):
                continue
            deduped.setdefault(movie_id, item)

        scored = []
        for item in deduped.values():
            item["_score"] = _score_item(item, normalized_emotion, survey_ids, normalized_age_group)
            scored.append(item)

        scored = _apply_repeat_penalty(scored)
        await _hydrate_directors(scored, api_language)
        selected = _diversity_select(scored, limit=3)
        movies = [_map_movie(item) for item in _stable_shuffle(selected, seed)]

        if len(movies) < 3:
            fallback = _fallback_movies(seed, excluded_ids | {_movie_id(item) for item in movies if _movie_id(item)}, 3 - len(movies))
            movies.extend(fallback)

        movies = movies[:3]
        if not movies:
            movies = _fallback_movies(seed, excluded_ids, 3)

        if not excluded_ids:
            await TMDB_CACHE.set(cache_key, movies)
        return movies
    except Exception as exc:
        print(f"TMDB API error: {exc}")
        fallback = _fallback_movies(seed, excluded_ids, 3)
        raise MovieRecommendationProviderError(str(exc), fallback) from exc
