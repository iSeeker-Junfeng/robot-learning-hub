from __future__ import annotations

import os
from dataclasses import dataclass


def _csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


def _first_env(*names: str, default: str = "") -> str:
    for name in names:
        value = os.getenv(name)
        if value:
            return value
    return default


@dataclass(frozen=True)
class Settings:
    app_env: str = os.getenv("APP_ENV", "development")
    api_prefix: str = os.getenv("API_PREFIX", "/api/v1")
    cors_origins: tuple[str, ...] = tuple(_csv(os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173")))
    llm_provider: str = os.getenv("LLM_PROVIDER", "dashscope")
    llm_base_url: str = os.getenv("LLM_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1").rstrip("/")
    llm_api_key: str = _first_env("DASHSCOPE_API_KEY", "LLM_API_KEY")
    llm_model: str = os.getenv("LLM_MODEL", "qwen-plus")
    llm_timeout_seconds: float = float(os.getenv("LLM_TIMEOUT_SECONDS", "90"))
    max_history_messages: int = int(os.getenv("MAX_HISTORY_MESSAGES", "12"))
    max_question_length: int = int(os.getenv("MAX_QUESTION_LENGTH", "4000"))
    knowledge_path: str = os.getenv("KNOWLEDGE_PATH", "frontend/content/knowledge.json")
    database_path: str = os.getenv("DATABASE_PATH", "data/xuanshu.db")
    robot_model_storage_path: str = os.getenv("ROBOT_MODEL_STORAGE_PATH", "data/robot-models")
    robot_upload_max_bytes: int = int(os.getenv("ROBOT_UPLOAD_MAX_BYTES", str(50 * 1024 * 1024)))
    robot_extract_max_bytes: int = int(os.getenv("ROBOT_EXTRACT_MAX_BYTES", str(200 * 1024 * 1024)))
    robot_archive_max_files: int = int(os.getenv("ROBOT_ARCHIVE_MAX_FILES", "2000"))
    admin_token: str = os.getenv("ADMIN_TOKEN", "")
    settings_encryption_key: str = os.getenv("SETTINGS_ENCRYPTION_KEY", "")


settings = Settings()
