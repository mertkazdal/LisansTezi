import asyncio
import base64
import json
import os
import re
import urllib.parse
from typing import Any

import google.generativeai as genai
import httpx
from dotenv import load_dotenv
from services.emotion_catalog import (
    NEGATIVE_EMOTIONS,
    NEUTRAL_EMOTIONS,
    POSITIVE_EMOTIONS,
    VALID_EMOTION_SET,
    VALID_EMOTIONS,
    normalize_emotion_key,
)
from services.recommendation_runtime import AsyncTTLCache, build_cache_key, compact_context

load_dotenv()

MIN_SIGNAL_CONFIDENCE = 0.55
MODEL_ALIASES = {
    "gemini-3.0-flash-preview": "gemini-3-flash-preview",
    "models/gemini-3-flash-preview": "gemini-3-flash-preview",
}
DEFAULT_LIFE_ADVICE = {
    "en": [
        {
            "title": "Take a Breathing Break",
            "description": "Pause for a minute and take five slow breaths to help your mind settle.",
            "icon": "\U0001F9D8",
        },
        {
            "title": "Reach Out Gently",
            "description": "Send a short message to someone you trust so you do not have to carry the moment alone.",
            "icon": "\U0001F49B",
        },
        {
            "title": "Reset With Movement",
            "description": "A light walk, stretch, or glass of water can create enough momentum to shift your energy.",
            "icon": "\U0001F331",
        },
    ],
    "tr": [
        {
            "title": "Nefesine Don",
            "description": "Bir dakika durup bes yavas nefes al; bu, zihninin biraz daha toparlanmasina yardim eder.",
            "icon": "\U0001F9D8",
        },
        {
            "title": "Guvendigin Birine Yaz",
            "description": "Kisa bir mesaj bile bu yukun bir kismini paylasmana ve daha az yalniz hissetmene yardimci olabilir.",
            "icon": "\U0001F49B",
        },
        {
            "title": "Bedenini Hareket Ettir",
            "description": "Kisa bir yuruyus, esneme ya da su icmek enerjini toparlamak icin iyi bir baslangic olabilir.",
            "icon": "\U0001F331",
        },
    ],
}
DEFAULT_CLARIFICATION_MESSAGES = {
    "en": "Your selfie and text point to different emotions. Please retake the photo or rewrite your text and try again.",
    "tr": "Selfie ve yazdigin metin farkli duygular gosteriyor. Lutfen fotografi tekrar cek ya da metni yeniden yazip tekrar dene.",
}
DEFAULT_REASON_PROMPTS = {
    "en": "You seem to be going through something difficult. Can you tell me what is causing this feeling?",
    "tr": "Zor bir sey yasiyor gibisin. Seni boyle hissettiren seyin ne oldugunu paylasir misin?",
}
GEMINI_LOCK = asyncio.Lock()
LIFE_ADVICE_CACHE = AsyncTTLCache(ttl_seconds=1800, max_entries=256)
RECOMMENDATION_QUERY_CACHE = AsyncTTLCache(ttl_seconds=1800, max_entries=256)
VALID_EMOTION_PROMPT = ", ".join(VALID_EMOTIONS)
AVATAR_IMAGE_MODELS = ("gemini-2.5-flash-image", "gemini-2.0-flash")


class GeminiServiceError(Exception):
    def __init__(
        self,
        message: str,
        status_code: int,
        code: str,
        retry_after_seconds: int | None = None,
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code
        self.retry_after_seconds = retry_after_seconds


def _normalize_language(language: str | None) -> str:
    normalized = (language or "en").strip().lower()
    return "tr" if normalized.startswith("tr") else "en"


def _response_language_name(language: str) -> str:
    return "Turkish" if language == "tr" else "English"


def _default_clarification(language: str) -> str:
    return DEFAULT_CLARIFICATION_MESSAGES[_normalize_language(language)]


def _default_reason_prompt(language: str) -> str:
    return DEFAULT_REASON_PROMPTS[_normalize_language(language)]


def _default_life_advice(language: str) -> list:
    return DEFAULT_LIFE_ADVICE[_normalize_language(language)]


def _merge_warning_messages(current_warning: str | None, next_warning: str | None) -> str | None:
    current = str(current_warning or "").strip()
    upcoming = str(next_warning or "").strip()

    if not current:
        return upcoming or None

    if not upcoming:
        return current

    if current == upcoming:
        return current

    return f"{current} {upcoming}"


def _normalize_model_name(model_name: str | None) -> str:
    normalized = (model_name or "gemini-3-flash-preview").strip()
    return MODEL_ALIASES.get(normalized, normalized)


def _resolve_env_value(primary_name: str, fallback_name: str | None = None) -> str:
    primary_value = os.getenv(primary_name, "").strip()
    if primary_value:
        return primary_value

    if fallback_name:
        return os.getenv(fallback_name, "").strip()

    return ""


def _get_model(
    api_key_env: str = "GEMINI_API_KEY",
    model_env: str = "GEMINI_MODEL_NAME",
    fallback_api_key_env: str | None = None,
    fallback_model_env: str | None = None,
) -> genai.GenerativeModel:
    api_key = _resolve_env_value(api_key_env, fallback_api_key_env)
    if not api_key:
        raise GeminiServiceError(
            "Gemini API key is not configured.",
            500,
            "AI_CONFIG_ERROR",
        )

    model_name = _normalize_model_name(
        _resolve_env_value(model_env, fallback_model_env) or "gemini-3-flash-preview"
    )

    genai.configure(api_key=api_key)
    return genai.GenerativeModel(model_name)


def _extract_json_payload(response_text: str) -> dict:
    text = response_text.strip()
    fenced_match = re.search(r"```(?:json)?\s*(\{.*\})\s*```", text, flags=re.DOTALL)
    if fenced_match:
        text = fenced_match.group(1).strip()
    else:
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            text = text[start : end + 1]

    return json.loads(text)


def _normalize_emotion(value: Any, fallback: str | None = None) -> str | None:
    if value is None:
        return fallback

    emotion = str(value).strip().lower()
    if emotion in {"", "null", "none"}:
        return fallback

    if emotion in VALID_EMOTION_SET:
        return emotion

    return fallback


def _normalize_score(value: Any, fallback: float) -> float:
    try:
        score = float(value)
    except (TypeError, ValueError):
        score = fallback

    return max(0.0, min(1.0, score))


def _normalize_flag(value: Any, fallback: bool = False) -> bool:
    if isinstance(value, bool):
        return value

    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in {"true", "yes", "1"}:
            return True
        if normalized in {"false", "no", "0"}:
            return False

    return fallback


def _has_opposite_polarity(face_emotion: str | None, text_emotion: str | None) -> bool:
    if face_emotion in POSITIVE_EMOTIONS and text_emotion in NEGATIVE_EMOTIONS:
        return True

    if face_emotion in NEGATIVE_EMOTIONS and text_emotion in POSITIVE_EMOTIONS:
        return True

    return False


def _is_strong_contradiction(
    face_emotion: str | None,
    face_confidence: float,
    text_emotion: str | None,
    text_confidence: float,
) -> bool:
    if not face_emotion or not text_emotion or face_emotion == text_emotion:
        return False

    if face_confidence < MIN_SIGNAL_CONFIDENCE or text_confidence < MIN_SIGNAL_CONFIDENCE:
        return False

    if _has_opposite_polarity(face_emotion, text_emotion):
        return True

    if face_emotion in NEUTRAL_EMOTIONS or text_emotion in NEUTRAL_EMOTIONS:
        return False

    return False


def _normalize_analysis_result(result: dict, reason_text: str | None, language: str) -> dict:
    normalized_language = _normalize_language(language)
    face_emotion = _normalize_emotion(result.get("face_emotion"), "calm")
    text_emotion = _normalize_emotion(result.get("text_emotion"), "calm")
    emotion = _normalize_emotion(result.get("emotion"))
    face_confidence = _normalize_score(result.get("face_confidence", 0.5), 0.5)
    text_confidence = _normalize_score(result.get("text_confidence", 0.5), 0.5)
    confidence = _normalize_score(result.get("confidence", 0.5), 0.5)
    contradiction_detected = _normalize_flag(result.get("contradiction_detected"), False)
    clarification_message = (
        str(result.get("clarification_message", "")).strip()
        or _default_clarification(normalized_language)
    )
    explanation = str(result.get("explanation", "")).strip() or "Emotion analysis completed."
    reason_provided = _normalize_flag(result.get("reason_provided"), bool((reason_text or "").strip()))
    follow_up_question = (
        str(result.get("follow_up_question", "")).strip()
        or _default_reason_prompt(normalized_language)
    )

    if _is_strong_contradiction(face_emotion, face_confidence, text_emotion, text_confidence):
        contradiction_detected = True

    if contradiction_detected:
        emotion = None
        confidence = 0.0
    elif not emotion:
        if text_confidence >= face_confidence:
            emotion = text_emotion
            confidence = max(confidence, text_confidence)
        else:
            emotion = face_emotion
            confidence = max(confidence, face_confidence)

    final_emotion = emotion or "calm"
    needs_reason = (
        not contradiction_detected
        and final_emotion in NEGATIVE_EMOTIONS
        and not reason_provided
    )

    return {
        "emotion": final_emotion,
        "confidence": confidence,
        "explanation": explanation,
        "face_emotion": face_emotion,
        "face_confidence": face_confidence,
        "text_emotion": text_emotion,
        "text_confidence": text_confidence,
        "contradiction_detected": contradiction_detected,
        "clarification_message": clarification_message,
        "reason_provided": reason_provided,
        "needs_reason": needs_reason,
        "follow_up_question": follow_up_question,
    }


def _default_analysis_explanation(language: str, mode: str) -> str:
    if language == "tr":
        if mode == "image":
            return "Selfie sinyali uzerinden duygu analizi tamamlandi."
        if mode == "text":
            return "Metin uzerinden duygu analizi tamamlandi."
        return "Metin ve selfie birlikte degerlendirilerek duygu analizi tamamlandi."

    if mode == "image":
        return "Emotion analysis from the selfie signal has been completed."
    if mode == "text":
        return "Emotion analysis from the text signal has been completed."
    return "Emotion analysis has been completed by combining the text and selfie signals."


def _normalize_simple_analysis_result(
    result: dict,
    language: str,
    mode: str,
    fallback_emotion: str = "calm",
) -> dict:
    normalized_language = _normalize_language(language)
    emotion = _normalize_emotion(result.get("emotion"), fallback_emotion) or fallback_emotion
    confidence = _normalize_score(result.get("confidence", 0.68), 0.68)
    explanation = (
        str(result.get("explanation", "")).strip()
        or _default_analysis_explanation(normalized_language, mode)
    )

    return {
        "emotion": emotion,
        "confidence": confidence,
        "explanation": explanation,
    }


def _normalize_advice_items(items: list) -> list:
    normalized = []
    for item in items[:3]:
        if not isinstance(item, dict):
            continue

        title = str(item.get("title", "")).strip()
        description = str(item.get("description", "")).strip()
        if not title or not description:
            continue

        normalized.append(
            {
                "title": title,
                "description": description,
                "icon": str(item.get("icon", "\U0001F4A1")).strip() or "\U0001F4A1",
            }
        )

    return normalized


def _extract_retry_after_seconds(raw_message: str) -> int | None:
    patterns = [
        r"retry in ([0-9]+(?:\.[0-9]+)?)s",
        r"retry_delay\s*\{\s*seconds:\s*([0-9]+)",
        r'"seconds"\s*:\s*([0-9]+)',
    ]

    for pattern in patterns:
        match = re.search(pattern, raw_message, flags=re.IGNORECASE)
        if not match:
            continue

        try:
            return max(1, int(float(match.group(1))))
        except (TypeError, ValueError):
            return None

    return None


def _is_quota_error(raw_message: str) -> bool:
    lowered = raw_message.lower()
    return any(
        token in lowered
        for token in (
            "quota exceeded",
            "rate limit",
            "resource exhausted",
            "too many requests",
            "generate_content_free_tier_requests",
        )
    )


def _quota_message(language: str, retry_after_seconds: int | None) -> str:
    if language == "tr":
        if retry_after_seconds:
            return (
                "Gemini kullanim kotasi doldu. "
                f"Lutfen yaklasik {retry_after_seconds} saniye sonra tekrar dene."
            )
        return "Gemini kullanim kotasi doldu. Lutfen biraz sonra tekrar dene."

    if retry_after_seconds:
        return (
            "MoodLens has reached the current Gemini usage limit. "
            f"Please try again in about {retry_after_seconds} seconds."
        )

    return "MoodLens has reached the current Gemini usage limit. Please try again shortly."


def _provider_error_message(language: str, operation: str) -> str:
    if language == "tr":
        return f"Gemini su anda {operation} istegini isleyemiyor. Lutfen biraz sonra tekrar dene."

    return f"Gemini could not complete the {operation} request right now. Please try again shortly."


def _image_processing_error_message(language: str) -> str:
    if language == "tr":
        return (
            "Selfie islenemedi. Lutfen yuzu net gorunen, daha aydinlik bir fotografla tekrar dene "
            "veya yalnizca metinle devam et."
        )

    return (
        "The selfie could not be processed. Please try again with a clearer, front-facing photo "
        "or continue with text only."
    )


def _image_fallback_warning(language: str) -> str:
    if language == "tr":
        return (
            "Selfie okunamadi; analiz metin uzerinden tamamlandi. Daha net bir selfie ile tekrar denersen "
            "gorsel sinyal de sonuca dahil edilir."
        )

    return (
        "The selfie could not be read, so the analysis continued with text only. "
        "If you try again with a clearer selfie, the visual signal can be included too."
    )


def _is_unprocessable_image_error(raw_message: str) -> bool:
    lowered = raw_message.lower()
    return any(
        token in lowered
        for token in (
            "unable to process input image",
            "invalid image",
            "unsupported image",
            "could not process image",
        )
    )


def _map_gemini_exception(exc: Exception, language: str, operation: str) -> GeminiServiceError:
    raw_message = str(exc).strip()

    if _is_quota_error(raw_message):
        retry_after_seconds = _extract_retry_after_seconds(raw_message)
        return GeminiServiceError(
            _quota_message(language, retry_after_seconds),
            429,
            "AI_QUOTA_EXCEEDED",
            retry_after_seconds,
        )

    if operation == "image-analysis" and _is_unprocessable_image_error(raw_message):
        return GeminiServiceError(
            _image_processing_error_message(language),
            400,
            "IMAGE_UNPROCESSABLE",
        )

    return GeminiServiceError(
        _provider_error_message(language, operation),
        502,
        "AI_PROVIDER_ERROR",
    )


async def _generate_content(
    prompt_payload: Any,
    language: str,
    operation: str,
    api_key_env: str = "GEMINI_API_KEY",
    model_env: str = "GEMINI_MODEL_NAME",
    fallback_api_key_env: str | None = None,
    fallback_model_env: str | None = None,
):
    async with GEMINI_LOCK:
        try:
            model = _get_model(
                api_key_env=api_key_env,
                model_env=model_env,
                fallback_api_key_env=fallback_api_key_env,
                fallback_model_env=fallback_model_env,
            )
            return await asyncio.to_thread(model.generate_content, prompt_payload)
        except GeminiServiceError:
            raise
        except Exception as exc:
            raise _map_gemini_exception(exc, language, operation) from exc


def _read_response_text(response: Any, language: str) -> str:
    try:
        response_text = response.text or ""
    except ValueError as exc:
        raise GeminiServiceError(
            _invalid_response_message(language),
            502,
            "AI_BLOCKED_RESPONSE",
        ) from exc

    normalized_text = str(response_text).strip()
    if normalized_text:
        return normalized_text

    raise GeminiServiceError(
        _invalid_response_message(language),
        502,
        "AI_INVALID_RESPONSE",
    )


def _analysis_explanation(language: str, mode: str, emotion: str) -> str:
    if language == "tr":
        if mode == "image":
            return f"Gorsel sinyal analiz edildi ve baskin duygu {emotion} olarak siniflandirildi."
        if mode == "text":
            return f"Metin analiz edildi ve baskin duygu {emotion} olarak siniflandirildi."
        return f"Metin ve gorsel sinyal birlikte degerlendirildi; baskin duygu {emotion}."

    if mode == "image":
        return f"The visual signal was analyzed and classified as {emotion}."
    if mode == "text":
        return f"The text was analyzed and classified as {emotion}."
    return f"The text and visual signals were evaluated together; the dominant emotion is {emotion}."


async def _try_local_face_emotion(
    image_base64: str,
    mime_type: str | None,
    language: str,
) -> dict | None:
    if os.getenv("IMAGE_EMOTION_PROVIDER", "gemini").strip().lower() != "local":
        return None

    try:
        from services.local_face_emotion_service import analyze_face_emotion

        return await asyncio.to_thread(
            analyze_face_emotion,
            image_base64,
            mime_type,
            language,
        )
    except Exception as exc:
        print(f"Local face emotion model unavailable, falling back to Gemini vision: {exc}")
        return None


async def _analyze_image_signal(
    image_base64: str,
    mime_type: str | None,
    language: str,
) -> dict:
    local_result = await _try_local_face_emotion(image_base64, mime_type, language)
    if local_result:
        return local_result

    normalized_language = _normalize_language(language)
    image_bytes = base64.b64decode(image_base64, validate=True)
    normalized_mime = mime_type or "image/jpeg"
    language_name = _response_language_name(normalized_language)
    prompt = f"""
Analyze the user's facial emotion from this validated single-face image.
Classify into exactly one of these emotions:
{VALID_EMOTION_PROMPT}

Return ONLY valid JSON:
{{"emotion": "...", "confidence": 0.0-1.0, "reasoning": "brief internal note"}}

Respond in {language_name}.
""".strip()

    response = await _generate_content(
        [prompt, {"mime_type": normalized_mime, "data": image_bytes}],
        normalized_language,
        "image-analysis",
        api_key_env="GEMINI_API_KEY",
        fallback_api_key_env="GEMINI_KEY_TEXT_EMOTION",
    )
    response_text = _read_response_text(response, normalized_language)

    try:
        result = _extract_json_payload(response_text)
    except json.JSONDecodeError as exc:
        raise GeminiServiceError(
            "Gemini returned an invalid image analysis response.",
            502,
            "AI_INVALID_RESPONSE",
        ) from exc

    emotion = _normalize_emotion(result.get("emotion"), "calm") or "calm"
    confidence = _normalize_score(result.get("confidence", 0.55), 0.55)
    return {
        "emotion": emotion,
        "confidence": confidence,
        "explanation": _analysis_explanation(normalized_language, "image", emotion),
        "raw_emotion": emotion,
    }


async def _resolve_conflict_signal(
    image_emotion: str,
    image_confidence: float,
    text_emotion: str,
    text_confidence: float,
    personality_json: str | None,
    language: str,
    api_key_env: str,
) -> dict:
    prompt = f"""
Two emotion signals conflict. Image analysis shows {image_emotion} ({image_confidence}). Text analysis shows {text_emotion} ({text_confidence}). User personality: {personality_json or "{}"}. Determine which signal is more authentic and why. Return ONLY JSON: {{"resolved_emotion": "...", "resolved_confidence": 0.0-1.0, "conflict_note": "...", "is_true_conflict": bool}}
""".strip()

    response = await _generate_content(
        prompt,
        language,
        "conflict-resolution",
        api_key_env=api_key_env,
        fallback_api_key_env="GEMINI_API_KEY",
    )
    response_text = _read_response_text(response, language)

    try:
        result = _extract_json_payload(response_text)
    except json.JSONDecodeError as exc:
        raise GeminiServiceError(
            "Gemini returned an invalid conflict response.",
            502,
            "AI_INVALID_RESPONSE",
        ) from exc

    resolved_emotion = _normalize_emotion(result.get("resolved_emotion"), text_emotion) or text_emotion
    resolved_confidence = _normalize_score(
        result.get("resolved_confidence", max(image_confidence, text_confidence)),
        max(image_confidence, text_confidence),
    )
    return {
        "resolved_emotion": resolved_emotion,
        "resolved_confidence": resolved_confidence,
        "conflict_note": str(result.get("conflict_note") or "").strip(),
        "is_true_conflict": bool(result.get("is_true_conflict", False)),
    }


def _resolve_conflict_key_env(analysis_key_env: str | None) -> str:
    candidate = (analysis_key_env or "").strip()
    if candidate in {"GEMINI_KEY_CONFLICT_1", "GEMINI_KEY_CONFLICT_2", "GEMINI_KEY_CONFLICT_3"}:
        return candidate
    return "GEMINI_KEY_CONFLICT_1"


async def analyze_emotion(
    image_base64: str | None = None,
    user_text: str | None = None,
    mime_type: str | None = "image/jpeg",
    language: str = "en",
    analysis_key_env: str | None = None,
) -> dict:
    normalized_language = _normalize_language(language)
    cleaned_text = (user_text or "").strip()
    cleaned_image = (image_base64 or "").strip()
    has_text = bool(cleaned_text)
    has_image = bool(cleaned_image)
    warning: str | None = None
    image_fallback_used = False

    if not has_text and not has_image:
        raise GeminiServiceError(
            "At least one input is required.",
            400,
            "ANALYSIS_INPUT_REQUIRED",
        )

    face_result = None
    if has_image:
        try:
            face_result = await _analyze_image_signal(
                cleaned_image,
                mime_type,
                normalized_language,
            )
        except GeminiServiceError:
            raise
        except Exception as exc:
            if not has_text:
                raise GeminiServiceError(
                    _image_processing_error_message(normalized_language),
                    400,
                    "IMAGE_UNPROCESSABLE",
                ) from exc
            warning = _image_fallback_warning(normalized_language)
            image_fallback_used = True

    text_result = await _analyze_text_signal(cleaned_text, normalized_language) if has_text else None

    if has_image and has_text:
        face_emotion = face_result["emotion"] if face_result else None
        face_confidence = face_result["confidence"] if face_result else None
        text_emotion = text_result["emotion"] if text_result else "calm"
        text_confidence = text_result["confidence"] if text_result else 0.0
        contradiction_detected = _is_strong_contradiction(
            face_emotion,
            float(face_confidence or 0.0),
            text_emotion,
            float(text_confidence or 0.0),
        )
        clarification_message = ""
        conflict_note = ""
        final_emotion = text_emotion
        final_confidence = float(text_confidence or 0.0)

        if contradiction_detected and face_result:
            resolution = await _resolve_conflict_signal(
                face_emotion or "calm",
                float(face_confidence or 0.0),
                text_emotion,
                float(text_confidence or 0.0),
                None,
                normalized_language,
                _resolve_conflict_key_env(analysis_key_env),
            )
            final_emotion = resolution["resolved_emotion"]
            final_confidence = resolution["resolved_confidence"]
            conflict_note = resolution["conflict_note"]
            contradiction_detected = bool(resolution["is_true_conflict"])
            clarification_message = _default_clarification(normalized_language) if contradiction_detected else conflict_note
            warning = _merge_warning_messages(warning, clarification_message if contradiction_detected else None)
        elif face_result and float(face_confidence or 0.0) > final_confidence:
            final_emotion = face_emotion or final_emotion
            final_confidence = float(face_confidence or final_confidence)

        return {
            "emotion": final_emotion,
            "confidence": final_confidence,
            "explanation": _analysis_explanation(normalized_language, "combined", final_emotion),
            "face_emotion": face_emotion,
            "face_confidence": face_confidence,
            "text_emotion": text_emotion,
            "text_confidence": text_confidence,
            "contradiction_detected": contradiction_detected,
            "clarification_message": clarification_message,
            "conflict_note": conflict_note,
            "reason_provided": True,
            "needs_reason": False,
            "follow_up_question": "",
            "warning": warning,
            "image_fallback_used": image_fallback_used,
        }

    if has_image:
        if not face_result:
            raise GeminiServiceError(
                _provider_error_message(normalized_language, "image-analysis"),
                502,
                "AI_INVALID_RESPONSE",
            )
        final_result = face_result
        return {
            "emotion": final_result["emotion"],
            "confidence": final_result["confidence"],
            "explanation": final_result["explanation"],
            "face_emotion": final_result["emotion"],
            "face_confidence": final_result["confidence"],
            "text_emotion": None,
            "text_confidence": None,
            "contradiction_detected": False,
            "clarification_message": "",
            "reason_provided": True,
            "needs_reason": False,
            "follow_up_question": "",
            "warning": warning,
            "image_fallback_used": image_fallback_used,
        }

    if not text_result:
        raise GeminiServiceError(
            _provider_error_message(normalized_language, "text-analysis"),
            502,
            "AI_INVALID_RESPONSE",
        )

    final_result = text_result
    return {
        "emotion": final_result["emotion"],
        "confidence": final_result["confidence"],
        "explanation": final_result["explanation"],
        "face_emotion": None,
        "face_confidence": None,
        "text_emotion": final_result["emotion"],
        "text_confidence": final_result["confidence"],
        "contradiction_detected": False,
        "clarification_message": "",
        "reason_provided": True,
        "needs_reason": False,
        "follow_up_question": "",
        "warning": warning,
        "image_fallback_used": image_fallback_used,
    }


async def _analyze_text_signal(
    user_text: str,
    language: str,
    face_context: dict | None = None,
) -> dict:
    language_name = _response_language_name(language)
    del face_context

    prompt = f"""
Analyze the emotional state of this text. Classify into exactly one of these emotions:
{VALID_EMOTION_PROMPT}
Return ONLY valid JSON: {{"emotion": "...", "confidence": 0.0-1.0, "reasoning": "..."}}
Text: {user_text}
Respond in {language_name}.
""".strip()

    response = await _generate_content(
        prompt,
        language,
        "text-analysis",
        api_key_env="GEMINI_KEY_TEXT_EMOTION",
        fallback_api_key_env="GEMINI_API_KEY",
    )
    response_text = getattr(response, "text", "").strip()
    if not response_text:
        raise GeminiServiceError(
            "Gemini returned an empty response.",
            502,
            "AI_INVALID_RESPONSE",
        )

    try:
        result = _extract_json_payload(response_text)
    except json.JSONDecodeError as exc:
        raise GeminiServiceError(
            "Gemini returned an invalid response format.",
            502,
            "AI_INVALID_RESPONSE",
        ) from exc

    normalized_result = _normalize_simple_analysis_result(
        result,
        language,
        "text",
        "calm",
    )

    normalized_result["text_emotion"] = normalized_result["emotion"]
    normalized_result["text_confidence"] = normalized_result["confidence"]
    return normalized_result


async def generate_life_advice(
    emotion: str,
    context: str | None = None,
    language: str = "en",
    prefer_followup_key: bool = False,
) -> list:
    normalized_language = _normalize_language(language)
    normalized_emotion = normalize_emotion_key(emotion, "calm")
    language_name = _response_language_name(normalized_language)
    compacted_context = compact_context(context, max_chars=320)
    cache_key = build_cache_key(
        "life-advice",
        {
            "emotion": normalized_emotion,
            "context": compacted_context,
            "language": normalized_language,
            "prefer_followup_key": bool(prefer_followup_key),
        },
    )
    cached_advice = await LIFE_ADVICE_CACHE.get(cache_key)
    if cached_advice is not None:
        return cached_advice

    stale_advice = await LIFE_ADVICE_CACHE.get(cache_key, allow_stale=True)
    context_block = ""
    if compacted_context:
        context_block = f'The user also shared this context: "{compacted_context}".\n'

    prompt = f"""
You are a compassionate life coach. The user is currently feeling **{normalized_emotion}**.
{context_block}Generate exactly 3 personalized, actionable life advice tips that would help someone
who is feeling {normalized_emotion}. Tailor the advice to the user's context when context is available.

Keep the output concise, low-cost, and practical:
- Each title should be short.
- Each description should be 1 sentence.
- Do not repeat the same coping pattern with different wording.

Write the titles and descriptions in {language_name}.

Respond ONLY in this JSON format:
{{
  "advice": [
    {{
      "title": "...",
      "description": "...",
      "icon": "..."
    }},
    {{
      "title": "...",
      "description": "...",
      "icon": "..."
    }},
    {{
      "title": "...",
      "description": "...",
      "icon": "..."
    }}
  ]
}}

For "icon", use one of these emoji: ğŸŒŸ, ğŸ’ª, ğŸ§˜, ğŸŒˆ, ğŸ’¡, ğŸ¯, â¤ï¸, ğŸŒ±, ğŸ”¥, ğŸ«¶
"""

    api_key_env = "GEMINI_FOLLOWUP_API_KEY" if prefer_followup_key else "GEMINI_API_KEY"
    model_env = "GEMINI_FOLLOWUP_MODEL_NAME" if prefer_followup_key else "GEMINI_MODEL_NAME"

    try:
        response = await _generate_content(
            prompt,
            normalized_language,
            "life-advice",
            api_key_env=api_key_env,
            model_env=model_env,
            fallback_api_key_env="GEMINI_API_KEY",
            fallback_model_env="GEMINI_MODEL_NAME",
        )
        response_text = getattr(response, "text", "").strip()
        if not response_text:
            raise GeminiServiceError(
                "Gemini returned an empty response.",
                502,
                "AI_INVALID_RESPONSE",
            )

        result = _extract_json_payload(response_text)
        advice = _normalize_advice_items(result.get("advice", []))
        final_advice = advice or _default_life_advice(normalized_language)
        await LIFE_ADVICE_CACHE.set(cache_key, final_advice)
        return final_advice
    except Exception as exc:
        print(f"Gemini life advice error: {exc}")
        return stale_advice or _default_life_advice(normalized_language)


def _default_coach_comment(emotion: str, language: str, context: str | None = None) -> str:
    has_context = bool((context or "").strip())
    if _normalize_language(language) == "tr":
        if has_context:
            return (
                f"Baskin duygu {emotion}. Bu sonucu sert bir etiket gibi degil, "
                "bugunku ritmini ayarlamana yardim eden bir sinyal gibi kullan."
            )
        return f"Baskin duygu {emotion}. Kendine kucuk, uygulanabilir ve sakin bir sonraki adim sec."

    if has_context:
        return (
            f"The dominant emotion looks like {emotion}. Treat it as a signal for adjusting today's pace, "
            "not as a hard label."
        )
    return f"The dominant emotion looks like {emotion}. Choose one small, realistic next step that supports you."


def _normalize_query_list(value: Any, fallback: list[str], limit: int = 3) -> list[str]:
    if not isinstance(value, list):
        return fallback[:limit]

    normalized = [
        str(item).strip()
        for item in value
        if isinstance(item, str) and str(item).strip()
    ]
    return (normalized or fallback)[:limit]


def _activities_to_advice(activities: list[str]) -> list[dict]:
    return [
        {
            "title": activity[:64],
            "description": activity,
            "icon": "AI",
        }
        for activity in activities[:5]
    ]


async def generate_recommendation_queries(
    emotion: str,
    context: str | None = None,
    language: str = "en",
    prefer_followup_key: bool = False,
) -> dict:
    normalized_language = _normalize_language(language)
    normalized_emotion = normalize_emotion_key(emotion, "calm")
    compacted_context = compact_context(context, max_chars=600)
    cache_key = build_cache_key(
        "recommendation-queries",
        {
            "emotion": normalized_emotion,
            "context": compacted_context,
            "language": normalized_language,
            "prefer_followup_key": bool(prefer_followup_key),
        },
    )
    cached = await RECOMMENDATION_QUERY_CACHE.get(cache_key)
    if cached is not None:
        return cached

    language_name = _response_language_name(normalized_language)
    prompt = f"""
You are a personalized wellbeing coach. User's current emotional state: {normalized_emotion}. User personality profile and context: {compacted_context or "{}"}.
Recommend content that is 70% driven by emotion and 30% by personality.
Return ONLY valid JSON in {language_name}:
{{
"music_queries": ["search query 1", "search query 2", "search query 3"],
"film_queries": ["query 1", "query 2", "query 3"],
"book_queries": ["query 1", "query 2", "query 3"],
"activities": ["activity 1", "activity 2", "activity 3", "activity 4", "activity 5"],
"coach_advice": "2-3 sentence empathetic assessment and guidance in {language_name}"
}}
""".strip()

    fallback = {
        "music_queries": [f"{normalized_emotion} mood music", f"{normalized_emotion} playlist", "gentle wellbeing songs"],
        "film_queries": [f"{normalized_emotion} film", "uplifting drama", "comfort movie"],
        "book_queries": [f"{normalized_emotion} self help", "mindfulness book", "emotional wellbeing"],
        "activities": [
            "Take a short breathing break.",
            "Drink water and reset your posture.",
            "Write one sentence about what you need.",
            "Take a brief walk if possible.",
            "Choose one small task and finish it gently.",
        ],
        "coach_advice": _default_coach_comment(normalized_emotion, normalized_language, compacted_context),
    }

    api_key_env = "GEMINI_KEY_RECOMMENDATIONS" if prefer_followup_key else "GEMINI_KEY_COACH"
    try:
        response = await _generate_content(
            prompt,
            normalized_language,
            "recommendation-queries",
            api_key_env=api_key_env,
            fallback_api_key_env="GEMINI_API_KEY",
        )
        result = _extract_json_payload(_read_response_text(response, normalized_language))
        payload = {
            "music_queries": _normalize_query_list(result.get("music_queries"), fallback["music_queries"]),
            "film_queries": _normalize_query_list(result.get("film_queries"), fallback["film_queries"]),
            "book_queries": _normalize_query_list(result.get("book_queries"), fallback["book_queries"]),
            "activities": _normalize_query_list(result.get("activities"), fallback["activities"], limit=5),
            "coach_advice": str(result.get("coach_advice") or fallback["coach_advice"]).strip(),
        }
        await RECOMMENDATION_QUERY_CACHE.set(cache_key, payload)
        return payload
    except Exception as exc:
        print(f"Gemini recommendation query error: {exc}")
        return fallback


async def generate_followup_bundle(
    emotion: str,
    context: str | None = None,
    language: str = "en",
    prefer_followup_key: bool = False,
) -> dict:
    query_bundle = await generate_recommendation_queries(
        emotion,
        context,
        language,
        prefer_followup_key,
    )
    return {
        "coach_comment": query_bundle["coach_advice"],
        "advice": _activities_to_advice(query_bundle["activities"]),
        "queries": query_bundle,
    }


def _read_big_five_score(big_five: dict | None, key: str) -> float | None:
    if not isinstance(big_five, dict):
        return None

    value = big_five.get(key)
    if isinstance(value, (int, float)):
        return max(0.0, min(1.0, float(value)))

    if isinstance(value, dict):
        for candidate in ("score", "value", "normalized"):
            nested = value.get(candidate)
            if isinstance(nested, (int, float)):
                return max(0.0, min(1.0, float(nested)))

    return None


def _fallback_avatar_prompt(
    big_five: dict | None,
    mbti_type: str | None,
    dominant_emotion: str | None,
) -> str:
    trait_labels = []
    trait_map = {
        "openness": "open and imaginative",
        "conscientiousness": "organized and purposeful",
        "extraversion": "warm and socially energetic",
        "agreeableness": "kind and cooperative",
        "neuroticism": "sensitive and emotionally reflective",
    }
    for key, label in trait_map.items():
        score = _read_big_five_score(big_five, key)
        if score is not None and score >= 0.6:
            trait_labels.append(label)

    traits = ", ".join(trait_labels) if trait_labels else "balanced, expressive, emotionally aware"
    emotion = normalize_emotion_key(dominant_emotion, "calm")
    mbti = f" with {str(mbti_type).strip().upper()} energy" if str(mbti_type or "").strip() else ""
    return (
        f"A friendly cartoon character with warm colors, curious eyes, creative accessories, "
        f"representing a {traits} personality{mbti} feeling {emotion}. "
        "Flat illustration style, soft background, no text."
    )


async def generate_avatar_prompt(
    big_five: dict | None,
    mbti_type: str | None,
    dominant_emotion: str | None,
) -> str:
    fallback_prompt = _fallback_avatar_prompt(big_five, mbti_type, dominant_emotion)
    try:
        prompt = f"""
Create one concise English image-generation prompt for a personality avatar.
The avatar must be a friendly cartoon character, not a real person.
Use the user's Big Five scores and current dominant emotion.
Big Five JSON: {json.dumps(big_five or {}, ensure_ascii=False)}
MBTI type: {mbti_type or "unknown"}
Dominant emotion from recent analyses: {normalize_emotion_key(dominant_emotion, "calm")}

Requirements:
- Mention personality traits implied by the scores.
- Mention the dominant emotion.
- Flat illustration style, soft background, no text.
- Return only the image prompt, no markdown and no JSON.
""".strip()
        response = await _generate_content(
            prompt,
            "en",
            "avatar-prompt",
            api_key_env="GEMINI_KEY_RECOMMENDATIONS",
            fallback_api_key_env="GEMINI_API_KEY",
        )
        generated_prompt = _read_response_text(response, "en").strip().strip('"')
        if generated_prompt:
            return generated_prompt[:1200]
    except Exception as exc:
        print(f"Gemini avatar prompt fallback warning: {exc}")

    return fallback_prompt


def _pollinations_avatar_url(prompt: str) -> str:
    encoded_prompt = urllib.parse.quote(prompt)
    return f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=512&height=512&nologo=true"


def _extract_inline_image_data(payload: dict) -> str:
    candidates = payload.get("candidates") if isinstance(payload, dict) else None
    if not isinstance(candidates, list):
        raise GeminiServiceError("Gemini returned no avatar candidates.", 502, "AI_INVALID_RESPONSE")

    for candidate in candidates:
        content = candidate.get("content") if isinstance(candidate, dict) else None
        parts = content.get("parts") if isinstance(content, dict) else None
        if not isinstance(parts, list):
            continue

        for part in parts:
            if not isinstance(part, dict):
                continue

            inline_data = part.get("inlineData") or part.get("inline_data")
            if not isinstance(inline_data, dict):
                continue

            image_data = inline_data.get("data")
            if not image_data:
                continue

            mime_type = inline_data.get("mimeType") or inline_data.get("mime_type") or "image/png"
            return f"data:{mime_type};base64,{image_data}"

    raise GeminiServiceError("Gemini returned no inline avatar image.", 502, "AI_INVALID_RESPONSE")


def _looks_model_unavailable(status_code: int, body: str) -> bool:
    lowered = body.lower()
    return status_code in {400, 404} and any(
        token in lowered
        for token in ("not found", "not supported", "unavailable", "unknown model")
    )


async def _generate_gemini_avatar_image(prompt: str) -> str:
    api_key = os.getenv("GEMINI_KEY_AVATAR", "").strip()
    if not api_key:
        raise GeminiServiceError("Gemini avatar key is not configured.", 500, "AI_CONFIG_ERROR")

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseModalities": ["IMAGE"]},
    }

    last_error: str | None = None
    async with httpx.AsyncClient(timeout=90) as client:
        for model_name in AVATAR_IMAGE_MODELS:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent",
                params={"key": api_key},
                json=payload,
            )

            if response.is_success:
                return _extract_inline_image_data(response.json())

            body = response.text
            last_error = body
            if model_name == AVATAR_IMAGE_MODELS[0] and _looks_model_unavailable(response.status_code, body):
                continue

            raise GeminiServiceError("Gemini avatar generation failed.", response.status_code, "AI_PROVIDER_ERROR")

    raise GeminiServiceError(last_error or "Gemini avatar generation failed.", 502, "AI_PROVIDER_ERROR")


async def generate_personality_avatar(
    big_five: dict | None,
    mbti_type: str | None,
    dominant_emotion: str | None,
) -> dict:
    prompt = await generate_avatar_prompt(big_five, mbti_type, dominant_emotion)
    try:
        avatar_url = await _generate_gemini_avatar_image(prompt)
    except Exception as exc:
        print(f"Gemini avatar image fallback warning: {exc}")
        avatar_url = _pollinations_avatar_url(prompt)

    return {
        "avatar_url": avatar_url,
        "cached": False,
    }
