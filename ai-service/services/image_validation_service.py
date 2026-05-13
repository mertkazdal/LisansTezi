from __future__ import annotations

import base64
from typing import Any

import cv2
import numpy as np


ALLOWED_MIME_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
MAX_IMAGE_BYTES = 10 * 1024 * 1024
MIN_FACE_AREA_RATIO = 0.03
MIN_FACE_SHORT_SIDE_PIXELS = 110


def validate_image_payload(image_base64: str, mime_type: str | None = "image/jpeg", language: str = "en") -> dict[str, Any]:
    normalized_language = "tr" if str(language or "").lower().startswith("tr") else "en"
    normalized_mime = (mime_type or "image/jpeg").lower().strip()

    if normalized_mime not in ALLOWED_MIME_TYPES:
        _raise("Unsupported image format. Please upload jpg, jpeg, png, or webp.", "UNSUPPORTED_IMAGE_TYPE")

    try:
        image_bytes = base64.b64decode(image_base64 or "", validate=True)
    except (TypeError, ValueError) as exc:
        raise ImageValidationError(_message("Please upload a clear photo of a face", normalized_language), "INVALID_IMAGE") from exc

    if len(image_bytes) > MAX_IMAGE_BYTES:
        _raise("Image size must be 10MB or smaller.", "IMAGE_TOO_LARGE")

    image_buffer = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(image_buffer, cv2.IMREAD_COLOR)
    if image is None:
        _raise(_message("Please upload a clear photo of a face", normalized_language), "INVALID_IMAGE")

    faces = _detect_faces(image)
    if len(faces) == 0:
        _raise(_message("No face detected in image", normalized_language), "NO_FACE_DETECTED")
    if len(faces) > 1:
        _raise(_message("Multiple faces detected. Please upload a photo with only your face", normalized_language), "MULTIPLE_FACES_DETECTED")

    x, y, width, height = faces[0]
    image_area = image.shape[0] * image.shape[1]
    face_area_ratio = (width * height) / image_area if image_area else 0
    face_short_side = min(width, height)
    if face_area_ratio < MIN_FACE_AREA_RATIO and face_short_side < MIN_FACE_SHORT_SIDE_PIXELS:
        _raise(_message("The face is too small in the frame. Please move closer and try again", normalized_language), "FACE_TOO_SMALL")

    return {
        "valid": True,
        "faceCount": 1,
        "faceAreaRatio": face_area_ratio,
        "faceShortSide": int(face_short_side),
        "boundingBox": {"x": int(x), "y": int(y), "width": int(width), "height": int(height)},
    }


class ImageValidationError(Exception):
    def __init__(self, message: str, code: str):
        super().__init__(message)
        self.message = message
        self.code = code


def _detect_faces(image_bgr: np.ndarray) -> list[tuple[int, int, int, int]]:
    deepface_faces = _detect_faces_with_deepface(image_bgr)
    if deepface_faces is not None:
        return deepface_faces

    mediapipe_faces = _detect_faces_with_mediapipe(image_bgr)
    if mediapipe_faces is not None:
        return mediapipe_faces

    raise ImageValidationError(
        "Face validation model is unavailable. Please try again later.",
        "FACE_MODEL_UNAVAILABLE",
    )


def _detect_faces_with_deepface(image_bgr: np.ndarray) -> list[tuple[int, int, int, int]] | None:
    try:
        from deepface import DeepFace
    except Exception:
        return None

    try:
        detected = DeepFace.represent(
            img_path=image_bgr,
            model_name="Facenet",
            detector_backend="mediapipe",
            enforce_detection=True,
            align=False,
        )
    except Exception:
        return None

    faces: list[tuple[int, int, int, int]] = []
    detected_items = detected if isinstance(detected, list) else [detected]
    for item in detected_items:
        area = item.get("facial_area") if isinstance(item, dict) else None
        confidence = float(item.get("confidence", 1.0)) if isinstance(item, dict) else 0.0
        if not area or confidence < 0.5:
            continue
        faces.append(
            (
                int(area.get("x", 0)),
                int(area.get("y", 0)),
                int(area.get("w", 0)),
                int(area.get("h", 0)),
            )
        )

    return [face for face in faces if face[2] > 0 and face[3] > 0]


def _detect_faces_with_mediapipe(image_bgr: np.ndarray) -> list[tuple[int, int, int, int]] | None:
    try:
        import mediapipe as mp
    except Exception:
        return None

    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    image_height, image_width = image_rgb.shape[:2]

    with mp.solutions.face_detection.FaceDetection(
        model_selection=1,
        min_detection_confidence=0.5,
    ) as detector:
        results = detector.process(image_rgb)

    faces: list[tuple[int, int, int, int]] = []
    for detection in results.detections or []:
        box = detection.location_data.relative_bounding_box
        x = max(0, int(box.xmin * image_width))
        y = max(0, int(box.ymin * image_height))
        width = min(image_width - x, int(box.width * image_width))
        height = min(image_height - y, int(box.height * image_height))
        if width > 0 and height > 0:
            faces.append((x, y, width, height))

    return faces


def _message(default_message: str, language: str) -> str:
    if language != "tr":
        return default_message
    translations = {
        "Please upload a clear photo of a face": "Lütfen yüzün net göründüğü bir fotoğraf yükle",
        "The face is too small in the frame. Please move closer and try again": "Yüz kadrajda çok küçük görünüyor. Biraz yaklaşarak tekrar dene",
        "No face detected in image": "Görselde yüz algılanamadı",
        "Multiple faces detected. Please upload a photo with only your face": "Birden fazla yüz algılandı. Lütfen yalnızca kendi yüzünün olduğu bir fotoğraf yükle",
    }
    return translations.get(default_message, default_message)


def _raise(message: str, code: str) -> None:
    raise ImageValidationError(message, code)
