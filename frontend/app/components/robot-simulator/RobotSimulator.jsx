"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BasePosePanel from "./BasePosePanel";
import ConnectionPanel from "./ConnectionPanel";
import FramePosePanel from "./FramePosePanel";
import JointControlPanel from "./JointControlPanel";
import RobotTree from "./RobotTree";
import RobotViewport from "./RobotViewport";
import SimulatorStatusBar from "./SimulatorStatusBar";
import SimulatorToolbar from "./SimulatorToolbar";
import UrdfUploader from "./UrdfUploader";
import { fetchRobotUrdf, listRobotModels, robotAssetBaseUrl } from "../../lib/robot-simulator/api-client";
import { emptyPose } from "../../lib/robot-simulator/frame-transform";
import { clampJointValue, initialJointValues, SIMULATOR_MODES } from "../../lib/robot-simulator/robot-state";
import { sampleModel, sampleUrdf } from "../../lib/robot-simulator/sample-model";

const initialBasePose = { x: 0, y: 0, z: 0, roll: 0, pitch: 0, yaw: 0 };

export default function RobotSimulator() {
  const shellRef = useRef(null);
  const viewportRef = useRef(null);
  const [models, setModels] = useState([sampleModel]);
  const [modelId, setModelId] = useState(sampleModel.id);
  const [urdfText, setUrdfText] = useState(sampleUrdf);
  const [assetBaseUrl, setAssetBaseUrl] = useState("");
  const [jointValues, setJointValues] = useState(() => initialJointValues(sampleModel));
  const [basePose, setBasePose] = useState(initialBasePose);
  const [selectedLink, setSelectedLink] = useState(sampleModel.root_link);
  const [framePose, setFramePose] = useState(emptyPose);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [uploaderOpen, setUploaderOpen] = useState(false);
  const model = useMemo(() => models.find((item) => item.id === modelId) || sampleModel, [models, modelId]);

  useEffect(() => {
    let active = true;
    listRobotModels()
      .then((payload) => {
        if (active) setModels([sampleModel, ...(payload.items || [])]);
      })
      .catch(() => {
        if (active) setMessage("后端未连接：仍可使用内置示例，上传功能需启动 FastAPI");
      });
    return () => { active = false; };
  }, []);

  const handleViewportStatus = useCallback((nextStatus, detail = "") => {
    setStatus(nextStatus);
    if (detail) setMessage(detail);
  }, []);
  const handlePose = useCallback((pose) => setFramePose(pose), []);

  async function selectModel(nextId, availableModels = models) {
    const next = availableModels.find((item) => item.id === nextId);
    if (!next) return;
    setModelId(next.id);
    setJointValues(initialJointValues(next));
    setBasePose(initialBasePose);
    setSelectedLink(next.root_link);
    setFramePose(emptyPose());
    setMessage(next.warnings?.join("；") || "");
    setStatus("loading");
    try {
      if (next.builtin) {
        setAssetBaseUrl("");
        setUrdfText(sampleUrdf);
      } else {
        const text = await fetchRobotUrdf(next);
        setAssetBaseUrl(robotAssetBaseUrl(next));
        setUrdfText(text);
      }
    } catch (error) {
      setStatus("error");
      setMessage(error.message);
    }
  }

  function resetRobot() {
    setJointValues(initialJointValues(model));
    setBasePose(initialBasePose);
    setMessage("模型状态已归零");
  }

  function updateJoint(joint, value) {
    setJointValues((current) => ({ ...current, [joint.name]: clampJointValue(joint, value) }));
  }

  function handleUploaded(uploaded) {
    const nextModels = [sampleModel, uploaded, ...models.filter((item) => item.id !== sampleModel.id && item.id !== uploaded.id)];
    setModels(nextModels);
    selectModel(uploaded.id, nextModels);
  }

  async function toggleFullscreen() {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await shellRef.current?.requestFullscreen?.();
  }

  return (
    <main className="sim-shell" ref={shellRef}>
      <SimulatorToolbar
        models={models}
        model={model}
        mode={SIMULATOR_MODES.MANUAL}
        onSelectModel={selectModel}
        onUpload={() => setUploaderOpen(true)}
        onReset={resetRobot}
        onResetCamera={() => viewportRef.current?.resetCamera()}
        onFullscreen={toggleFullscreen}
      />
      <ConnectionPanel />
      <div className="sim-workspace">
        <RobotTree model={model} selectedLink={selectedLink} onSelectLink={setSelectedLink} />
        <RobotViewport
          ref={viewportRef}
          urdfText={urdfText}
          assetBaseUrl={assetBaseUrl}
          jointValues={jointValues}
          basePose={basePose}
          selectedLink={selectedLink}
          onPose={handlePose}
          onStatus={handleViewportStatus}
        />
        <aside className="sim-right-panels">
          <JointControlPanel joints={model.joints} values={jointValues} disabled={false} onChange={updateJoint} />
          <BasePosePanel value={basePose} disabled={false} onChange={setBasePose} />
          <FramePosePanel linkName={selectedLink} pose={framePose} />
        </aside>
      </div>
      <SimulatorStatusBar status={status} message={message} model={model} selectedLink={selectedLink} />
      <UrdfUploader open={uploaderOpen} onClose={() => setUploaderOpen(false)} onUploaded={handleUploaded} />
    </main>
  );
}
