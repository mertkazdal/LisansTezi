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
    "personality_update": "GEMINI_KEY_PERSONALITY_UPDATE",
    "coach": "GEMINI_KEY_COACH",
}

FALLBACK_ENV_BY_PURPOSE = {
    "personality": ("GEMINI_API_KEY",),
    "text_emotion": ("GEMINI_API_KEY",),
    "recommendations": ("GEMINI_FOLLOWUP_API_KEY", "GEMINI_API_KEY"),
    "personality_update": ("GEMINI_API_KEY",),
    "coach": ("GEMINI_KEY_RECOMMENDATIONS", "GEMINI_FOLLOWUP_API_KEY", "GEMINI_API_KEY"),
}


class GeminiKeyError(RuntimeError):
    pass


@dataclass
class GeminiPipelineLease:
    pipeline_id: str = field(default_factory=lambda: uuid4().hex)
    used_envs: set[str] = field(default_factory=set)
    used_keys: set[str] = field(default_factory=set)

    def get_key(self, purpose: str, *, optional: bool = False) -> tuple[str | None, str | None]:
        env_candidates = [KEY_ENV_BY_PURPOSE.get(purpose), *FALLBACK_ENV_BY_PURPOSE.get(purpose, ())]

        for env_name in env_candidates:
            if not env_name:
                continue

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


gemini_key_manager = GeminiKeyManager()
