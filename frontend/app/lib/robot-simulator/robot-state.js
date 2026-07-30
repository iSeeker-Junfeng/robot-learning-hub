export const SIMULATOR_MODES = {
  MANUAL: "MANUAL",
  LIVE: "LIVE",
  PLAYBACK: "PLAYBACK",
};

export function initialJointValues(model) {
  return Object.fromEntries(
    (model?.joints || [])
      .filter((joint) => joint.type !== "fixed")
      .map((joint) => [
        joint.name,
        joint.type === "floating" ? [0, 0, 0, 0, 0, 0] : joint.type === "planar" ? [0, 0, 0] : 0,
      ]),
  );
}

export function clampJointValue(joint, value) {
  if (Array.isArray(value)) return value.map((item) => Number.isFinite(item) ? item : 0);
  if (!Number.isFinite(value) || joint.type === "continuous") return Number.isFinite(value) ? value : 0;
  const lower = joint.limit?.lower ?? (joint.type === "prismatic" ? -1 : -Math.PI);
  const upper = joint.limit?.upper ?? (joint.type === "prismatic" ? 1 : Math.PI);
  return Math.min(upper, Math.max(lower, value));
}
