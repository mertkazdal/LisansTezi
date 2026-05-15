# syntax=docker/dockerfile:1.7
FROM python:3.11-slim

WORKDIR /app/ai-service

ENV IMAGE_EMOTION_PROVIDER=local
ENV LOCAL_FACE_MODEL_ID=trpakov/vit-face-expression
ENV LOCAL_FACE_MODEL_DIR=/opt/models/trpakov-vit-face-expression
ENV HF_HUB_DOWNLOAD_TIMEOUT=300
ENV HF_HUB_ETAG_TIMEOUT=60
ENV PIP_DEFAULT_TIMEOUT=1000
ENV PIP_RETRIES=10

RUN apt-get update \
    && apt-get install -y --no-install-recommends libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY ai-service/requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip pip install -r requirements.txt

RUN --mount=type=cache,target=/root/.cache/huggingface python - <<'PY'
from huggingface_hub import snapshot_download

snapshot_download(
    repo_id="trpakov/vit-face-expression",
    local_dir="/opt/models/trpakov-vit-face-expression",
    allow_patterns=["*.json", "*.onnx", "*.txt"],
    max_workers=1,
)
print("Local face emotion model preloaded into /opt/models/trpakov-vit-face-expression")
PY

COPY ai-service ./
COPY shared /app/shared

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
