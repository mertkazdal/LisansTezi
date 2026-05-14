from __future__ import annotations

import os
from dataclasses import dataclass, field
from uuid import uuid4


KEY_ENV_BY_PURPOSE = {
    "personality": "GEMINI_KEY_PERSONALITY",
    "text_emotion": "GEMINI_KEY_TEXT_EMOTION",
    "conflict_1": "GEMINI_KEY_CONFLICT_1",
    "conflict_2": "GEMINI_KEY_CONFLICT_2",
    "conflict_3": "GEMINI_KEY_CONFLICT_3",
    "recommendations": "GEMINI_KEY_RECOMMENDATIONS",
    "film_queries": "GEMINI_KEY_FILM_QUERIES",
    "personality_update": "GEMINI_KEY_PERSONALITY_UPDATE",
    "coach": "GEMINI_KEY_COACH",
    "avatar": "GEMINI_KEY_AVATAR",
}

FALLBACK_ENV_BY_PURPOSE = {
    "personality": ("GEMINI_API_KEY",),
    "text_emotion": ("GEMINI_API_KEY",),
    "recommendations": ("GEMINI_FOLLOWUP_API_KEY", "GEMINI_API_KEY"),
    "film_queries": ("GEMINI_KEY_RECOMMENDATIONS", "GEMINI_FOLLOWUP_API_KEY", "GEMINI_API_KEY"),
    "personality_update": ("GEMINI_API_KEY",),
    "coach": ("GEMINI_KEY_RECOMMENDATIONS", "GEMINI_FOLLOWUP_API_KEY", "GEMINI_API_KEY"),
    "avatar": ("GEMINI_KEY_RECOMMENDATIONS", "GEMINI_API_KEY"),
}


class GeminiKeyError(RuntimeError):
    pass


def _env_candidates_for_role(role: str) -> list[str]:
    primary_env = KEY_ENV_BY_PURPOSE.get(role)
    if not primary_env:
        raise GeminiKeyError(f"Unknown Gemini key role '{role}'.")

    candidates = [primary_env, *FALLBACK_ENV_BY_PURPOSE.get(role, ())]
    return list(dict.fromkeys(env_name for env_name in candidates if env_name))


@dataclass
class GeminiPipelineLease:
    pipeline_id: str = field(default_factory=lambda: uuid4().hex)
    used_envs: set[str] = field(default_factory=set)
    used_keys: set[str] = field(default_factory=set)

    def get_key(self, purpose: str, *, optional: bool = False) -> tuple[str | None, str | None]:
        for env_name in _env_candidates_for_role(purpose):
            key = os.getenv(env_name, "").strip()
            if not key:
                continue

            if env_name in self.used_envs or key in self.used_keys:
                continue

            self.used_envs.add(env_name)
            self.used_keys.add(key)
            return key, env_name

        if optional:
            return None, None

        raise GeminiKeyError(f"No unused Gemini key is available for purpose '{purpose}' in pipeline {self.pipeline_id}.")


class GeminiKeyManager:
    def begin_pipeline(self) -> GeminiPipelineLease:
        return GeminiPipelineLease()

    def get_key(self, role: str, *, optional: bool = False) -> tuple[str | None, str | None]:
        for env_name in _env_candidates_for_role(role):
            key = os.getenv(env_name, "").strip()
            if key:
                return key, env_name

        if optional:
            return None, None

        candidates = ", ".join(_env_candidates_for_role(role))
        raise GeminiKeyError(f"Gemini key role '{role}' requires one of: {candidates}.")


gemini_key_manager = GeminiKeyManager()
