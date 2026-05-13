from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path


AI_SERVICE_CONTRACT_PATH = Path(__file__).resolve().parents[1] / "data" / "emotion_contract.json"
SHARED_CONTRACT_PATH = Path(__file__).resolve().parents[2] / "shared" / "emotion_contract.json"


@lru_cache(maxsize=1)
def load_emotion_contract() -> dict:
    contract_path = AI_SERVICE_CONTRACT_PATH if AI_SERVICE_CONTRACT_PATH.exists() else SHARED_CONTRACT_PATH
    with contract_path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


@lru_cache(maxsize=1)
def _emotion_entries() -> list[dict]:
    contract = load_emotion_contract()
    return list(contract.get("emotions", []))


VALID_EMOTIONS = tuple(entry["key"] for entry in _emotion_entries())
VALID_EMOTION_SET = set(VALID_EMOTIONS)
POSITIVE_EMOTIONS = {entry["key"] for entry in _emotion_entries() if entry.get("group") == "positive"}
NEGATIVE_EMOTIONS = {entry["key"] for entry in _emotion_entries() if entry.get("group") == "negative"}
NEUTRAL_EMOTIONS = {entry["key"] for entry in _emotion_entries() if entry.get("group") == "neutral"}


def normalize_emotion_key(value: str | None, fallback: str = "calm") -> str:
    normalized = (value or "").strip().lower()
    return normalized if normalized in VALID_EMOTION_SET else fallback


def is_valid_emotion(value: str | None) -> bool:
    return (value or "").strip().lower() in VALID_EMOTION_SET
