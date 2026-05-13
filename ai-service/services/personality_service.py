from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import google.generativeai as genai

from services.gemini_key_manager import GeminiKeyError, GeminiPipelineLease, gemini_key_manager


DATA_DIR = Path(__file__).resolve().parents[1] / "data"
SURVEY_PATH = DATA_DIR / "survey_questions.json"
DIMENSIONS = ("openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism")


def load_survey_questions(language: str = "tr") -> dict[str, Any]:
    with SURVEY_PATH.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)

    normalized_language = "en" if str(language or "").lower().startswith("en") else "tr"
    text_key = f"text_{normalized_language}"
    labels_key = f"labels_{normalized_language}"

    return {
        "scale": {
            "min": payload.get("scale", {}).get("min", 1),
            "max": payload.get("scale", {}).get("max", 5),
            "labels": payload.get("scale", {}).get(labels_key, {}),
        },
        "questions": [
            {
                "id": item["id"],
                "dimension": item["dimension"],
                "text": item.get(text_key) or item.get("text_en") or item.get("text_tr"),
                "reverse": bool(item.get("reverse", False)),
            }
            for item in payload.get("questions", [])
        ],
    }


def detect_personality(
    survey_answers: dict[str, Any],
    language: str = "tr",
    lease: GeminiPipelineLease | None = None,
) -> dict[str, Any]:
    pipeline_lease = lease or gemini_key_manager.begin_pipeline()
    local_result = _score_locally(survey_answers)
    survey_text = _answers_to_text(survey_answers, language)

    try:
        key, _ = pipeline_lease.get_key("personality", optional=True)
    except GeminiKeyError:
        key = None

    if not key:
        return local_result

    prompt = f"""
You are a scientific personality analyst. Based on these survey responses, determine the user's Big Five personality profile and MBTI type. Return ONLY valid JSON:
{{
"openness": 0-100,
"conscientiousness": 0-100,
"extraversion": 0-100,
"agreeableness": 0-100,
"neuroticism": 0-100,
"mbti": "INFP|ENFJ|...",
"summary": "brief internal note"
}}
Survey data: {survey_text}
""".strip()

    try:
        genai.configure(api_key=key)
        model = genai.GenerativeModel("gemini-3-flash-preview")
        response = model.generate_content(prompt)
        parsed = _parse_json(getattr(response, "text", ""))
        return _normalize_personality_result(parsed, fallback=local_result)
    except Exception:
        return local_result


def _answers_to_text(survey_answers: dict[str, Any], language: str) -> str:
    questions = load_survey_questions(language)["questions"]
    answer_map = _normalize_answer_map(survey_answers)
    lines = []

    for question in questions:
        answer = answer_map.get(question["id"])
        if answer is None:
            continue

        lines.append(
            f"Q{question['id']} [{question['dimension']} reverse={question['reverse']}]: {question['text']} -> {answer}/5"
        )

    return "\n".join(lines)


def _score_locally(survey_answers: dict[str, Any]) -> dict[str, Any]:
    questions = load_survey_questions("en")["questions"]
    answer_map = _normalize_answer_map(survey_answers)
    buckets = {dimension: [] for dimension in DIMENSIONS}

    for question in questions:
        raw = answer_map.get(question["id"])
        if raw is None:
            continue

        value = max(1, min(5, int(raw)))
        if question.get("reverse"):
            value = 6 - value

        buckets[question["dimension"]].append(value)

    scores = {}
    for dimension, values in buckets.items():
        average = sum(values) / len(values) if values else 3
        scores[dimension] = round(((average - 1) / 4) * 100)

    mbti = _derive_mbti(scores)
    return {
        **scores,
        "mbti": mbti,
        "summary": "Deterministic Big Five fallback from 20-item Likert survey.",
        "confidence": 0.8,
    }


def _derive_mbti(scores: dict[str, int]) -> str:
    return "".join(
        [
            "E" if scores["extraversion"] >= 50 else "I",
            "N" if scores["openness"] >= 50 else "S",
            "F" if scores["agreeableness"] >= 50 else "T",
            "J" if scores["conscientiousness"] >= 50 else "P",
        ]
    )


def _normalize_answer_map(survey_answers: dict[str, Any]) -> dict[int, int]:
    source = survey_answers.get("answers", survey_answers) if isinstance(survey_answers, dict) else {}
    normalized = {}

    if isinstance(source, list):
        for item in source:
            if isinstance(item, dict) and "id" in item and "value" in item:
                normalized[int(item["id"])] = int(item["value"])
    elif isinstance(source, dict):
        for key, value in source.items():
            try:
                normalized[int(key)] = int(value)
            except (TypeError, ValueError):
                continue

    return normalized


def _parse_json(raw_text: str) -> dict[str, Any]:
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        cleaned = cleaned.removeprefix("json").strip()
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start >= 0 and end > start:
        cleaned = cleaned[start : end + 1]
    return json.loads(cleaned)


def _normalize_personality_result(parsed: dict[str, Any], fallback: dict[str, Any]) -> dict[str, Any]:
    result = {}
    for dimension in DIMENSIONS:
        try:
            result[dimension] = max(0, min(100, round(float(parsed.get(dimension, fallback[dimension])))))
        except (TypeError, ValueError):
            result[dimension] = fallback[dimension]

    mbti = str(parsed.get("mbti") or fallback["mbti"]).upper()
    result["mbti"] = mbti if len(mbti) == 4 else fallback["mbti"]
    result["summary"] = str(parsed.get("summary") or fallback["summary"])[:1000]
    result["confidence"] = 0.8
    return result
