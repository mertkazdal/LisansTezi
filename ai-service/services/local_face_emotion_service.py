from __future__ import annotations

import base64
import json
import os
from pathlib import Path
from threading import Lock

import cv2
import numpy as np
import onnxruntime as ort
from huggingface_hub import snapshot_download
from PIL import Image
from transformers import AutoImageProcessor


DEFAULT_MODEL_ID = "trpakov/vit-face-expression"
DEFAULT_MODEL_DIR = "/opt/models/trpakov-vit-face-expression"
DEFAULT_CASCADE_FILES = (
    "haarcascade_frontalface_default.xml",
    "haarcascade_frontalface_alt2.xml",
)
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
_RESOURCE_BUNDLE: dict | None = None


class LocalFaceEmotionError(Exception):
    def __init__(self, message: str, status_code: int, code: str):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code


def _normalize_language(language: str | None) -> str:
    normalized = (language or "en").strip().lower()
    return "tr" if normalized.startswith("tr") else "en"


def _invalid_image_message(language: str) -> str:
    if language == "tr":
        return "Geçerli bir selfie okunamadı. Lütfen farklı bir fotoğrafla tekrar dene."
    return "A valid selfie could not be read. Please try again with another image."


def _face_not_detected_message(language: str) -> str:
    if language == "tr":
        return (
            "Selfie'de belirgin bir yüz algılanamadı. Lütfen yüze odaklı, daha net ve önden çekilmiş bir fotoğraf dene."
        )
    return (
        "No clear face could be detected in the selfie. Please try a sharper, front-facing photo."
    )


def _model_unavailable_message(language: str) -> str:
    if language == "tr":
        return "Yerel yüz duygu modeli hazır değil. Lütfen daha sonra tekrar dene."
    return "The local face emotion model is not ready yet. Please try again later."


def _analysis_explanation(language: str, emotion: str, confidence: float) -> str:
    confidence_percent = round(confidence * 100)
    if language == "tr":
        return (
            "Selfie, yerelde çalışan yüz duygu modeli ile analiz edildi. "
            f"Baskın duygu {emotion} olarak bulundu."
        )

    return (
        "The selfie was analyzed with the local face emotion model. "
        f"The dominant signal was {emotion}."
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

    try:
        snapshot_download(
            repo_id=_model_id(),
            local_dir=str(model_dir),
            allow_patterns=list(ALLOWED_MODEL_PATTERNS),
        )
    except Exception as exc:
        raise LocalFaceEmotionError(
            _model_unavailable_message(language),
            503,
            "FACE_MODEL_UNAVAILABLE",
        ) from exc

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


def _load_detectors(language: str) -> list[cv2.CascadeClassifier]:
    detectors = []
    for cascade_name in DEFAULT_CASCADE_FILES:
        cascade_path = Path(cv2.data.haarcascades) / cascade_name
        if not cascade_path.exists():
            continue

        detector = cv2.CascadeClassifier(str(cascade_path))
        if not detector.empty():
            detectors.append(detector)

    if detectors:
        return detectors

    raise LocalFaceEmotionError(
        _model_unavailable_message(language),
        503,
        "FACE_MODEL_UNAVAILABLE",
    )


def _load_resources(language: str) -> dict:
    global _RESOURCE_BUNDLE

    if _RESOURCE_BUNDLE is not None:
        return _RESOURCE_BUNDLE

    with _RESOURCE_LOCK:
        if _RESOURCE_BUNDLE is not None:
            return _RESOURCE_BUNDLE

        model_dir = _ensure_model_snapshot(language)
        config = _load_config(model_dir, language)
        processor = AutoImageProcessor.from_pretrained(str(model_dir), local_files_only=True)
        session = ort.InferenceSession(
            str(_resolve_onnx_path(model_dir, language)),
            providers=["CPUExecutionProvider"],
        )

        _RESOURCE_BUNDLE = {
            "config": config,
            "processor": processor,
            "session": session,
            "detectors": _load_detectors(language),
        }
        return _RESOURCE_BUNDLE


def _softmax(logits: np.ndarray) -> np.ndarray:
    shifted = logits - np.max(logits)
    exp_values = np.exp(shifted)
    return exp_values / np.sum(exp_values)


def _decode_image(image_base64: str, language: str) -> np.ndarray:
    try:
        image_bytes = base64.b64decode(image_base64, validate=True)
    except (TypeError, ValueError) as exc:
        raise LocalFaceEmotionError(_invalid_image_message(language), 400, "INVALID_IMAGE") from exc

    image_buffer = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(image_buffer, cv2.IMREAD_COLOR)
    if image is None:
        raise LocalFaceEmotionError(_invalid_image_message(language), 400, "INVALID_IMAGE")

    return image


def _detect_face(image_bgr: np.ndarray, detectors: list[cv2.CascadeClassifier], language: str) -> np.ndarray:
    grayscale = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    grayscale = cv2.equalizeHist(grayscale)

    image_height, image_width = grayscale.shape[:2]
    min_side = min(image_height, image_width)
    min_size = max(48, min_side // 7)

    detected_faces = ()
    for detector in detectors:
        detected_faces = detector.detectMultiScale(
            grayscale,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(min_size, min_size),
        )
        if len(detected_faces) > 0:
            break

    if len(detected_faces) == 0:
        raise LocalFaceEmotionError(
            _face_not_detected_message(language),
            400,
            "FACE_NOT_DETECTED",
        )

    x, y, width, height = max(detected_faces, key=lambda face: face[2] * face[3])
    margin_x = int(width * 0.18)
    margin_y = int(height * 0.18)

    x0 = max(0, x - margin_x)
    y0 = max(0, y - margin_y)
    x1 = min(image_width, x + width + margin_x)
    y1 = min(image_height, y + height + margin_y)

    return image_bgr[y0:y1, x0:x1]


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
                "Local face model input signature is unsupported.",
                500,
                "FACE_MODEL_INVALID",
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
    del mime_type

    normalized_language = _normalize_language(language)
    resources = _load_resources(normalized_language)
    face_crop = _detect_face(
        _decode_image(image_base64, normalized_language),
        resources["detectors"],
        normalized_language,
    )
    session_inputs = _build_session_inputs(resources["processor"], resources["session"], face_crop)
    outputs = resources["session"].run(None, session_inputs)
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
    }
