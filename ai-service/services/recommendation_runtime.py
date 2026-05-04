from __future__ import annotations

import asyncio
import hashlib
import json
import re
import time
from collections import OrderedDict
from typing import Any

import httpx


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
        async with self._lock:
            entry = self._entries.get(key)
            if entry is None:
                return None

            if not allow_stale and entry["expires_at"] <= time.time():
                return None

            self._entries.move_to_end(key)
            return entry["value"]

    async def set(self, key: str, value: Any) -> Any:
        async with self._lock:
            self._entries[key] = {
                "value": value,
                "expires_at": time.time() + self.ttl_seconds,
            }
            self._entries.move_to_end(key)
            while len(self._entries) > self.max_entries:
                self._entries.popitem(last=False)
            return value


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

