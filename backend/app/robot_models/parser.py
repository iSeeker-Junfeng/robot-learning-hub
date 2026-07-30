from __future__ import annotations

import math
import posixpath
import xml.etree.ElementTree as ET
from pathlib import Path, PurePosixPath
from typing import Any


JOINT_TYPES = {"fixed", "revolute", "continuous", "prismatic", "planar", "floating"}
MAX_XML_DEPTH = 128


class UrdfError(ValueError):
    pass


def _numbers(value: str | None, length: int, default: tuple[float, ...]) -> list[float]:
    if not value:
        return list(default)
    try:
        parsed = [float(part) for part in value.split()]
    except ValueError as exc:
        raise UrdfError(f"无法解析数值：{value}") from exc
    if len(parsed) != length or not all(math.isfinite(number) for number in parsed):
        raise UrdfError(f"数值必须包含 {length} 个有限数字：{value}")
    return parsed


def _xml_depth(root: ET.Element) -> int:
    maximum = 0
    stack = [(root, 1)]
    while stack:
        node, depth = stack.pop()
        maximum = max(maximum, depth)
        stack.extend((child, depth + 1) for child in node)
    return maximum


def _parse_mimic(node: ET.Element | None, joint_name: str) -> dict[str, Any] | None:
    if node is None:
        return None
    try:
        multiplier = float(node.get("multiplier", "1"))
        offset = float(node.get("offset", "0"))
    except ValueError as exc:
        raise UrdfError(f"Joint {joint_name} 的 Mimic 参数无效") from exc
    if not math.isfinite(multiplier) or not math.isfinite(offset):
        raise UrdfError(f"Joint {joint_name} 的 Mimic 参数无效")
    return {"joint": node.get("joint"), "multiplier": multiplier, "offset": offset}


def _resolve_asset(filename: str, urdf_file: str, model_root: Path) -> str | None:
    raw = filename.replace("\\", "/")
    candidates: list[str] = []
    if raw.startswith("package://"):
        package_path = raw[len("package://") :].lstrip("/")
        parts = PurePosixPath(package_path).parts
        candidates.append(package_path)
        if len(parts) > 1:
            candidates.append(PurePosixPath(*parts[1:]).as_posix())
    else:
        candidates.append(posixpath.normpath(posixpath.join(posixpath.dirname(urdf_file), raw)))
        candidates.append(posixpath.normpath(raw.lstrip("./")))

    for candidate in candidates:
        path = PurePosixPath(candidate)
        if path.is_absolute() or ".." in path.parts:
            continue
        resolved = model_root.joinpath(*path.parts)
        if resolved.is_file() and resolved.resolve().is_relative_to(model_root.resolve()):
            return path.as_posix()
    return None


def parse_urdf(urdf_path: Path, model_root: Path, urdf_file: str) -> tuple[dict[str, Any], bytes]:
    xml_bytes = urdf_path.read_bytes()
    upper = xml_bytes.upper()
    if b"<!DOCTYPE" in upper or b"<!ENTITY" in upper:
        raise UrdfError("URDF 不允许 DOCTYPE 或 XML 实体")
    try:
        root = ET.fromstring(xml_bytes)
    except ET.ParseError as exc:
        raise UrdfError(f"URDF XML 无效：{exc}") from exc
    if root.tag != "robot":
        raise UrdfError("URDF 根节点必须是 robot")
    if _xml_depth(root) > MAX_XML_DEPTH:
        raise UrdfError(f"URDF XML 深度不能超过 {MAX_XML_DEPTH}")

    robot_name = (root.get("name") or Path(urdf_file).stem).strip()
    link_nodes = root.findall("link")
    link_names = [str(node.get("name") or "").strip() for node in link_nodes]
    if not link_names or any(not name for name in link_names) or len(set(link_names)) != len(link_names):
        raise UrdfError("URDF 必须包含名称唯一的 Link")

    links = [
        {
            "name": name,
            "visual_count": len(node.findall("visual")),
            "collision_count": len(node.findall("collision")),
        }
        for node, name in zip(link_nodes, link_names, strict=True)
    ]
    link_set = set(link_names)
    child_links: set[str] = set()
    adjacency: dict[str, list[str]] = {name: [] for name in link_names}
    joints: list[dict[str, Any]] = []
    warnings: list[str] = []

    for node in root.findall("joint"):
        name = str(node.get("name") or "").strip()
        joint_type = str(node.get("type") or "").strip()
        parent_node = node.find("parent")
        child_node = node.find("child")
        parent = str(parent_node.get("link") if parent_node is not None else "").strip()
        child = str(child_node.get("link") if child_node is not None else "").strip()
        if not name or joint_type not in JOINT_TYPES:
            raise UrdfError(f"Joint 名称为空或类型不支持：{name or '<unnamed>'}")
        if parent not in link_set or child not in link_set or parent == child:
            raise UrdfError(f"Joint {name} 的 parent/child 无效")
        if child in child_links:
            raise UrdfError(f"Link {child} 存在多个父 Joint")
        child_links.add(child)
        adjacency[parent].append(child)

        axis_node = node.find("axis")
        limit_node = node.find("limit")
        limit = None
        if limit_node is not None:
            try:
                limit = {
                    key: float(limit_node.get(key))
                    for key in ("lower", "upper", "velocity", "effort")
                    if limit_node.get(key) is not None
                }
            except ValueError as exc:
                raise UrdfError(f"Joint {name} 的 Limit 包含无效数字") from exc
            if not all(math.isfinite(value) for value in limit.values()):
                raise UrdfError(f"Joint {name} 的 Limit 包含无效数字")
            if "lower" in limit and "upper" in limit and limit["lower"] > limit["upper"]:
                raise UrdfError(f"Joint {name} 的 lower limit 不能大于 upper limit")
        if joint_type in {"revolute", "prismatic"} and (
            not limit or "lower" not in limit or "upper" not in limit
        ):
            warnings.append(f"Joint {name} 缺少 lower/upper limit，将使用安全默认范围")

        origin_node = node.find("origin")
        mimic_node = node.find("mimic")
        joints.append(
            {
                "name": name,
                "type": joint_type,
                "parent": parent,
                "child": child,
                "axis": _numbers(axis_node.get("xyz") if axis_node is not None else None, 3, (1.0, 0.0, 0.0)),
                "origin": {
                    "xyz": _numbers(origin_node.get("xyz") if origin_node is not None else None, 3, (0.0, 0.0, 0.0)),
                    "rpy": _numbers(origin_node.get("rpy") if origin_node is not None else None, 3, (0.0, 0.0, 0.0)),
                },
                "limit": limit,
                "mimic": _parse_mimic(mimic_node, name),
            }
        )

    joint_names = {joint["name"] for joint in joints}
    if len(joint_names) != len(joints):
        raise UrdfError("Joint 名称必须唯一")
    for joint in joints:
        mimic = joint["mimic"]
        if mimic and (mimic["joint"] not in joint_names or mimic["joint"] == joint["name"]):
            raise UrdfError(f"Joint {joint['name']} 的 Mimic 目标无效")
    roots = link_set - child_links
    if len(roots) != 1:
        raise UrdfError("URDF 必须构成单根运动树")
    root_link = next(iter(roots))
    visited: set[str] = set()
    stack = [root_link]
    while stack:
        link = stack.pop()
        if link in visited:
            raise UrdfError("URDF 运动树包含环")
        visited.add(link)
        stack.extend(adjacency[link])
    if visited != link_set:
        raise UrdfError("URDF 包含未连接的 Link")

    missing_assets: list[str] = []
    for mesh in root.findall(".//mesh"):
        filename = str(mesh.get("filename") or "").strip()
        if not filename:
            continue
        resolved = _resolve_asset(filename, urdf_file, model_root)
        if resolved:
            mesh.set("filename", resolved)
        else:
            missing_assets.append(filename)
    if missing_assets:
        warnings.append(f"{len(missing_assets)} 个 Mesh/Texture 资源缺失")

    metadata = {
        "name": robot_name,
        "urdf_file": urdf_file,
        "root_link": root_link,
        "links": links,
        "joints": joints,
        "missing_assets": sorted(set(missing_assets)),
        "warnings": warnings,
    }
    processed = ET.tostring(root, encoding="utf-8", xml_declaration=True)
    return metadata, processed
