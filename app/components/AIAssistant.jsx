"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";
import { getApiBaseUrl, streamAssistant } from "../lib/ai-client";
import { loadLLMSettings } from "../lib/settings-client";

const CHAT_KEY = "xuanshu-ai-conversations-v1";
const modes = [
  ["explain", "讲明白"],
  ["example", "举例子"],
  ["quiz", "考考我"],
  ["debug", "查问题"],
];

function Answer({ content }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={{ a: ({ children, ...props }) => <a {...props} target="_blank" rel="noreferrer">{children}</a> }}>{content}</ReactMarkdown>;
}

function starterQuestions(chapter) {
  if (!chapter) return ["我应该从哪条学习路线开始？", "帮我制定今天的学习计划"];
  return [
    `用直觉解释“${chapter.title}”`,
    `这一章最容易踩什么坑？`,
    `给我一个${chapter.title}的工程例子`,
  ];
}

export default function AIAssistant({ open, onClose, chapter, lesson }) {
  const chapterId = chapter?.id || "general";
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState("explain");
  const [sources, setSources] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [configured, setConfigured] = useState(false);
  const controllerRef = useRef(null);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    let active = true;
    async function checkConfiguration() {
      if (!getApiBaseUrl()) {
        if (active) setConfigured(false);
        return;
      }
      try {
        const result = await loadLLMSettings();
        if (active) setConfigured(Boolean(result.api_key_configured));
      } catch (_) {
        if (active) setConfigured(false);
      }
    }
    checkConfiguration();
    window.addEventListener("xuanshu-settings-updated", checkConfiguration);
    return () => {
      active = false;
      window.removeEventListener("xuanshu-settings-updated", checkConfiguration);
    };
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CHAT_KEY) || "{}");
      setMessages(Array.isArray(saved[chapterId]) ? saved[chapterId] : []);
    } catch (_) {
      setMessages([]);
    }
    setSources([]);
    setError("");
  }, [chapterId]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  function persist(next) {
    setMessages(next);
    try {
      const saved = JSON.parse(localStorage.getItem(CHAT_KEY) || "{}");
      saved[chapterId] = next.slice(-20);
      localStorage.setItem(CHAT_KEY, JSON.stringify(saved));
    } catch (_) {}
  }

  function clearConversation() {
    controllerRef.current?.abort();
    persist([]);
    setSources([]);
    setError("");
  }

  function stop() {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setBusy(false);
  }

  async function ask(rawQuestion) {
    const value = rawQuestion.trim();
    if (!value || busy) return;
    setQuestion("");
    setError("");
    setSources([]);
    const history = messages.filter((item) => item.content).slice(-10).map(({ role, content }) => ({ role, content }));
    const next = [...messages, { id: crypto.randomUUID(), role: "user", content: value }, { id: crypto.randomUUID(), role: "assistant", content: "" }];
    persist(next);
    setBusy(true);
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      await streamAssistant({
        question: value,
        chapter_id: chapter?.id || null,
        mode,
        history,
        context: chapter ? { title: chapter.title, track: chapter.track.name, goal: lesson?.goal || "", selected_text: "" } : null,
      }, {
        signal: controller.signal,
        onEvent: ({ event, data }) => {
          if (event === "sources") setSources(data.items || []);
          if (event === "delta") {
            setMessages((current) => {
              const updated = current.map((item, index) => index === current.length - 1 ? { ...item, content: item.content + (data.content || "") } : item);
              try {
                const saved = JSON.parse(localStorage.getItem(CHAT_KEY) || "{}");
                saved[chapterId] = updated.slice(-20);
                localStorage.setItem(CHAT_KEY, JSON.stringify(saved));
              } catch (_) {}
              return updated;
            });
          }
          if (event === "error") setError(data.message || "AI 服务暂时不可用");
        },
      });
    } catch (requestError) {
      if (requestError.name !== "AbortError") setError(requestError.message || "无法连接 AI 服务");
    } finally {
      controllerRef.current = null;
      setBusy(false);
    }
  }

  function submit(event) {
    event.preventDefault();
    ask(question);
  }

  return (
    <aside className={`ai-assistant ${open ? "open" : ""}`} aria-hidden={!open} aria-label="玄枢 AI 学习助教">
      <header className="ai-head">
        <div><span>玄枢 / AI MENTOR</span><strong>{chapter ? chapter.title : "学习问答"}</strong></div>
        <div><button type="button" onClick={clearConversation} aria-label="清空对话">清空</button><button type="button" onClick={onClose} aria-label="关闭 AI 助教">×</button></div>
      </header>
      <div className="ai-context">
        <i></i><span>{chapter ? `${chapter.track.name} · ${chapter.no}` : "全局学习路线"}</span><em>{configured ? "DASHSCOPE READY" : "WAITING FOR API"}</em>
      </div>
      <div className="ai-messages" aria-live="polite">
        {!messages.length && (
          <div className="ai-welcome">
            <span>问玄枢</span>
            <h2>卡住的地方，<br />现在就问清楚。</h2>
            <p>{chapter ? `我会结合《${chapter.title}》的学习目标、知识点和精选资料回答。` : "我会结合玄枢的完整学习路线帮你定位问题。"}</p>
            <div className="ai-starters">{starterQuestions(chapter).map((item) => <button type="button" key={item} onClick={() => ask(item)}>{item}<b>↗</b></button>)}</div>
          </div>
        )}
        {messages.map((message) => (
          <article className={`ai-message ${message.role}`} key={message.id}>
            <span>{message.role === "user" ? "你" : "玄枢"}</span>
            <div>{message.content ? <Answer content={message.content} /> : busy ? <div className="ai-thinking"><i></i><i></i><i></i></div> : <p>回答未生成，请重新提问。</p>}</div>
          </article>
        ))}
        {sources.length > 0 && <div className="ai-sources"><span className="ai-source-label">参考本地知识</span>{sources.map((source) => source.url ? <a href={source.url} target="_blank" rel="noreferrer" key={`${source.kind}:${source.id}`}>{source.title} ↗</a> : <span className="ai-source-item" key={`${source.kind}:${source.id}`}>{source.track} / {source.title}</span>)}</div>}
        {error && <div className="ai-error"><strong>暂时无法回答</strong><p>{error}</p></div>}
        <div ref={endRef}></div>
      </div>
      <div className="ai-compose">
        <div className="ai-modes">{modes.map(([id, label]) => <button type="button" className={mode === id ? "active" : ""} onClick={() => setMode(id)} key={id}>{label}</button>)}</div>
        <form onSubmit={submit}>
          <textarea ref={inputRef} value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); ask(question); } }} placeholder="描述你没有理解的地方…" rows="3" maxLength="4000" />
          {busy ? <button type="button" className="ai-send" onClick={stop}>停止</button> : <button type="submit" className="ai-send" disabled={!question.trim()}>发送 ↗</button>}
        </form>
        <small>AI 可能出错，请结合引用资料与工程实验验证。</small>
      </div>
    </aside>
  );
}
