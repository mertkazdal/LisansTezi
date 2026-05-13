# syntax=docker/dockerfile:1.7
FROM python:3.11-slim

WORKDIR /app/ai-service

ENV IMAGE_EMOTION_PROVIDER=gemini
ENV PIP_DEFAULT_TIMEOUT=1000
ENV PIP_RETRIES=10

RUN apt-get update \
    && apt-get install -y --no-install-recommends libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY ai-service/requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip pip install -r requirements.txt

COPY ai-service ./
COPY shared /app/shared

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
