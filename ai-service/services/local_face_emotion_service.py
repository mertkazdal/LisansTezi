from __future__ import annotations

import json
import os
from pathlib import Path
from threading import Lock
from typing import Any

os.environ.setdefault("HF_HUB_DOWNLOAD_TIMEOUT", "300")
os.environ.setdefault("HF_HUB_ETAG_TIMEOUT", "60")

import cv2
import numpy as np
import onnxruntime as ort
from huggingface_hub import snapshot_download
from PIL import Image
from transformers import AutoImageProcessor

from services.image_validation_service import ImageValidationError, validate_and_extract_face


DEFAULT_MODEL_ID = "trpakov/vit-face-expression"
DEFAULT_MODEL_DIR = "/opt/models/trpakov-vit-face-expression"
MODEL_USED = "trpakov/vit-face-expression-onnx"
ALLOWED_MODEL_PATTERNS = ("*.json", "*.onnx", "*.txt")
RAW_TO_PROJECT_EMOTION = {
    "angry": "angry",
    "disgust": "stressed",
    "fear": "anxious",
    "happy": "happy",
    "neutral": "calm",
    "sad": "sad",
    "surprise": "excited",
}

_RESOURCE_LOCK = Lock()
_RESOURCE_BUNDLE: dict[str, Any] | None = None


class LocalFaceEmotionError(Exception):
    def __init__(self, message: str, status_code: int, code: str):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code


def _normalize_language(language: str | None) -> str:
    normalized = (language or "en").strip().lower()
    return "tr" if normalized.startswith("tr") else "en"


def _model_unavailable_message(language: str) -> str:
    if language == "tr":
        return "Yerel yüz duygu modeli hazır değil. Lütfen daha sonra tekrar dene."
    return "The local face emotion model is not ready yet. Please try again later."


def _analysis_explanation(language: str, emotion: str, confidence: float) -> str:
    confidence_percent = round(confidence * 100)
    if language == "tr":
        return (
            "Selfie, yerelde çalışan yüz duygu modeli ile analiz edildi. "
            f"Baskın duygu {emotion} olarak bulundu. Güven skoru %{confidence_percent}."
        )

    return (
        "The selfie was analyzed with the local face emotion model. "
        f"The dominant signal was {emotion} with {confidence_percent}% confidence."
    )


def _model_dir() -> Path:
    configured = os.getenv("LOCAL_FACE_MODEL_DIR", DEFAULT_MODEL_DIR).strip() or DEFAULT_MODEL_DIR
    return Path(configured).expanduser()


def _model_id() -> str:
    return os.getenv("LOCAL_FACE_MODEL_ID", DEFAULT_MODEL_ID).strip() or DEFAULT_MODEL_ID


def _bundle_ready(model_dir: Path) -> bool:
    return (model_dir / "config.json").exists() and any(model_dir.rglob("*.onnx"))


def _ensure_model_snapshot(language: str) -> Path:
    model_dir = _model_dir()
    if _bundle_ready(model_dir):
        return model_dir

    model_dir.mkdir(parents=True, exist_ok=True)

    last_error: Exception | None = None
    for attempt in range(1, 4):
        try:
            print(f"Local face emotion model download started: {_model_id()} -> {model_dir} (attempt {attempt}/3)")
            snapshot_download(
                repo_id=_model_id(),
                local_dir=str(model_dir),
                allow_patterns=list(ALLOWED_MODEL_PATTERNS),
                max_workers=1,
            )
            print(f"Local face emotion model download finished: {model_dir}")
            break
        except Exception as exc:
            last_error = exc
            print(f"Local face emotion model download failed on attempt {attempt}/3: {exc}")
    else:
        raise LocalFaceEmotionError(
            _model_unavailable_message(language),
            503,
            "FACE_MODEL_UNAVAILABLE",
        ) from last_error

    if not _bundle_ready(model_dir):
        raise LocalFaceEmotionError(
            _model_unavailable_message(language),
            503,
            "FACE_MODEL_UNAVAILABLE",
        )

    return model_dir


def _load_config(model_dir: Path, language: str) -> dict:
    try:
        with (model_dir / "config.json").open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except OSError as exc:
        raise LocalFaceEmotionError(
            _model_unavailable_message(language),
            503,
            "FACE_MODEL_UNAVAILABLE",
        ) from exc


def _resolve_onnx_path(model_dir: Path, language: str) -> Path:
    try:
        return next(iter(sorted(model_dir.rglob("*.onnx"))))
    except StopIteration as exc:
        raise LocalFaceEmotionError(
            _model_unavailable_message(language),
            503,
            "FACE_MODEL_UNAVAILABLE",
        ) from exc


def _load_resources(language: str) -> dict[str, Any]:
    global _RESOURCE_BUNDLE

    if _RESOURCE_BUNDLE is not None:
        return _RESOURCE_BUNDLE

    with _RESOURCE_LOCK:
        if _RESOURCE_BUNDLE is not None:
            return _RESOURCE_BUNDLE

        try:
            model_dir = _ensure_model_snapshot(language)
            config = _load_config(model_dir, language)
            processor = AutoImageProcessor.from_pretrained(str(model_dir), local_files_only=True)
            session = ort.InferenceSession(
                str(_resolve_onnx_path(model_dir, language)),
                providers=["CPUExecutionProvider"],
            )
        except LocalFaceEmotionError:
            raise
        except Exception as exc:
            raise LocalFaceEmotionError(
                _model_unavailable_message(language),
                503,
                "FACE_MODEL_UNAVAILABLE",
            ) from exc

        _RESOURCE_BUNDLE = {
            "config": config,
            "processor": processor,
            "session": session,
            "model_used": MODEL_USED,
        }
        return _RESOURCE_BUNDLE


def warmup_local_face_emotion_model(language: str = "en") -> dict[str, Any]:
    normalized_language = _normalize_language(language)
    resources = _load_resources(normalized_language)
    return {
        "model_used": resources["model_used"],
        "model_id": _model_id(),
        "model_dir": str(_model_dir()),
    }


def _softmax(logits: np.ndarray) -> np.ndarray:
    shifted = logits - np.max(logits)
    exp_values = np.exp(shifted)
    return exp_values / np.sum(exp_values)


def _build_session_inputs(processor: AutoImageProcessor, session: ort.InferenceSession, face_crop: np.ndarray) -> dict:
    rgb_face = cv2.cvtColor(face_crop, cv2.COLOR_BGR2RGB)
    pil_face = Image.fromarray(rgb_face)
    encoded_inputs = processor(images=pil_face, return_tensors="np")

    session_inputs = {}
    for session_input in session.get_inputs():
        input_value = encoded_inputs.get(session_input.name)
        if input_value is None and session_input.name == "pixel_values":
            input_value = encoded_inputs.get("pixel_values")

        if input_value is None:
            raise LocalFaceEmotionError(
                _model_unavailable_message("en"),
                503,
                "FACE_MODEL_UNAVAILABLE",
            )

        session_inputs[session_input.name] = np.asarray(input_value, dtype=np.float32)

    return session_inputs


def _resolve_raw_label(config: dict, predicted_index: int) -> str:
    id2label = config.get("id2label", {})
    raw_label = id2label.get(str(predicted_index)) or id2label.get(predicted_index) or "neutral"
    return str(raw_label).strip().lower()


def _map_project_emotion(raw_label: str) -> str:
    normalized = raw_label.replace("_", " ").strip().lower()
    normalized = normalized.replace("fearful", "fear").replace("surprised", "surprise")

    for key, value in RAW_TO_PROJECT_EMOTION.items():
        if normalized == key:
            return value

    return "calm"


def analyze_face_emotion(
    image_base64: str,
    mime_type: str | None = None,
    language: str = "en",
) -> dict:
    normalized_language = _normalize_language(language)
    try:
        face_result = validate_and_extract_face(image_base64, mime_type, normalized_language)
    except ImageValidationError as exc:
        raise LocalFaceEmotionError(exc.message, 400, exc.code) from exc

    resources = _load_resources(normalized_language)
    try:
        session_inputs = _build_session_inputs(
            resources["processor"],
            resources["session"],
            face_result.face_crop_bgr,
        )
        outputs = resources["session"].run(None, session_inputs)
    except LocalFaceEmotionError:
        raise
    except Exception as exc:
        raise LocalFaceEmotionError(
            _model_unavailable_message(normalized_language),
            503,
            "FACE_MODEL_UNAVAILABLE",
        ) from exc

    logits = np.asarray(outputs[0])[0]
    probabilities = _softmax(logits)

    predicted_index = int(np.argmax(probabilities))
    confidence = float(probabilities[predicted_index])
    raw_label = _resolve_raw_label(resources["config"], predicted_index)
    emotion = _map_project_emotion(raw_label)

    return {
        "emotion": emotion,
        "confidence": confidence,
        "explanation": _analysis_explanation(normalized_language, emotion, confidence),
        "raw_emotion": raw_label,
        "face_area_ratio": face_result.face_area_ratio,
        "face_short_side": face_result.face_short_side,
        "bounding_box": face_result.bounding_box,
        "model_used": resources["model_used"],
    }
