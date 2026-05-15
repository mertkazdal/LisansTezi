import pytest

from services.image_validation_service import ImageValidationError, validate_image_payload


def test_validate_image_payload_rejects_invalid_base64():
    with pytest.raises(ImageValidationError) as exc_info:
        validate_image_payload("not-valid-base64", "image/jpeg", "en")

    assert exc_info.value.code == "INVALID_IMAGE"


def test_validate_image_payload_rejects_unsupported_mime_type():
    with pytest.raises(ImageValidationError) as exc_info:
        validate_image_payload("abcd", "image/heic", "en")

    assert exc_info.value.code == "UNSUPPORTED_IMAGE_TYPE"
