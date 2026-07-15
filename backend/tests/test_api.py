from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_reports_configuration_state():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_chat_request_validation():
    response = client.post("/api/v1/chat/stream", json={"question": "   "})
    assert response.status_code == 422


def test_chat_without_api_key_returns_structured_sse_error():
    response = client.post("/api/v1/chat/stream", json={"question": "什么是 QoS？", "chapter_id": "ros2-qos"})
    assert response.status_code == 200
    assert "event: sources" in response.text
    assert "event: error" in response.text
    assert "model_not_configured" in response.text
