from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from typing import Any

import google.generativeai as genai

from services.gemini_key_manager import GeminiKeyError, GeminiPipelineLease, gemini_key_manager
from services.personality_service import DIMENSIONS, _derive_mbti


UPDATE_INTERVAL_SECONDS = 3 * 24 * 60 * 60


def should_update_personality(last_updated: str | None) -> bool:
    if not last_updated:
        return True
    try:
        parsed = datetime.fromisoformat(last_updated.replace("Z", "+00:00"))
    except ValueError:
        return True
    return (datetime.now(timezone.utc) - parsed).total_seconds() > UPDATE_INTERVAL_SECONDS


def build_personality_update_payload(
    current_personality: dict[str, Any] | None,
    spotify_summary: dict[str, Any] | None,
    recent_content: dict[str, Any] | None,
) -> dict[str, Any]:
    return {
        "currentPersonality": current_personality or {},
        "spotifySummary": spotify_summary or {},
        "recentContent": recent_content or {},
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }


def update_personality_from_behavior(
    current_personality: dict[str, Any] | None,
    last_updated: str | None,
    spotify_summary: dict[str, Any] | None,
    recent_content: dict[str, Any] | None,
    language: str = "tr",
    lease: GeminiPipelineLease | None = None,
) -> dict[str, Any]:
    if not should_update_personality(last_updated):
        return {
            "updated": False,
            "personality": current_personality or {},
            "updatedAt": last_updated,
        }

    if not _has_behavior_source(spotify_summary, recent_content):
        return {
            "updated": False,
            "skipped": True,
            "reason": "no_behavior_sources",
            "personality": current_personality or {},
            "updatedAt": last_updated,
        }

    fallback = _fallback_update(current_personality)
    pipeline_lease = lease or gemini_key_manager.begin_pipeline()
    try:
        key, _ = pipeline_lease.get_key("personality_update", optional=True)
    except GeminiKeyError:
        key = None

    if not key:
        return fallback

    payload = build_personality_update_payload(current_personality, spotify_summary, recent_content)
    prompt = f"""
You are updating a private backend-only personality profile.
Use the current Big Five profile plus behavioral signals from Spotify and recent film/book content.
Make only small, evidence-based changes and keep values between 0 and 100.
Return ONLY valid JSON:
{{
  "openness": 0-100,
  "conscientiousness": 0-100,
  "extraversion": 0-100,
  "agreeableness": 0-100,
  "neuroticism": 0-100,
  "mbti": "INFP|ENFJ|...",
  "summary": "brief internal note"
}}
Language hint: {language}
Data: {json.dumps(payload, ensure_ascii=False)}
""".strip()

    try:
        genai.configure(api_key=key)
        model = genai.GenerativeModel("gemini-3-flash-preview")
        response = model.generate_content(prompt)
        parsed = _parse_json(getattr(response, "text", ""))
        personality = _normalize_personality(parsed, fallback["personality"])
    except Exception:
        return fallback

    return {
        "updated": True,
        "personality": personality,
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }


def _fallback_update(current_personality: dict[str, Any] | None) -> dict[str, Any]:
    personality = _normalize_personality(current_personality or {}, {})
    return {
        "updated": True,
        "personality": personality,
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "fallback": True,
    }


def _has_behavior_source(
    spotify_summary: dict[str, Any] | None,
    recent_content: dict[str, Any] | None,
) -> bool:
    if _has_meaningful_value(spotify_summary):
        return True

    if not isinstance(recent_content, dict):
        return False

    film = recent_content.get("film")
    book = recent_content.get("book")
    return _has_meaningful_value(film) or _has_meaningful_value(book)


def _has_meaningful_value(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, dict):
        return any(_has_meaningful_value(item) for item in value.values())
    if isinstance(value, (list, tuple, set)):
        return any(_has_meaningful_value(item) for item in value)
    return True


def _parse_json(raw_text: str) -> dict[str, Any]:
    text = raw_text.strip()
    fenced = re.search(r"```(?:json)?\s*(\{.*\})\s*```", text, flags=re.DOTALL)
    if fenced:
        text = fenced.group(1)
    else:
        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end > start:
            text = text[start : end + 1]
    return json.loads(text)


def _normalize_personality(parsed: dict[str, Any], fallback: dict[str, Any]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for dimension in DIMENSIONS:
        try:
            raw_value = parsed.get(dimension, fallback.get(dimension, 50))
            result[dimension] = max(0, min(100, round(float(raw_value))))
        except (TypeError, ValueError):
            result[dimension] = 50

    mbti = str(parsed.get("mbti") or fallback.get("mbti") or _derive_mbti(result)).upper()
    result["mbti"] = mbti if len(mbti) == 4 else _derive_mbti(result)
    result["summary"] = str(parsed.get("summary") or fallback.get("summary") or "Behavioral update fallback.")[:1000]
    return result
