"use client";

import { useRef, useState } from "react";
import { uploadRobotModel } from "../../lib/robot-simulator/api-client";

export default function UrdfUploader({ open, onClose, onUploaded }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [urdfFile, setUrdfFile] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!open) return null;

  async function submit(event) {
    event.preventDefault();
    if (!file) return setError("请选择一个 .urdf 或 .zip 文件");
    setBusy(true);
    setError("");
    try {
      const model = await uploadRobotModel(file, { name, description, urdfFile });
      onUploaded(model);
      onClose();
      setFile(null);
      setName("");
      setDescription("");
      setUrdfFile("");
    } catch (reason) {
      setError(reason.code === "multiple_urdf_requires_selection" ? `${reason.message}，请填写 ZIP 内入口路径后重试。` : reason.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sim-modal" role="dialog" aria-modal="true" aria-labelledby="upload-title" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="sim-upload-card" onSubmit={submit}>
        <header><div><span>URDF RESOURCE</span><h2 id="upload-title">导入机器人模型</h2></div><button type="button" onClick={onClose}>×</button></header>
        <button type="button" className="sim-dropzone" onClick={() => inputRef.current?.click()}>
          <strong>{file ? file.name : "选择 URDF 或 ZIP 资源包"}</strong>
          <span>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "ZIP ≤ 50 MB · 解压 ≤ 200 MB · 安全路径校验"}</span>
        </button>
        <input ref={inputRef} hidden type="file" accept=".urdf,.zip,application/zip" onChange={(event) => setFile(event.target.files?.[0] || null)} />
        <div className="sim-upload-fields">
          <label><span>显示名称（可选）</span><input value={name} maxLength={100} onChange={(event) => setName(event.target.value)} placeholder="默认读取 robot name" /></label>
          <label><span>ZIP 内入口 URDF（多文件时填写）</span><input value={urdfFile} onChange={(event) => setUrdfFile(event.target.value)} placeholder="例如 description/robot.urdf" /></label>
          <label className="wide"><span>模型说明</span><textarea value={description} maxLength={500} onChange={(event) => setDescription(event.target.value)} placeholder="用途、版本或注意事项" /></label>
        </div>
        {error && <p className="sim-upload-error">{error}</p>}
        <footer><small>仅解析运动学与可视资源，不执行 Xacro 或脚本。</small><button type="submit" disabled={busy}>{busy ? "安全解析中…" : "上传并加载"}</button></footer>
      </form>
    </div>
  );
}
