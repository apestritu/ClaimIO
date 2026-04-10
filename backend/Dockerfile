FROM python:3.12-slim

WORKDIR /app

# System deps for Pillow / pypdfium2
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libjpeg-dev && \
    rm -rf /var/lib/apt/lists/*

COPY pyproject.toml ./
RUN pip install --no-cache-dir . && pip install --no-cache-dir pytest pytest-asyncio

COPY . .

EXPOSE 8000

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
