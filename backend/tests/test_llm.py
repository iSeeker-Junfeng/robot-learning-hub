import json
from dataclasses import replace

import httpx
import pytest
from fastapi.testclient import TestClient

from app import llm, main
from app.storage import RuntimeLLMConfig


CONFIG = RuntimeLLMConfig(
    provider="dashscope",
    base_url="https://model.example/compatible-mode/v1",
    model="qwen-plus",
    api_key="test-secret-key",
)


def mock_upstream(monkeypatch, handler):
    clients = []

    class MockAsyncClient(httpx.AsyncClient):
        def __init__(self, **kwargs):
            super().__init__(transport=httpx.MockTransport(handler), **kwargs)
            clients.append(self)

    class MockSyncClient(httpx.Client):
        def __init__(self, **kwargs):
            super().__init__(transport=httpx.MockTransport(handler), **kwargs)
            clients.append(self)

    monkeypatch.setattr(llm.httpx, "AsyncClient", MockAsyncClient)
    monkeypatch.setattr(llm.httpx, "Client", MockSyncClient)
    return clients


def completion_stream():
    chunks = [
        {"choices": [{"index": 0, "delta": {"role": "assistant", "content": ""}}]},
        {"choices": [{"index": 0, "delta": {"content": "你好"}}]},
        {"choices": [{"index": 0, "delta": {"content": "，ROS 2"}}]},
        {"choices": [{"index": 0, "delta": {}, "finish_reason": "stop"}]},
        {"choices": [], "usage": {"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15}},
    ]
    return "".join(f"data: {json.dumps(chunk)}\n\n" for chunk in chunks) + "data: [DONE]\n\n"


@pytest.mark.asyncio
async def test_langchain_stream_preserves_messages_config_and_text(monkeypatch):
    requests = []

    def handler(request):
        requests.append(request)
        return httpx.Response(200, headers={"content-type": "text/event-stream"}, text=completion_stream())

    clients = mock_upstream(monkeypatch, handler)
    messages = [
        {"role": "system", "content": "用中文回答"},
        {"role": "user", "content": "之前的问题"},
        {"role": "assistant", "content": "之前的回答"},
        {"role": "user", "content": "当前问题"},
    ]
    assert [token async for token in llm.LangChainProvider(CONFIG).stream(messages)] == ["你好", "，ROS 2"]
    request = requests[0]
    assert str(request.url) == CONFIG.base_url + "/chat/completions"
    assert request.headers["authorization"] == "Bearer " + CONFIG.api_key
    payload = json.loads(request.content)
    assert payload["messages"] == messages
    assert payload["model"] == CONFIG.model
    assert payload["temperature"] == 0.3
    assert payload["stream"] is True
    assert payload["stream_options"] == {"include_usage": True}
    assert request.extensions["timeout"]["connect"] == 15
    assert request.extensions["timeout"]["read"] == llm.settings.llm_timeout_seconds
    assert all(client.is_closed for client in clients)


def test_missing_key_fails_before_model_call():
    with pytest.raises(llm.LLMConfigurationError, match="API Key"):
        llm.LangChainProvider(replace(CONFIG, api_key=""))


@pytest.mark.parametrize("failure", [None, 401, 429, 500, "timeout"])
def test_chat_sse_with_real_langchain_adapter(monkeypatch, failure):
    requests = []

    def handler(request):
        requests.append(request)
        if failure == "timeout":
            raise httpx.ReadTimeout("secret upstream detail", request=request)
        if failure:
            return httpx.Response(failure, json={"error": {"message": "secret upstream detail"}})
        return httpx.Response(200, headers={"content-type": "text/event-stream"}, text=completion_stream())

    clients = mock_upstream(monkeypatch, handler)
    monkeypatch.setattr(main.storage, "runtime_llm_config", lambda: CONFIG)
    with TestClient(main.app) as client:
        response = client.post("/api/v1/chat/stream", json={
            "question": "什么是 QoS？",
            "chapter_id": "ros2-qos",
            "history": [{"role": "user", "content": "历史问题"}],
            "context": {"title": "QoS", "track": "ROS 2", "goal": "理解可靠性"},
        })
    events = [line[7:] for line in response.text.splitlines() if line.startswith("event: ")]
    assert response.status_code == 200
    assert events[:2] == ["meta", "sources"]
    assert len(requests) == 1  # Do not retry failed calls or replay partial answers.
    assert all(client.is_closed for client in clients)
    if failure:
        assert events == ["meta", "sources", "error"]
        assert "upstream_error" in response.text
        assert "secret upstream detail" not in response.text
        assert CONFIG.api_key not in response.text
    else:
        assert events == ["meta", "sources", "delta", "delta", "done"]
        assert "你好" in response.text
        messages = json.loads(requests[0].content)["messages"]
        assert messages[0]["role"] == "system"
        assert "检索到的学习资料" in messages[0]["content"]
        assert messages[1] == {"role": "user", "content": "历史问题"}
        assert "ROS 2 / QoS" in messages[-1]["content"]
        assert "什么是 QoS？" in messages[-1]["content"]


@pytest.mark.asyncio
async def test_early_stream_close_releases_client(monkeypatch):
    clients = mock_upstream(monkeypatch, lambda request: httpx.Response(
        200, headers={"content-type": "text/event-stream"}, text=completion_stream(),
    ))
    stream = llm.LangChainProvider(CONFIG).stream([{"role": "user", "content": "你好"}])
    assert await anext(stream) == "你好"
    await stream.aclose()
    assert all(client.is_closed for client in clients)
