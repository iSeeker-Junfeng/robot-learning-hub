import { getApiBaseUrl } from "../ai-client";


function endpoint(path) {
  return `${getApiBaseUrl()}${path}`;
}

async function parseResponse(response) {
  if (response.ok) return response.status === 204 ? null : response.json();
  let payload = null;
  try {
    payload = await response.json();
  } catch (_) {}
  const detail = payload?.detail;
  const error = new Error(detail?.message || detail || `请求失败（${response.status}）`);
  error.code = detail?.code || "request_failed";
  error.status = response.status;
  throw error;
}

export async function listRobotModels() {
  return parseResponse(await fetch(endpoint("/api/v1/robot-models"), { cache: "no-store" }));
}

export async function uploadRobotModel(file, { name = "", description = "", urdfFile = "" } = {}) {
  const form = new FormData();
  form.append("file", file);
  if (name.trim()) form.append("name", name.trim());
  if (description.trim()) form.append("description", description.trim());
  if (urdfFile.trim()) form.append("urdf_file", urdfFile.trim());
  return parseResponse(await fetch(endpoint("/api/v1/robot-models"), { method: "POST", body: form }));
}

export async function fetchRobotUrdf(model) {
  const response = await fetch(endpoint(model.urdf_url), { cache: "no-store" });
  if (!response.ok) await parseResponse(response);
  return response.text();
}

export function robotAssetBaseUrl(model) {
  return endpoint(model.asset_base_url);
}
