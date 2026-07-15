from __future__ import annotations

import json
from collections.abc import AsyncIterator

import httpx

from .config import settings
from .storage import RuntimeLLMConfig


class LLMConfigurationError(RuntimeError):
    pass


class OpenAICompatibleProvider:
    def __init__(self, config: RuntimeLLMConfig):
        self.config = config
        if not config.api_key:
            raise LLMConfigurationError("后端尚未配置 DASHSCOPE_API_KEY")

    async def stream(self, messages: list[dict]) -> AsyncIterator[str]:
        payload = {
            "model": self.config.model,
            "messages": messages,
            "stream": True,
            "stream_options": {"include_usage": True},
            "temperature": 0.3,
        }
        headers = {"Authorization": f"Bearer {self.config.api_key}", "Content-Type": "application/json"}
        timeout = httpx.Timeout(settings.llm_timeout_seconds, connect=15)
        async with httpx.AsyncClient(timeout=timeout) as client:
            async with client.stream("POST", f"{self.config.base_url}/chat/completions", json=payload, headers=headers) as response:
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
