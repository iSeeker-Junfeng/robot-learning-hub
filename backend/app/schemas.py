from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=12000)


class ChapterContext(BaseModel):
    title: str
    track: str
    goal: str = ""
    selected_text: str = Field(default="", max_length=4000)


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=4000)
    chapter_id: str | None = None
    mode: Literal["explain", "example", "quiz", "debug"] = "explain"
    history: list[Message] = Field(default_factory=list, max_length=24)
    context: ChapterContext | None = None

    @field_validator("question")
    @classmethod
    def clean_question(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("question cannot be blank")
        return value


class FeedbackRequest(BaseModel):
    conversation_id: str
    message_id: str
    resolved: bool
    note: str = Field(default="", max_length=1000)


class LLMSettingsUpdate(BaseModel):
    provider: str = Field(default="dashscope", min_length=1, max_length=50)
    base_url: str = Field(min_length=8, max_length=500)
    model: str = Field(min_length=1, max_length=100)
    api_key: str | None = Field(default=None, min_length=8, max_length=1000)

    @field_validator("provider", "base_url", "model", "api_key")
    @classmethod
    def clean_setting(cls, value: str | None) -> str | None:
        return value.strip() if value is not None else value


class LearningRecordCreate(BaseModel):
    client_id: str = Field(min_length=8, max_length=100)
    record_type: str = Field(min_length=1, max_length=60, pattern=r"^[a-z0-9_-]+$")
    record_key: str = Field(min_length=1, max_length=160)
    payload: dict[str, Any] = Field(default_factory=dict)


class LearningRecordUpdate(BaseModel):
    client_id: str = Field(min_length=8, max_length=100)
    payload: dict[str, Any] = Field(default_factory=dict)
