FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    ENVIRONMENT=production

WORKDIR /app
COPY backend/pyproject.toml backend/requirements.txt ./
COPY backend/app ./app
RUN pip install --upgrade pip && pip install .

RUN useradd --create-home --uid 10001 esquare
USER esquare
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]
