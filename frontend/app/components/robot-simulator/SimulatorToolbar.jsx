"use client";

export default function SimulatorToolbar({
  models,
  model,
  mode,
  onSelectModel,
  onUpload,
  onReset,
  onResetCamera,
  onFullscreen,
}) {
  return (
    <header className="sim-toolbar">
      <a className="sim-back" href="/"><span>←</span><b>玄枢</b></a>
      <div className="sim-title"><span>ROBOT LAB / 01</span><h1>机器人仿真实验室</h1></div>
      <div className="sim-tools">
        <label className="sim-model-select"><span>模型</span><select value={model.id} onChange={(event) => onSelectModel(event.target.value)}>{models.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <button type="button" onClick={onUpload}>导入 URDF</button>
        <div className="sim-mode"><span className="active">{mode}</span><span title="第二阶段开放">LIVE</span><span title="第二阶段开放">PLAYBACK</span></div>
        <button type="button" onClick={onReset}>模型归零</button>
        <button type="button" onClick={onResetCamera}>视角复位</button>
        <button type="button" className="sim-icon-button" onClick={onFullscreen} title="全屏">⛶</button>
      </div>
    </header>
  );
}
