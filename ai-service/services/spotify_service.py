from __future__ import annotations

import asyncio
import base64
import os
import time

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


def _clean_env(name: str) -> str:
    return os.getenv(name, "").strip().strip('"').strip("'")


SPOTIFY_CLIENT_ID = _clean_env("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = _clean_env("SPOTIFY_CLIENT_SECRET")
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_SEARCH_URL = "https://api.spotify.com/v1/search"
SPOTIFY_CACHE = AsyncTTLCache(ttl_seconds=1800, max_entries=256)
SPOTIFY_TOKEN_LOCK = asyncio.Lock()
SPOTIFY_TOKEN: dict[str, float | str | None] = {
    "value": None,
    "expires_at": 0.0,
}

MOOD_QUERIES = {
    "happy": "happy upbeat feel good",
    "sad": "sad melancholy emotional",
    "angry": "intense aggressive rock",
    "anxious": "calming ambient meditation",
    "excited": "energetic dance party",
    "calm": "peaceful relaxing ambient",
    "tired": "gentle soft acoustic",
    "stressed": "stress relief relaxation",
    "nostalgic": "nostalgic throwback oldies",
    "motivated": "motivational workout pump up",
    "hopeful": "hopeful uplifting fresh start",
    "overwhelmed": "soft reset calming focus",
}


async def get_access_token() -> str:
    if not SPOTIFY_CLIENT_ID or not SPOTIFY_CLIENT_SECRET:
        raise ValueError("Spotify credentials not configured")

    now = time.time()
    cached_value = SPOTIFY_TOKEN["value"]
    if isinstance(cached_value, str) and float(SPOTIFY_TOKEN["expires_at"] or 0.0) > now + 30:
        return cached_value

    async with SPOTIFY_TOKEN_LOCK:
        now = time.time()
        cached_value = SPOTIFY_TOKEN["value"]
        if isinstance(cached_value, str) and float(SPOTIFY_TOKEN["expires_at"] or 0.0) > now + 30:
            return cached_value

        auth_str = f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}"
        auth_b64 = base64.b64encode(auth_str.encode()).decode()

        async with httpx.AsyncClient(timeout=default_http_timeout(10.0)) as client:
            response = await client.post(
                SPOTIFY_TOKEN_URL,
                headers={
                    "Authorization": f"Basic {auth_b64}",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                data={"grant_type": "client_credentials"},
            )
            response.raise_for_status()
            payload = response.json()

        access_token = payload["access_token"]
        expires_in = max(60, int(payload.get("expires_in", 3600)))
        SPOTIFY_TOKEN["value"] = access_token
        SPOTIFY_TOKEN["expires_at"] = time.time() + expires_in - 30
        return access_token


def _map_tracks(items: list[dict]) -> list[dict]:
    tracks: list[dict] = []
    for item in items[:8]:
        album_images = item.get("album", {}).get("images", [])
        tracks.append(
            {
                "title": item.get("name", "Unknown"),
                "artist": ", ".join(artist.get("name", "") for artist in item.get("artists", [])),
                "album": item.get("album", {}).get("name", "Unknown"),
                "image": album_images[0]["url"] if album_images else None,
                "preview_url": item.get("preview_url"),
                "spotify_url": item.get("external_urls", {}).get("spotify", ""),
                "duration_ms": item.get("duration_ms", 0),
            }
        )
    return tracks


async def _search_tracks(token: str, query: str) -> list[dict]:
    async with httpx.AsyncClient(timeout=default_http_timeout(10.0)) as client:
        response = await client.get(
            SPOTIFY_SEARCH_URL,
            headers={"Authorization": f"Bearer {token}"},
            params={
                "q": query,
                "type": "track",
                "limit": 8,
                "market": "US",
            },
        )
        response.raise_for_status()
        data = response.json()
    return data.get("tracks", {}).get("items", [])


async def get_music_recommendations(emotion: str, context: str | None = None) -> list:
    normalized_emotion = normalize_emotion_key(emotion, "calm")
    compacted_context = compact_context(context, max_chars=180)
    base_query = MOOD_QUERIES.get(normalized_emotion, MOOD_QUERIES["calm"])
    query = append_context_to_query(base_query, compacted_context) if compacted_context else base_query
    cache_key = build_cache_key(
        "spotify",
        {
            "emotion": normalized_emotion,
            "context": compacted_context,
        },
    )
    cached_tracks = await SPOTIFY_CACHE.get(cache_key)
    if cached_tracks is not None:
        return cached_tracks

    stale_tracks = await SPOTIFY_CACHE.get(cache_key, allow_stale=True)

    try:
        token = await get_access_token()
        items = await _search_tracks(token, query)
        if query != base_query and not items:
            items = await _search_tracks(token, base_query)

        tracks = _map_tracks(items)
        if tracks:
            await SPOTIFY_CACHE.set(cache_key, tracks)
            return tracks

        return stale_tracks or []
    except Exception as exc:
        print(f"Spotify API error: {exc}")
        return stale_tracks or []
