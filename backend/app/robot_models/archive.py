from __future__ import annotations

import shutil
import stat
import zipfile
from pathlib import Path, PurePosixPath


ALLOWED_EXTENSIONS = {
    ".urdf",
    ".xml",
    ".stl",
    ".dae",
    ".obj",
    ".mtl",
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".bmp",
    ".tga",
}
MESH_EXTENSIONS = {".stl", ".dae", ".obj"}
MAX_MESH_BYTES = 50 * 1024 * 1024
MAX_URDF_FILES = 10


class ArchiveError(ValueError):
    def __init__(self, code: str, message: str, status_code: int = 400):
        super().__init__(message)
        self.code = code
        self.status_code = status_code


def safe_member_path(raw_name: str) -> PurePosixPath:
    path = PurePosixPath(raw_name.replace("\\", "/"))
    if path.is_absolute() or any(part in {"", ".", ".."} for part in path.parts):
        raise ArchiveError("invalid_archive", f"压缩包包含不安全路径：{raw_name}")
    if path.suffix.lower() not in ALLOWED_EXTENSIONS:
        raise ArchiveError("invalid_archive", f"不支持的资源类型：{path.suffix or raw_name}")
    return path


def extract_zip(
    archive_path: Path,
    target: Path,
    *,
    max_files: int,
    max_total_bytes: int,
) -> list[str]:
    try:
        archive = zipfile.ZipFile(archive_path)
    except (OSError, zipfile.BadZipFile) as exc:
        raise ArchiveError("invalid_archive", "ZIP 文件无法读取") from exc

    extracted: list[str] = []
    total_size = 0
    with archive:
        files = [item for item in archive.infolist() if not item.is_dir()]
        if len(files) > max_files:
            raise ArchiveError("invalid_archive", f"压缩包文件数量超过 {max_files} 个")
        seen_paths: set[str] = set()

        for item in files:
            mode = (item.external_attr >> 16) & 0xFFFF
            if stat.S_ISLNK(mode):
                raise ArchiveError("invalid_archive", f"压缩包不允许符号链接：{item.filename}")
            member = safe_member_path(item.filename)
            normalized_name = member.as_posix().casefold()
            if normalized_name in seen_paths:
                raise ArchiveError("invalid_archive", f"压缩包包含重复路径：{item.filename}")
            seen_paths.add(normalized_name)
            total_size += item.file_size
            if total_size > max_total_bytes:
                raise ArchiveError("archive_too_large", "解压后资源总大小超过限制", 413)
            if member.suffix.lower() in MESH_EXTENSIONS and item.file_size > MAX_MESH_BYTES:
                raise ArchiveError("archive_too_large", f"Mesh 文件过大：{item.filename}", 413)
            if item.file_size > 1024 * 1024 and item.file_size / max(item.compress_size, 1) > 1000:
                raise ArchiveError("archive_too_large", f"压缩比异常：{item.filename}", 413)

            destination = target.joinpath(*member.parts)
            destination.parent.mkdir(parents=True, exist_ok=True)
            with archive.open(item) as source, destination.open("wb") as output:
                shutil.copyfileobj(source, output)
            extracted.append(member.as_posix())

    urdf_files = [name for name in extracted if Path(name).suffix.lower() == ".urdf"]
    if not urdf_files:
        raise ArchiveError("urdf_not_found", "资源包中没有找到 URDF 文件")
    if len(urdf_files) > MAX_URDF_FILES:
        raise ArchiveError("invalid_archive", f"URDF 文件数量超过 {MAX_URDF_FILES} 个")
    return urdf_files
