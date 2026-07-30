import { getApiBaseUrl } from "./ai-client";

async function request(path, options = {}, explicitBaseUrl = "") {
  const baseUrl = (explicitBaseUrl || getApiBaseUrl()).replace(/\/$/, "");
  if (!baseUrl) throw new Error("请先填写 FastAPI 后端地址");
  const response = await fetch(`${baseUrl}/api/v1${path}`, options);
  if (response.status === 204) return null;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail || `请求失败（${response.status}）`);
  return body;
}

export function loadLLMSettings(baseUrl = "") {
  return request("/settings/llm", {}, baseUrl);
}

export function saveLLMSettings(payload, adminToken, baseUrl = "") {
  return request("/settings/llm", {
    method: "PUT",
    headers: { "Content-Type": "application/json", "X-Admin-Token": adminToken },
    body: JSON.stringify(payload),
  }, baseUrl);
}

export function resetLLMSettings(adminToken, baseUrl = "") {
  return request("/settings/llm", {
    method: "DELETE",
    headers: { "X-Admin-Token": adminToken },
  }, baseUrl);
}
