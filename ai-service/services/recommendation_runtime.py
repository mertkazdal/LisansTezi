from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import os
import re
import time
from collections import OrderedDict
from typing import Any

import httpx

try:
    import redis.asyncio as redis
except ImportError:  # pragma: no cover - optional fallback for local partial installs
    redis = None


logger = logging.getLogger(__name__)
_redis_client: Any | None = None
_redis_failure_at = 0.0


NOISY_CONTEXT_MARKERS = (
    "facial signal:",
    "combined text result:",
    "image-first analysis.",
    "gorsel odakli analiz.",
    "yuz sinyali:",
    "metinle birlesik sonuc:",
    "confidence:",
    "guven:",
)


class AsyncTTLCache:
    def __init__(self, ttl_seconds: int = 900, max_entries: int = 128):
        self.ttl_seconds = ttl_seconds
        self.max_entries = max_entries
        self._entries: OrderedDict[str, dict[str, Any]] = OrderedDict()
        self._lock = asyncio.Lock()

    async def get(self, key: str, allow_stale: bool = False) -> Any | None:
        redis_entry = await self._get_from_redis(key, allow_stale=allow_stale)
        if redis_entry is not None:
            async with self._lock:
                self._entries[key] = {
                    "value": redis_entry,
                    "expires_at": time.time() + self.ttl_seconds,
                }
                self._entries.move_to_end(key)
            return redis_entry

        async with self._lock:
            entry = self._entries.get(key)
            if entry is None:
                return None

            if not allow_stale and entry["expires_at"] <= time.time():
                return None

            self._entries.move_to_end(key)
            return entry["value"]

    async def set(self, key: str, value: Any) -> Any:
        await self._set_in_redis(key, value)
        async with self._lock:
            self._entries[key] = {
                "value": value,
                "expires_at": time.time() + self.ttl_seconds,
            }
            self._entries.move_to_end(key)
            while len(self._entries) > self.max_entries:
                self._entries.popitem(last=False)
            return value

    async def _get_from_redis(self, key: str, allow_stale: bool) -> Any | None:
        client = await _get_redis_client()
        if client is None:
            return None

        try:
            payload = await client.get(_redis_cache_key(key))
            if not payload:
                return None

            entry = json.loads(payload)
            expires_at = float(entry.get("expires_at", 0))
            if not allow_stale and expires_at <= time.time():
                return None

            return entry.get("value")
        except Exception as exc:  # noqa: BLE001 - cache must never break recommendations
            logger.warning("Redis cache read failed for %s: %s", key, exc)
            return None

    async def _set_in_redis(self, key: str, value: Any) -> None:
        client = await _get_redis_client()
        if client is None:
            return

        try:
            entry = {
                "value": value,
                "expires_at": time.time() + self.ttl_seconds,
            }
            ttl = max(self.ttl_seconds * 2, self.ttl_seconds + 60)
            await client.set(
                _redis_cache_key(key),
                json.dumps(entry, ensure_ascii=False, default=str),
                ex=ttl,
            )
        except Exception as exc:  # noqa: BLE001 - cache must never break recommendations
            logger.warning("Redis cache write failed for %s: %s", key, exc)


def build_cache_key(prefix: str, payload: Any) -> str:
    raw = json.dumps(payload, ensure_ascii=False, sort_keys=True, default=str)
    digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()
    return f"{prefix}:{digest}"


def compact_context(context: str | None, max_chars: int = 280) -> str:
    raw = (context or "").strip()
    if not raw:
        return ""

    lines = [line.strip() for line in raw.splitlines() if line.strip()]
    filtered_lines = []
    for line in lines:
        lowered = line.lower()
        if any(marker in lowered for marker in NOISY_CONTEXT_MARKERS):
            continue
        filtered_lines.append(line)

    candidate = " ".join(filtered_lines or lines[:1])
    candidate = re.sub(r"\s+", " ", candidate).strip()
    if len(candidate) <= max_chars:
        return candidate

    truncated = candidate[:max_chars].rsplit(" ", 1)[0].strip()
    return truncated or candidate[:max_chars].strip()


def default_http_timeout(total_seconds: float = 12.0) -> httpx.Timeout:
    return httpx.Timeout(total_seconds, connect=4.0, read=total_seconds, write=8.0, pool=4.0)


async def redis_health() -> dict[str, Any]:
    url = os.getenv("REDIS_URL", "").strip()
    if not url:
        return {"configured": False, "available": False, "status": "not_configured"}

    if redis is None:
        return {"configured": True, "available": False, "status": "package_missing"}

    try:
        client = await _get_redis_client(force=True)
        if client is None:
            return {"configured": True, "available": False, "status": "connection_unavailable"}

        start = time.perf_counter()
        await client.ping()
        latency_ms = round((time.perf_counter() - start) * 1000, 2)
        return {
            "configured": True,
            "available": True,
            "status": "ok",
            "latencyMs": latency_ms,
        }
    except Exception as exc:  # noqa: BLE001
        return {
            "configured": True,
            "available": False,
            "status": "error",
            "detail": exc.__class__.__name__,
        }


async def _get_redis_client(force: bool = False) -> Any | None:
    global _redis_client, _redis_failure_at

    url = os.getenv("REDIS_URL", "").strip()
    if not url or redis is None:
        return None

    if _redis_client is not None:
        return _redis_client

    if not force and time.time() - _redis_failure_at < 15:
        return None

    try:
        _redis_client = redis.from_url(
            url,
            encoding="utf-8",
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=2,
        )
        await _redis_client.ping()
        logger.info("Redis connection established")
        return _redis_client
    except Exception as exc:  # noqa: BLE001
        _redis_failure_at = time.time()
        logger.warning("Redis unavailable; falling back to in-memory cache: %s", exc)
        _redis_client = None
        return None


def _redis_cache_key(key: str) -> str:
    return f"recommendation-cache:{key}"
