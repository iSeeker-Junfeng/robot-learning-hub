"use client";

import { matrixRows } from "../../lib/robot-simulator/frame-transform";

const fmt = (value) => Number(value || 0).toFixed(4);

export default function FramePosePanel({ linkName, pose }) {
  const rows = matrixRows(pose.matrix);
  return (
    <section className="sim-panel sim-frame-panel">
      <header><span>04</span><div><b>Link 位姿</b><small>WORLD → {linkName?.toUpperCase()}</small></div></header>
      <div className="sim-frame-content">
        <div className="sim-frame-group"><span>POSITION / M</span><div>{["x", "y", "z"].map((key) => <p key={key}><b>{key.toUpperCase()}</b><code>{fmt(pose.position[key])}</code></p>)}</div></div>
        <div className="sim-frame-group"><span>RPY / RAD</span><div>{["roll", "pitch", "yaw"].map((key) => <p key={key}><b>{key.toUpperCase()}</b><code>{fmt(pose.rpy[key])}</code></p>)}</div></div>
        <div className="sim-frame-group"><span>QUATERNION / XYZW</span><div>{["x", "y", "z", "w"].map((key) => <p key={key}><b>{key.toUpperCase()}</b><code>{fmt(pose.quaternion[key])}</code></p>)}</div></div>
        <details className="sim-matrix">
          <summary>4 × 4 变换矩阵</summary>
          <div>{rows.map((row, index) => <code key={index}>{row.map(fmt).join("   ")}</code>)}</div>
        </details>
      </div>
    </section>
  );
}
