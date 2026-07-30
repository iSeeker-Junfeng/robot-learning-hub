export function matrixRows(columnMajor) {
  if (!columnMajor?.length) return [];
  return Array.from({ length: 4 }, (_, row) =>
    Array.from({ length: 4 }, (_, column) => columnMajor[column * 4 + row])
  );
}

export function emptyPose() {
  return {
    position: { x: 0, y: 0, z: 0 },
    quaternion: { x: 0, y: 0, z: 0, w: 1 },
    rpy: { roll: 0, pitch: 0, yaw: 0 },
    matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  };
}
