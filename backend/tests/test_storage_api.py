import sqlite3

import pytest
from cryptography.fernet import Fernet
from fastapi.testclient import TestClient

from app import main
from app.config import settings
from app.storage import Storage


@pytest.fixture
def isolated_storage(tmp_path, monkeypatch):
    test_storage = Storage(str(tmp_path / "xuanshu-test.db"), Fernet.generate_key().decode("utf-8"))
    monkeypatch.setattr(main, "storage", test_storage)
    original_token = settings.admin_token
    object.__setattr__(settings, "admin_token", "test-admin-token")
    try:
        yield test_storage
    finally:
        object.__setattr__(settings, "admin_token", original_token)


def test_api_key_is_encrypted_at_rest(isolated_storage):
    isolated_storage.set_setting("llm_api_key", "sk-test-secret-value", secret=True)

    with sqlite3.connect(isolated_storage.database_path) as connection:
        stored = connection.execute("SELECT value, encrypted FROM app_settings WHERE key = 'llm_api_key'").fetchone()

    assert stored[1] == 1
    assert "sk-test-secret-value" not in stored[0]
    assert isolated_storage.get_setting("llm_api_key") == "sk-test-secret-value"


def test_llm_settings_crud_never_returns_plain_key(isolated_storage):
    client = TestClient(main.app)
    payload = {
        "provider": "dashscope",
        "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "model": "qwen-plus",
        "api_key": "sk-test-secret-value",
    }

    unauthorized = client.put("/api/v1/settings/llm", json=payload)
    assert unauthorized.status_code == 401

    saved = client.put("/api/v1/settings/llm", json=payload, headers={"X-Admin-Token": "test-admin-token"})
    assert saved.status_code == 200
    assert saved.json()["api_key_hint"] == "••••alue"
    assert "sk-test-secret-value" not in saved.text

    loaded = client.get("/api/v1/settings/llm")
    assert loaded.json()["api_key_configured"] is True
    assert "sk-test-secret-value" not in loaded.text

    deleted = client.delete("/api/v1/settings/llm", headers={"X-Admin-Token": "test-admin-token"})
    assert deleted.status_code == 200
    assert deleted.json()["api_key_source"] == "none"


def test_learning_record_crud(isolated_storage):
    client = TestClient(main.app)
    client_id = "browser-client-001"

    created = client.post(
        "/api/v1/learning-records",
        json={
            "client_id": client_id,
            "record_type": "chapter-progress",
            "record_key": "ros2-qos",
            "payload": {"state": 1, "notes": "理解可靠性策略"},
        },
    )
    assert created.status_code == 201
    record_id = created.json()["id"]

    listed = client.get("/api/v1/learning-records", params={"client_id": client_id})
    assert listed.status_code == 200
    assert listed.json()["items"][0]["record_key"] == "ros2-qos"

    updated = client.put(
        f"/api/v1/learning-records/{record_id}",
        json={"client_id": client_id, "payload": {"state": 2, "notes": "已完成实验"}},
    )
    assert updated.status_code == 200
    assert updated.json()["payload"]["state"] == 2

    fetched = client.get(f"/api/v1/learning-records/{record_id}", params={"client_id": client_id})
    assert fetched.status_code == 200

    deleted = client.delete(f"/api/v1/learning-records/{record_id}", params={"client_id": client_id})
    assert deleted.status_code == 204
    assert client.get(f"/api/v1/learning-records/{record_id}", params={"client_id": client_id}).status_code == 404
