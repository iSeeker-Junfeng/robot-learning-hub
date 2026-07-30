"use client";

import { useEffect, useState } from "react";
import { getApiBaseUrl, setApiBaseUrl } from "../lib/ai-client";
import { loadLLMSettings, resetLLMSettings, saveLLMSettings } from "../lib/settings-client";

const defaultForm = {
  provider: "dashscope",
  base_url: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  model: "qwen-plus",
  api_key: "",
};

export default function AISettingsPanel({ open, onClose }) {
  const [backendUrl, setBackendUrl] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [form, setForm] = useState(defaultForm);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh(url) {
    const normalized = setApiBaseUrl(url);
    if (!normalized) {
      setStatus(null);
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const result = await loadLLMSettings(normalized);
      setStatus(result);
      setForm((current) => ({ ...current, provider: result.provider, base_url: result.base_url, model: result.model, api_key: "" }));
      setMessage("后端连接正常");
    } catch (error) {
      setStatus(null);
      setMessage(error.message || "无法连接后端");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    const url = getApiBaseUrl();
    setBackendUrl(url);
    setAdminToken(sessionStorage.getItem("xuanshu-admin-token-v1") || "");
    refresh(url);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(event) {
    event.preventDefault();
    const url = setApiBaseUrl(backendUrl);
    sessionStorage.setItem("xuanshu-admin-token-v1", adminToken);
    setBusy(true);
    setMessage("");
    try {
      const payload = { provider: form.provider, base_url: form.base_url, model: form.model };
      if (form.api_key.trim()) payload.api_key = form.api_key.trim();
      const result = await saveLLMSettings(payload, adminToken, url);
      setStatus(result);
      setForm((current) => ({ ...current, api_key: "" }));
      setMessage("配置已加密保存并立即生效");
      window.dispatchEvent(new Event("xuanshu-settings-updated"));
    } catch (error) {
      setMessage(error.message || "保存失败");
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    if (!window.confirm("删除数据库中的模型配置并恢复环境变量默认值？")) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await resetLLMSettings(adminToken, setApiBaseUrl(backendUrl));
      setStatus(result);
      setForm({ ...defaultForm, provider: result.provider, base_url: result.base_url, model: result.model });
      setMessage("数据库配置已删除，当前使用环境变量默认值");
      window.dispatchEvent(new Event("xuanshu-settings-updated"));
    } catch (error) {
      setMessage(error.message || "删除失败");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="settings-modal" role="dialog" aria-modal="true" aria-label="玄枢 AI 配置">
      <section className="settings-panel">
        <header>
          <div><span>CONFIGURATION / 配置中心</span><h2>玄枢 AI 设置</h2></div>
          <button type="button" onClick={onClose} aria-label="关闭配置">×</button>
        </header>

        <div className="settings-status">
          <i className={status?.api_key_configured ? "ready" : ""}></i>
          <div><strong>{status?.api_key_configured ? "AI 助教已配置" : "等待模型密钥"}</strong><small>{status ? `${status.provider} · ${status.model} · ${status.api_key_hint || "无密钥"}` : "先连接 FastAPI 后端"}</small></div>
          {status && <em>{status.encrypted_storage_ready ? "SQLITE ENCRYPTED" : "ENCRYPTION LOCKED"}</em>}
        </div>

        <form onSubmit={save}>
          <label className="settings-wide"><span>FastAPI 后端地址</span><input type="url" value={backendUrl} onChange={(event) => setBackendUrl(event.target.value)} placeholder="http://localhost:8888" required /><small>仅保存在当前浏览器，用于连接你部署的后端。</small></label>
          <div className="settings-grid">
            <label><span>供应商</span><input value={form.provider} onChange={(event) => updateField("provider", event.target.value)} required /></label>
            <label><span>模型</span><input value={form.model} onChange={(event) => updateField("model", event.target.value)} placeholder="qwen-plus" required /></label>
          </div>
          <label className="settings-wide"><span>OpenAI 兼容地址</span><input type="url" value={form.base_url} onChange={(event) => updateField("base_url", event.target.value)} required /></label>
          <label className="settings-wide"><span>DashScope API Key</span><input type="password" value={form.api_key} onChange={(event) => updateField("api_key", event.target.value)} placeholder={status?.api_key_configured ? `已保存 ${status.api_key_hint}，留空则不修改` : "sk-..."} autoComplete="new-password" /><small>只发送到你的后端，并使用 Fernet 加密后写入 SQLite；页面不会读取原始密钥。</small></label>
          <label className="settings-wide"><span>管理令牌</span><input type="password" value={adminToken} onChange={(event) => setAdminToken(event.target.value)} placeholder="ADMIN_TOKEN" required autoComplete="current-password" /><small>仅保存在当前标签页的 sessionStorage，关闭标签页后清除。</small></label>
          {message && <p className={`settings-message ${status ? "success" : ""}`}>{message}</p>}
          <div className="settings-actions">
            <button type="button" onClick={() => refresh(backendUrl)} disabled={busy}>测试连接</button>
            <button type="button" className="danger" onClick={reset} disabled={busy || !status}>删除数据库配置</button>
            <button type="submit" className="save" disabled={busy}>{busy ? "处理中…" : "保存并生效 ↗"}</button>
          </div>
        </form>
        <footer>生产环境请使用 HTTPS 后端，并妥善保管 ADMIN_TOKEN 与 SETTINGS_ENCRYPTION_KEY。</footer>
      </section>
    </div>
  );
}
