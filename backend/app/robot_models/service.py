from __future__ import annotations

import shutil
import tempfile
import uuid
from pathlib import Path, PurePosixPath

from ..config import settings
from ..storage import Storage, StorageError
from .archive import ArchiveError, extract_zip
from .parser import UrdfError, parse_urdf


class RobotModelError(RuntimeError):
    def __init__(self, code: str, message: str, status_code: int = 400):
        super().__init__(message)
        self.code = code
        self.status_code = status_code


class RobotModelService:
    def __init__(self, storage: Storage):
        self.storage = storage
        self.root = Path(settings.robot_model_storage_path)
        self.root.mkdir(parents=True, exist_ok=True)

    def create(
        self,
        *,
        filename: str,
        content: bytes,
        name: str | None,
        description: str,
        selected_urdf: str | None,
    ) -> dict:
        if len(content) > settings.robot_upload_max_bytes:
            raise RobotModelError("archive_too_large", "上传文件超过 50 MB", 413)
        suffix = Path(filename).suffix.lower()
        if suffix not in {".zip", ".urdf"}:
            raise RobotModelError("invalid_archive", "仅支持 .urdf 或 .zip 文件")

        model_id = f"mdl_{uuid.uuid4().hex[:20]}"
        final_path = self.root / model_id
        try:
            with tempfile.TemporaryDirectory(prefix="robot-upload-", dir=self.root) as temporary:
                working = Path(temporary)
                if suffix == ".zip":
                    archive_path = working / "upload.zip"
                    archive_path.write_bytes(content)
                    urdf_files = extract_zip(
                        archive_path,
                        working,
                        max_files=settings.robot_archive_max_files,
                        max_total_bytes=settings.robot_extract_max_bytes,
                    )
                    archive_path.unlink()
                    if selected_urdf:
                        selected = PurePosixPath(selected_urdf.replace("\\", "/"))
                        if selected.is_absolute() or ".." in selected.parts or selected.as_posix() not in urdf_files:
                            raise RobotModelError("invalid_urdf", "指定的 URDF 入口不存在")
                        urdf_file = selected.as_posix()
                    elif len(urdf_files) > 1:
                        raise RobotModelError(
                            "multiple_urdf_requires_selection",
                            "资源包包含多个 URDF，请指定入口文件",
                            422,
                        )
                    else:
                        urdf_file = urdf_files[0]
                else:
                    safe_name = Path(filename).name
                    urdf_file = safe_name if safe_name.lower().endswith(".urdf") else "robot.urdf"
                    (working / urdf_file).write_bytes(content)

                metadata, processed = parse_urdf(working / urdf_file, working, urdf_file)
                (working / urdf_file).write_bytes(processed)
                display_name = (name or metadata["name"]).strip() or metadata["name"]
                metadata["model_id"] = model_id
                shutil.move(str(working), final_path)

            try:
                record = self.storage.create_robot_model(
                    model_id,
                    display_name,
                    description.strip(),
                    urdf_file,
                    str(final_path),
                    metadata["root_link"],
                    metadata,
                )
            except StorageError as exc:
                shutil.rmtree(final_path, ignore_errors=True)
                raise RobotModelError("model_name_conflict", str(exc), 409) from exc
            return self.public_model(record)
        except RobotModelError:
            raise
        except ArchiveError as exc:
            raise RobotModelError(exc.code, str(exc), exc.status_code) from exc
        except UrdfError as exc:
            raise RobotModelError("invalid_urdf", str(exc)) from exc
        except (OSError, ValueError) as exc:
            raise RobotModelError("invalid_archive", "无法保存或解析机器人资源") from exc

    @staticmethod
    def public_model(record: dict) -> dict:
        metadata = record["metadata"]
        joints = metadata.get("joints", [])
        return {
            "id": record["id"],
            "name": record["name"],
            "description": record["description"],
            "urdf_file": record["urdf_file"],
            "root_link": record["root_link"],
            "links": metadata.get("links", []),
            "joints": joints,
            "missing_assets": metadata.get("missing_assets", []),
            "warnings": metadata.get("warnings", []),
            "links_count": len(metadata.get("links", [])),
            "joints_count": len(joints),
            "movable_joints_count": sum(joint.get("type") != "fixed" for joint in joints),
            "urdf_url": f"{settings.api_prefix}/robot-models/{record['id']}/urdf",
            "asset_base_url": f"{settings.api_prefix}/robot-models/{record['id']}/assets/",
            "created_at": record["created_at"],
            "updated_at": record["updated_at"],
        }

    def list(self) -> list[dict]:
        return [self.public_model(record) for record in self.storage.list_robot_models()]

    def get(self, model_id: str) -> dict:
        return self.public_model(self.record(model_id))

    def record(self, model_id: str) -> dict:
        record = self.storage.get_robot_model(model_id)
        if not record:
            raise RobotModelError("model_not_found", "机器人模型不存在", 404)
        return record

    def delete(self, model_id: str) -> None:
        record = self.storage.delete_robot_model(model_id)
        if not record:
            raise RobotModelError("model_not_found", "机器人模型不存在", 404)
        path = Path(record["storage_path"])
        if path.resolve().is_relative_to(self.root.resolve()):
            shutil.rmtree(path, ignore_errors=True)
