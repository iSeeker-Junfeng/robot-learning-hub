function apiBaseUrl() {
  const configured = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_XUANSHU_API_URL : "";
  if (configured) return configured.replace(/\/$/, "");
  if (typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname)) return "http://localhost:8888";
  return "";
}

function parseEvent(block) {
  let event = "message";
  const data = [];
  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
  }
  if (!data.length) return null;
  const raw = data.join("\n");
  try {
    return { event, data: JSON.parse(raw) };
  } catch (_) {
    return { event, data: raw };
  }
}

export function isAssistantConfigured() {
  return Boolean(apiBaseUrl());
}

export async function streamAssistant(payload, { signal, onEvent }) {
  const baseUrl = apiBaseUrl();
  if (!baseUrl) throw new Error("AI 后端地址尚未配置，请设置 NEXT_PUBLIC_XUANSHU_API_URL。");
  const response = await fetch(`${baseUrl}/api/v1/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  if (!response.ok) throw new Error(`AI 服务请求失败（${response.status}）`);
  if (!response.body) throw new Error("浏览器不支持流式响应");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done }).replace(/\r\n/g, "\n");
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() || "";
    for (const block of blocks) {
      const parsed = parseEvent(block);
      if (parsed) onEvent(parsed);
    }
    if (done) break;
  }
  if (buffer.trim()) {
    const parsed = parseEvent(buffer);
    if (parsed) onEvent(parsed);
  }
}
