FROM python:3.12-slim

WORKDIR /app
COPY backend/pyproject.toml ./pyproject.toml
RUN pip install --no-cache-dir .
COPY backend/app ./app
COPY content ./content
ENV KNOWLEDGE_PATH=/app/content/knowledge.json
EXPOSE 8888
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8888"]
