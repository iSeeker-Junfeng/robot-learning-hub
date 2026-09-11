from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import aclosing

import httpx
from langchain_openai import ChatOpenAI

from .config import settings
from .storage import RuntimeLLMConfig


class LLMConfigurationError(RuntimeError):
    pass


class LangChainProvider:
    """Stream text from an OpenAI-compatible endpoint through LangChain."""

    def __init__(self, config: RuntimeLLMConfig):
        self.config = config
        if not config.api_key:
            raise LLMConfigurationError("后端尚未配置模型 API Key，请在 AI 配置中保存或设置 DASHSCOPE_API_KEY / LLM_API_KEY")

    async def stream(self, messages: list[dict]) -> AsyncIterator[str]:
        timeout = httpx.Timeout(settings.llm_timeout_seconds, connect=15)
        # Scope both clients to the stream, including cancellation and errors.
        with httpx.Client(timeout=timeout) as sync_client:
            async with httpx.AsyncClient(timeout=timeout) as async_client:
                model = ChatOpenAI(
                    model=self.config.model,
                    api_key=self.config.api_key,
                    base_url=self.config.base_url,
                    temperature=0.3,
                    timeout=timeout,
                    max_retries=0,
                    stream_usage=True,
                    use_responses_api=False,
                    http_client=sync_client,
                    http_async_client=async_client,
                )
                async with aclosing(model.astream(messages)) as chunks:
                    async for chunk in chunks:
                        # Ignore usage-only, reasoning and tool-call chunks.
                        text = chunk.text
                        if text:
                            yield text
