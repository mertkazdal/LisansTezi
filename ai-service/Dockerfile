FROM python:3.11-slim

WORKDIR /app/ai-service

ENV LOCAL_FACE_MODEL_ID=trpakov/vit-face-expression
ENV LOCAL_FACE_MODEL_DIR=/opt/models/trpakov-vit-face-expression
ENV HF_HOME=/opt/huggingface

COPY ai-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN python -c "from huggingface_hub import snapshot_download; snapshot_download(repo_id='trpakov/vit-face-expression', local_dir='/opt/models/trpakov-vit-face-expression', allow_patterns=['*.json','*.onnx','*.txt'])"

COPY ai-service ./
COPY shared /app/shared

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
