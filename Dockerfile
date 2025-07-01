FROM python:3.11-slim

WORKDIR /app

COPY src/backend/backend-requirements.txt .
RUN pip install --no-cache-dir -r src/backend/backend-requirements.txt

COPY . .

ENV PORT=8000

CMD ["uvicorn", "src.backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
