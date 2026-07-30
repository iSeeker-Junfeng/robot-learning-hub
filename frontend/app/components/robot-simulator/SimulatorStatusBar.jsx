"use client";

export default function SimulatorStatusBar({ status, message, model, selectedLink }) {
  const label = { loading: "模型加载中", ready: "仿真就绪", warning: "资源警告", error: "加载失败" }[status] || "准备中";
  return (
    <footer className="sim-statusbar">
      <div><i className={status}></i><span>状态</span><b>{label}</b></div>
      <div><span>运行模式</span><b>MANUAL</b></div>
      <div><span>当前模型</span><b>{model.name}</b></div>
      <div><span>选中 Link</span><b>{selectedLink}</b></div>
      <div className="sim-status-message"><span>消息</span><b>{message || `${model.links_count} Links / ${model.joints_count} Joints`}</b></div>
    </footer>
  );
}
