from __future__ import annotations

import io
import zipfile

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app
from app.robot_models.service import RobotModelError, RobotModelService
from app.routers import robot_models as robot_models_router
from app.storage import Storage


SIMPLE_URDF = b"""<?xml version="1.0"?>
<robot name="test_arm">
  <link name="base_link"><visual><geometry><box size="1 1 1"/></geometry></visual></link>
  <link name="tool_link"/>
  <joint name="slide" type="prismatic">
    <parent link="base_link"/><child link="tool_link"/><axis xyz="0 0 1"/>
    <limit lower="0" upper="0.2" effort="1" velocity="1"/>
  </joint>
</robot>"""


@pytest.fixture
def model_service(tmp_path):
    original = settings.robot_model_storage_path
    object.__setattr__(settings, "robot_model_storage_path", str(tmp_path / "models"))
    try:
        yield RobotModelService(Storage(str(tmp_path / "test.db")))
    finally:
        object.__setattr__(settings, "robot_model_storage_path", original)


def zip_bytes(files: dict[str, bytes]) -> bytes:
    target = io.BytesIO()
    with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED) as archive:
        for name, content in files.items():
            archive.writestr(name, content)
    return target.getvalue()


def test_single_urdf_upload_parses_and_persists_model(model_service):
    model = model_service.create(
        filename="robot.urdf",
        content=SIMPLE_URDF,
        name=None,
        description="test",
        selected_urdf=None,
    )

    assert model["name"] == "test_arm"
    assert model["root_link"] == "base_link"
    assert model["links_count"] == 2
    assert model["movable_joints_count"] == 1
    assert model_service.get(model["id"])["joints"][0]["limit"]["upper"] == 0.2


def test_robot_model_rest_api_serves_model_and_urdf(model_service, monkeypatch):
    monkeypatch.setattr(robot_models_router, "storage", model_service.storage)
    client = TestClient(app)

    created = client.post(
        "/api/v1/robot-models",
        files={"file": ("robot.urdf", SIMPLE_URDF, "application/xml")},
        data={"description": "API test"},
    )
    assert created.status_code == 201
    model_id = created.json()["id"]

    listed = client.get("/api/v1/robot-models")
    assert listed.status_code == 200
    assert listed.json()["items"][0]["id"] == model_id

    detail = client.get(f"/api/v1/robot-models/{model_id}")
    assert detail.json()["joints"][0]["name"] == "slide"

    urdf = client.get(f"/api/v1/robot-models/{model_id}/urdf")
    assert urdf.status_code == 200
    assert b'<robot name="test_arm">' in urdf.content

    deleted = client.delete(f"/api/v1/robot-models/{model_id}")
    assert deleted.status_code == 204
    assert client.get(f"/api/v1/robot-models/{model_id}").status_code == 404


def test_zip_package_asset_is_rewritten_to_served_relative_path(model_service):
    urdf = SIMPLE_URDF.replace(
        b'<box size="1 1 1"/>',
        b'<mesh filename="package://robot_description/meshes/base.stl"/>',
    )
    model = model_service.create(
        filename="robot.zip",
        content=zip_bytes({"robot.urdf": urdf, "meshes/base.stl": b"solid mesh\nendsolid mesh\n"}),
        name="mesh-arm",
        description="",
        selected_urdf=None,
    )
    record = model_service.record(model["id"])
    processed = (model_service.root / model["id"] / record["urdf_file"]).read_text("utf-8")

    assert 'filename="meshes/base.stl"' in processed
    assert model["missing_assets"] == []


def test_zip_path_traversal_is_rejected(model_service):
    with pytest.raises(RobotModelError) as raised:
        model_service.create(
            filename="robot.zip",
            content=zip_bytes({"robot.urdf": SIMPLE_URDF, "../outside.stl": b"x"}),
            name="unsafe",
            description="",
            selected_urdf=None,
        )
    assert raised.value.code == "invalid_archive"


def test_multiple_urdf_requires_explicit_entry(model_service):
    with pytest.raises(RobotModelError) as raised:
        model_service.create(
            filename="robot.zip",
            content=zip_bytes({"a.urdf": SIMPLE_URDF, "b.urdf": SIMPLE_URDF}),
            name="multi",
            description="",
            selected_urdf=None,
        )
    assert raised.value.code == "multiple_urdf_requires_selection"
    assert raised.value.status_code == 422


@pytest.mark.parametrize(
    "content",
    [
        b'<!DOCTYPE robot [<!ENTITY x "bad">]><robot name="x"><link name="&x;"/></robot>',
        b'<robot name="forest"><link name="one"/><link name="two"/></robot>',
    ],
)
def test_unsafe_xml_and_non_single_root_models_are_rejected(model_service, content):
    with pytest.raises(RobotModelError) as raised:
        model_service.create(
            filename="bad.urdf",
            content=content,
            name="bad",
            description="",
            selected_urdf=None,
        )
    assert raised.value.code == "invalid_urdf"
