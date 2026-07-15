from __future__ import annotations

import json
from collections.abc import AsyncIterator

import httpx

from .config import settings


class LLMConfigurationError(RuntimeError):
    pass


class OpenAICompatibleProvider:
    def __init__(self):
        if not settings.llm_api_key:
            raise LLMConfigurationError("后端尚未配置 LLM_API_KEY")

    async def stream(self, messages: list[dict]) -> AsyncIterator[str]:
        payload = {
            "model": settings.llm_model,
            "messages": messages,
            "stream": True,
            "stream_options": {"include_usage": True},
            "temperature": 0.3,
        }
        headers = {"Authorization": f"Bearer {settings.llm_api_key}", "Content-Type": "application/json"}
        timeout = httpx.Timeout(settings.llm_timeout_seconds, connect=15)
        async with httpx.AsyncClient(timeout=timeout) as client:
            async with client.stream("POST", f"{settings.llm_base_url}/chat/completions", json=payload, headers=headers) as response:
                if response.status_code >= 400:
                    detail = (await response.aread()).decode("utf-8", errors="replace")[:500]
                    raise RuntimeError(f"模型服务返回 {response.status_code}: {detail}")
                async for line in response.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    data = line[6:]
                    if data == "[DONE]":
                        break
                    chunk = json.loads(data)
                    choices = chunk.get("choices") or []
                    if choices:
                        content = choices[0].get("delta", {}).get("content")
                        if content:
                            yield content
