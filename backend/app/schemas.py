from typing import Literal

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
