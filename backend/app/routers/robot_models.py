from __future__ import annotations

from pathlib import Path, PurePosixPath

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, Response

from ..config import settings
from ..robot_models.service import RobotModelError, RobotModelService
from ..storage import storage


router = APIRouter(prefix=f"{settings.api_prefix}/robot-models", tags=["robot-models"])


def service() -> RobotModelService:
    return RobotModelService(storage)


def handle_error(exc: RobotModelError) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail={"code": exc.code, "message": str(exc)})


@router.post("", status_code=201)
async def upload_robot_model(
    file: UploadFile = File(...),
    name: str | None = Form(default=None),
    description: str = Form(default=""),
    urdf_file: str | None = Form(default=None),
) -> dict:
    content = await file.read(settings.robot_upload_max_bytes + 1)
    try:
        return service().create(
            filename=file.filename or "robot.urdf",
            content=content,
            name=name,
            description=description,
            selected_urdf=urdf_file,
        )
    except RobotModelError as exc:
        raise handle_error(exc) from exc


@router.get("")
async def list_robot_models() -> dict:
    return {"items": service().list()}


@router.get("/{model_id}")
async def get_robot_model(model_id: str) -> dict:
    try:
        return service().get(model_id)
    except RobotModelError as exc:
        raise handle_error(exc) from exc


@router.get("/{model_id}/urdf")
async def get_robot_urdf(model_id: str) -> Response:
    try:
        record = service().record(model_id)
    except RobotModelError as exc:
        raise handle_error(exc) from exc
    path = Path(record["storage_path"]) / record["urdf_file"]
    if not path.is_file():
        raise HTTPException(status_code=404, detail={"code": "urdf_not_found", "message": "URDF 文件不存在"})
    return Response(path.read_bytes(), media_type="application/xml")


@router.get("/{model_id}/assets/{asset_path:path}")
async def get_robot_asset(model_id: str, asset_path: str) -> FileResponse:
    try:
        record = service().record(model_id)
    except RobotModelError as exc:
        raise handle_error(exc) from exc
    relative = PurePosixPath(asset_path.replace("\\", "/"))
    root = Path(record["storage_path"]).resolve()
    target = root.joinpath(*relative.parts).resolve()
    if relative.is_absolute() or ".." in relative.parts or not target.is_relative_to(root) or not target.is_file():
        raise HTTPException(status_code=404, detail={"code": "asset_missing", "message": "模型资源不存在"})
    return FileResponse(target)


@router.delete("/{model_id}", status_code=204)
async def delete_robot_model(model_id: str) -> None:
    try:
        service().delete(model_id)
    except RobotModelError as exc:
        raise handle_error(exc) from exc
