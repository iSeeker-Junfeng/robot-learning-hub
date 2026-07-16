from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Iterator

from cryptography.fernet import Fernet, InvalidToken

from .config import settings


def utc_now() -> str:
    return datetime.now(UTC).isoformat()


@dataclass(frozen=True)
class RuntimeLLMConfig:
    provider: str
    base_url: str
    model: str
    api_key: str


class StorageError(RuntimeError):
    pass


class Storage:
    def __init__(self, database_path: str, encryption_key: str = ""):
        self.database_path = Path(database_path)
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        self._cipher: Fernet | None = None
        if encryption_key:
            try:
                self._cipher = Fernet(encryption_key.encode("utf-8"))
            except (TypeError, ValueError) as exc:
                raise StorageError("SETTINGS_ENCRYPTION_KEY 不是有效的 Fernet 密钥") from exc
        self.initialize()

    @contextmanager
    def connect(self) -> Iterator[sqlite3.Connection]:
        connection = sqlite3.connect(self.database_path, timeout=10)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        connection.execute("PRAGMA journal_mode = WAL")
        try:
            yield connection
            connection.commit()
        finally:
            connection.close()

    def initialize(self) -> None:
        with self.connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS app_settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    encrypted INTEGER NOT NULL DEFAULT 0,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS learning_records (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    client_id TEXT NOT NULL,
                    record_type TEXT NOT NULL,
                    record_key TEXT NOT NULL,
                    payload_json TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    UNIQUE(client_id, record_type, record_key)
                );

                CREATE INDEX IF NOT EXISTS idx_learning_records_client
                    ON learning_records(client_id, record_type, updated_at DESC);
                """
            )

    @property
    def encryption_ready(self) -> bool:
        return self._cipher is not None

    def set_setting(self, key: str, value: str, *, secret: bool = False) -> None:
        if secret:
            if not self._cipher:
                raise StorageError("后端尚未配置 SETTINGS_ENCRYPTION_KEY，不能安全保存 API Key")
            value = self._cipher.encrypt(value.encode("utf-8")).decode("utf-8")
        with self.connect() as connection:
            connection.execute(
                """
                INSERT INTO app_settings(key, value, encrypted, updated_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(key) DO UPDATE SET
                    value = excluded.value,
                    encrypted = excluded.encrypted,
                    updated_at = excluded.updated_at
                """,
                (key, value, int(secret), utc_now()),
            )

    def get_setting(self, key: str) -> str | None:
        with self.connect() as connection:
            row = connection.execute("SELECT value, encrypted FROM app_settings WHERE key = ?", (key,)).fetchone()
        if not row:
            return None
        if not row["encrypted"]:
            return str(row["value"])
        if not self._cipher:
            raise StorageError("数据库包含加密配置，但后端缺少 SETTINGS_ENCRYPTION_KEY")
        try:
            return self._cipher.decrypt(str(row["value"]).encode("utf-8")).decode("utf-8")
        except InvalidToken as exc:
            raise StorageError("无法解密数据库配置，请检查 SETTINGS_ENCRYPTION_KEY") from exc

    def delete_settings(self, keys: list[str]) -> int:
        placeholders = ",".join("?" for _ in keys)
        with self.connect() as connection:
            cursor = connection.execute(f"DELETE FROM app_settings WHERE key IN ({placeholders})", keys)
            return cursor.rowcount

    def runtime_llm_config(self) -> RuntimeLLMConfig:
        return RuntimeLLMConfig(
            provider=self.get_setting("llm_provider") or settings.llm_provider,
            base_url=(self.get_setting("llm_base_url") or settings.llm_base_url).rstrip("/"),
            model=self.get_setting("llm_model") or settings.llm_model,
            api_key=self.get_setting("llm_api_key") or settings.llm_api_key,
        )

    def llm_status(self) -> dict[str, Any]:
        config = self.runtime_llm_config()
        source = "database" if self.get_setting("llm_api_key") else "environment" if settings.llm_api_key else "none"
        return {
            "provider": config.provider,
            "base_url": config.base_url,
            "model": config.model,
            "api_key_configured": bool(config.api_key),
            "api_key_hint": f"••••{config.api_key[-4:]}" if config.api_key else "",
            "api_key_source": source,
            "database_path": str(self.database_path),
            "encrypted_storage_ready": self.encryption_ready,
        }

    @staticmethod
    def _record(row: sqlite3.Row) -> dict[str, Any]:
        return {
            "id": row["id"],
            "client_id": row["client_id"],
            "record_type": row["record_type"],
            "record_key": row["record_key"],
            "payload": json.loads(row["payload_json"]),
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
        }

    def create_record(self, client_id: str, record_type: str, record_key: str, payload: dict[str, Any]) -> dict[str, Any]:
        now = utc_now()
        try:
            with self.connect() as connection:
                cursor = connection.execute(
                    """INSERT INTO learning_records(client_id, record_type, record_key, payload_json, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?)""",
                    (client_id, record_type, record_key, json.dumps(payload, ensure_ascii=False), now, now),
                )
                row = connection.execute("SELECT * FROM learning_records WHERE id = ?", (cursor.lastrowid,)).fetchone()
        except sqlite3.IntegrityError as exc:
            raise StorageError("同一学习者下的记录类型和记录键必须唯一") from exc
        return self._record(row)

    def list_records(self, client_id: str, record_type: str | None = None) -> list[dict[str, Any]]:
        query = "SELECT * FROM learning_records WHERE client_id = ?"
        params: list[Any] = [client_id]
        if record_type:
            query += " AND record_type = ?"
            params.append(record_type)
        query += " ORDER BY updated_at DESC"
        with self.connect() as connection:
            rows = connection.execute(query, params).fetchall()
        return [self._record(row) for row in rows]

    def get_record(self, record_id: int, client_id: str) -> dict[str, Any] | None:
        with self.connect() as connection:
            row = connection.execute(
                "SELECT * FROM learning_records WHERE id = ? AND client_id = ?", (record_id, client_id)
            ).fetchone()
        return self._record(row) if row else None

    def update_record(self, record_id: int, client_id: str, payload: dict[str, Any]) -> dict[str, Any] | None:
        with self.connect() as connection:
            cursor = connection.execute(
                "UPDATE learning_records SET payload_json = ?, updated_at = ? WHERE id = ? AND client_id = ?",
                (json.dumps(payload, ensure_ascii=False), utc_now(), record_id, client_id),
            )
            if not cursor.rowcount:
                return None
            row = connection.execute("SELECT * FROM learning_records WHERE id = ?", (record_id,)).fetchone()
        return self._record(row)

    def delete_record(self, record_id: int, client_id: str) -> bool:
        with self.connect() as connection:
            cursor = connection.execute(
                "DELETE FROM learning_records WHERE id = ? AND client_id = ?", (record_id, client_id)
            )
            return bool(cursor.rowcount)


storage = Storage(settings.database_path, settings.settings_encryption_key)
