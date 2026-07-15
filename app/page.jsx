"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { chapterById, chapterGuides, chapterLessons, chapterResources, graphEdges, graphNodes, resourceCatalog, tracks } from "./data";
import AIAssistant from "./components/AIAssistant";

const STORAGE_KEY = "robot-learning-hub-progress-v1";
const STUDY_KEY = "robot-learning-hub-study-checks-v1";
const RESOURCE_KEY = "robot-learning-hub-resource-reads-v1";
const stateLabels = ["未开始", "学习中", "已掌握"];

function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}

function ProgressRing({ value }) {
  return (
    <div className="progress-ring" style={{ "--progress": `${value * 3.6}deg` }}>
      <div>
        <strong>{value}%</strong>
        <span>总进度</span>
      </div>
    </div>
  );
}

function StatusButton({ value = 0, onChange, compact = false }) {
  return (
    <button
      type="button"
      className={`status-button state-${value} ${compact ? "compact" : ""}`}
      onClick={onChange}
      aria-label={`当前状态：${stateLabels[value]}，点击切换`}
      title="点击切换学习状态"
    >
      <span className="status-dot">{value === 2 ? "✓" : value === 1 ? "◐" : ""}</span>
      {!compact && <span>{stateLabels[value]}</span>}
    </button>
  );
}

export default function Home() {
  const [activeTrack, setActiveTrack] = useState("ros2");
  const [progress, setProgress] = useState({});
  const [studyChecks, setStudyChecks] = useState({});
  const [resourceReads, setResourceReads] = useState({});
  const [query, setQuery] = useState("");
  const [graphFilter, setGraphFilter] = useState("all");
  const [focusedNode, setFocusedNode] = useState("kin-transform");
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [assistantChapter, setAssistantChapter] = useState(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const importRef = useRef(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setProgress(JSON.parse(stored));
      const storedChecks = localStorage.getItem(STUDY_KEY);
      if (storedChecks) setStudyChecks(JSON.parse(storedChecks));
      const storedResources = localStorage.getItem(RESOURCE_KEY);
      if (storedResources) setResourceReads(JSON.parse(storedResources));
    } catch (_) {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (_) {}
  }, [progress]);

  useEffect(() => {
    try {
      localStorage.setItem(STUDY_KEY, JSON.stringify(studyChecks));
    } catch (_) {}
  }, [studyChecks]);

  useEffect(() => {
    try {
      localStorage.setItem(RESOURCE_KEY, JSON.stringify(resourceReads));
    } catch (_) {}
  }, [resourceReads]);

  useEffect(() => {
    if (!selectedChapter) return undefined;
    const closeOnEscape = (event) => { if (event.key === "Escape") setSelectedChapter(null); };
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [selectedChapter]);

  const allChapters = useMemo(() => tracks.flatMap((track) => track.chapters), []);
  const completed = allChapters.filter((chapter) => progress[chapter.id] === 2).length;
  const learning = allChapters.filter((chapter) => progress[chapter.id] === 1).length;
  const totalProgress = Math.round(
    (allChapters.reduce((sum, chapter) => sum + (progress[chapter.id] || 0), 0) / (allChapters.length * 2)) * 100
  );
  const currentTrack = tracks.find((track) => track.id === activeTrack) || tracks[0];
  const visibleChapters = currentTrack.chapters.filter((chapter) =>
    `${chapter.title}${chapter.desc}${chapter.no}`.toLowerCase().includes(query.trim().toLowerCase())
  );

  function cycleProgress(id) {
    setProgress((current) => ({ ...current, [id]: ((current[id] || 0) + 1) % 3 }));
  }

  function toggleStudyStep(chapterId, index) {
    const key = `${chapterId}:${index}`;
    setStudyChecks((current) => ({ ...current, [key]: !current[key] }));
  }

  function toggleResourceRead(resourceId) {
    setResourceReads((current) => ({ ...current, [resourceId]: !current[resourceId] }));
  }

  function jumpToTrack(id) {
    setActiveTrack(id);
    document.getElementById("roadmap")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openAssistant(chapterId = null) {
    setAssistantChapter(chapterId || selectedChapter || focusedNode || null);
    setAssistantOpen(true);
  }

  function exportProgress() {
    const payload = { version: 3, exportedAt: new Date().toISOString(), progress, studyChecks, resourceReads };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "robot-learning-progress.json";
    link.click();
    URL.revokeObjectURL(url);
    setNotice("进度备份已导出");
    setTimeout(() => setNotice(""), 2200);
  }

  function importProgress(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(String(reader.result));
        const next = payload.progress || payload;
        if (!next || typeof next !== "object") throw new Error("invalid");
        setProgress(next);
        if (payload.studyChecks && typeof payload.studyChecks === "object") setStudyChecks(payload.studyChecks);
        if (payload.resourceReads && typeof payload.resourceReads === "object") setResourceReads(payload.resourceReads);
        setNotice("进度已恢复");
      } catch (_) {
        setNotice("无法识别这个进度文件");
      }
      setTimeout(() => setNotice(""), 2400);
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  const focused = chapterById[focusedNode];
  const selected = selectedChapter ? chapterById[selectedChapter] : null;
  const selectedGuide = selectedChapter ? chapterGuides[selectedChapter] : null;
  const selectedLesson = selectedChapter ? chapterLessons[selectedChapter] : null;
  const selectedResources = selectedChapter
    ? (chapterResources[selectedChapter] || []).map((id) => ({ id, ...resourceCatalog[id] })).filter((item) => item.title)
    : [];
  const selectedResourceCount = selectedResources.filter((item) => resourceReads[item.id]).length;
  const selectedStepCount = selectedChapter && selectedGuide
    ? selectedGuide.materials.filter((_, index) => studyChecks[`${selectedChapter}:${index}`]).length
    : 0;
  const filteredNodes = graphNodes.filter((node) => graphFilter === "all" || node.track === graphFilter);
  const visibleIds = new Set(filteredNodes.map((node) => node.id));
  const nodeMap = Object.fromEntries(graphNodes.map((node) => [node.id, node]));

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="返回顶部">
          <span className="brand-mark"><i></i><i></i><i></i></span>
          <span>XUANSHU<span>/</span>玄枢</span>
        </a>
        <nav aria-label="主导航">
          <a href="#roadmap">学习路线</a>
          <a href="#knowledge">知识图谱</a>
          <button type="button" className="nav-ai" onClick={() => openAssistant()}>问玄枢</button>
        </nav>
        <div className="top-actions">
          <button type="button" onClick={exportProgress}>导出进度</button>
          <button type="button" onClick={() => importRef.current?.click()}>导入</button>
          <input ref={importRef} type="file" accept="application/json" hidden onChange={importProgress} />
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="kicker"><span></span> PERSONAL LEARNING SYSTEM · 2026</div>
          <h1>从硬件信号，<br />一路走到<span>机器智能。</span></h1>
          <p>机器人、ROS 2、运动学、嵌入式与大模型不是五门孤立的课程，而是一条完整的工程链路。这是你的长期学习坐标系。</p>
          <div className="hero-cta">
            <button type="button" className="primary" onClick={() => jumpToTrack("ros2")}>继续学习 ROS 2 <ArrowIcon /></button>
            <a href="#knowledge">查看知识关系 <span>↓</span></a>
          </div>
          <div className="hero-stats">
            <div><strong>05</strong><span>学习路线</span></div>
            <div><strong>25</strong><span>核心章节</span></div>
            <div><strong>{completed.toString().padStart(2, "0")}</strong><span>已经掌握</span></div>
          </div>
        </div>
        <div className="hero-visual" aria-label="机器人学习系统示意图">
          <div className="orbit orbit-a"></div>
          <div className="orbit orbit-b"></div>
          <div className="orbit orbit-c"></div>
          <div className="core">
            <span>LEARNING</span>
            <strong>CORE</strong>
            <i></i>
          </div>
          {tracks.map((track, index) => (
            <button
              type="button"
              key={track.id}
              className={`satellite sat-${index + 1}`}
              style={{ "--track": track.color }}
              onClick={() => jumpToTrack(track.id)}
            >
              <i></i><span>{track.short}</span>
            </button>
          ))}
          <div className="visual-label label-a">PERCEPTION</div>
          <div className="visual-label label-b">CONTROL</div>
          <div className="visual-label label-c">COGNITION</div>
        </div>
      </section>

      <section className="roadmap-section" id="roadmap">
        <div className="section-heading">
          <div>
            <span className="section-index">01 / LEARNING PATHS</span>
            <h2>学习路线</h2>
          </div>
          <p>先掌握一条主线，再沿着知识关系横向连接。点击状态即可在“未开始 / 学习中 / 已掌握”之间切换。</p>
        </div>

        <div className="roadmap-shell">
          <aside className="track-nav">
            {tracks.map((track, index) => {
              const done = track.chapters.filter((chapter) => progress[chapter.id] === 2).length;
              return (
                <button
                  type="button"
                  key={track.id}
                  className={activeTrack === track.id ? "active" : ""}
                  onClick={() => setActiveTrack(track.id)}
                  style={{ "--track": track.color }}
                >
                  <span className="track-no">0{index + 1}</span>
                  <span><strong>{track.name}</strong><small>{track.eyebrow}</small></span>
                  <em>{done}/{track.chapters.length}</em>
                </button>
              );
            })}
          </aside>

          <div className="chapter-panel" style={{ "--track": currentTrack.color }}>
            <div className="panel-top">
              <div>
                <span>{currentTrack.eyebrow} PATH</span>
                <h3>{currentTrack.name}</h3>
                <p>{currentTrack.intro}</p>
              </div>
              <label className="search-box">
                <span>⌕</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索当前路线" aria-label="搜索当前路线" />
              </label>
            </div>
            <div className="chapter-list">
              {visibleChapters.map((chapter, index) => (
                <article className="chapter-card" key={chapter.id}>
                  <div className="chapter-sequence"><span>{chapter.no}</span><i></i></div>
                  <div className="chapter-main">
                    <div className="chapter-title-row">
                      <h4>{chapter.title}</h4>
                      <span className="chapter-level">{chapter.level}</span>
                    </div>
                    <p>{chapter.desc}</p>
                    <div className="chapter-meta"><span>预计 {chapter.time}</span><span>章节 {index + 1}/{currentTrack.chapters.length}</span></div>
                  </div>
                  <div className="chapter-actions">
                    <button type="button" className="chapter-open" onClick={() => setSelectedChapter(chapter.id)}>学习任务 <ArrowIcon /></button>
                    <StatusButton value={progress[chapter.id] || 0} onChange={() => cycleProgress(chapter.id)} />
                  </div>
                </article>
              ))}
              {!visibleChapters.length && <div className="empty-state">当前路线中没有匹配章节。</div>}
            </div>
          </div>
        </div>
      </section>

      <section className="knowledge-section" id="knowledge">
        <div className="section-heading inverse">
          <div>
            <span className="section-index">02 / KNOWLEDGE GRAPH</span>
            <h2>知识不是列表，<br />而是一张网络。</h2>
          </div>
          <div className="progress-summary">
            <ProgressRing value={totalProgress} />
            <div><strong>{learning}</strong><span>章节学习中</span><small>进度自动保存在此浏览器</small></div>
          </div>
        </div>

        <div className="graph-toolbar">
          <button type="button" className={graphFilter === "all" ? "active" : ""} onClick={() => setGraphFilter("all")}>全部关系</button>
          {tracks.map((track) => (
            <button
              type="button"
              key={track.id}
              className={graphFilter === track.id ? "active" : ""}
              style={{ "--track": track.color }}
              onClick={() => setGraphFilter(track.id)}
            >
              <i></i>{track.name}
            </button>
          ))}
        </div>

        <div className="graph-shell">
          <div className="graph-canvas">
            <svg viewBox="0 0 1025 530" role="img" aria-label="机器人学习知识关系图">
              <defs>
                <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                  <path d="M0,0 L8,4 L0,8 Z" fill="#4d5564" />
                </marker>
              </defs>
              <g className="edges">
                {graphEdges.map(([from, to]) => {
                  const a = nodeMap[from];
                  const b = nodeMap[to];
                  const visible = graphFilter === "all" || visibleIds.has(from) || visibleIds.has(to);
                  return <path key={`${from}-${to}`} className={visible ? "visible" : "muted"} d={`M${a.x + 48},${a.y} C${a.x + 95},${a.y} ${b.x - 95},${b.y} ${b.x - 48},${b.y}`} markerEnd="url(#arrow)" />;
                })}
              </g>
              {graphNodes.map((node) => {
                const track = tracks.find((item) => item.id === node.track);
                const dimmed = graphFilter !== "all" && graphFilter !== node.track;
                const value = progress[node.id] || 0;
                return (
                  <g
                    key={node.id}
                    className={`graph-node ${dimmed ? "dimmed" : ""} ${focusedNode === node.id ? "focused" : ""}`}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={() => setFocusedNode(node.id)}
                    role="button"
                    tabIndex="0"
                    onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setFocusedNode(node.id); }}
                  >
                    <circle r="49" className="node-halo" style={{ stroke: track.color }} />
                    <circle r="40" className="node-body" />
                    <circle cx="28" cy="-28" r="8" className={`node-progress p-${value}`} />
                    <text textAnchor="middle" y="-4">{node.label.split(" · ")[0]}</text>
                    <text textAnchor="middle" y="13" className="node-sub">{node.label.split(" · ")[1] || track.short}</text>
                  </g>
                );
              })}
            </svg>
          </div>
          <aside className="node-detail" style={{ "--track": focused?.track.color || "#54d8ff" }}>
            <span className="detail-kicker">SELECTED NODE</span>
            <div className="detail-code">{focused?.no || "—"}</div>
            <h3>{focused?.title || "选择一个知识节点"}</h3>
            <p>{focused?.desc || "点击图中的节点查看它在学习路线中的位置。"}</p>
            {focused && (
              <>
                <div className="detail-meta"><span>{focused.track.name}</span><span>预计 {focused.time}</span></div>
                <StatusButton value={progress[focused.id] || 0} onChange={() => cycleProgress(focused.id)} />
                <button type="button" className="detail-route" onClick={() => jumpToTrack(focused.track.id)}>打开所属路线 <ArrowIcon /></button>
              </>
            )}
          </aside>
        </div>
      </section>

      {selected && selectedGuide && selectedLesson && (
        <div className="chapter-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedChapter(null); }}>
          <section className="chapter-sheet" role="dialog" aria-modal="true" aria-labelledby="chapter-sheet-title" style={{ "--track": selected.track.color }}>
            <div className="sheet-head">
              <div><span>{selected.track.eyebrow} / {selected.no}</span><h2 id="chapter-sheet-title">{selected.title}</h2></div>
              <div className="sheet-head-actions"><button type="button" className="ask-ai" onClick={() => openAssistant(selected.id)}><i></i>问玄枢</button><button type="button" className="sheet-close" onClick={() => setSelectedChapter(null)} aria-label="关闭章节详情">×</button></div>
            </div>
            <p className="sheet-intro">{selected.desc}</p>
            <div className="learning-goal">
              <span>学完你应该能够</span>
              <p>{selectedLesson.goal}</p>
            </div>
            <div className="lesson-progress">
              <div><span>本章学习进度</span><strong>{selectedStepCount}/{selectedGuide.materials.length}</strong></div>
              <div className="lesson-progress-bar"><i style={{ width: `${(selectedStepCount / selectedGuide.materials.length) * 100}%` }}></i></div>
            </div>
            <div className="sheet-grid">
              <article className="lesson-card">
                <span className="sheet-index">01 / 分步学习</span>
                <div className="lesson-units">
                  {selectedGuide.materials.map((item, index) => {
                    const checked = Boolean(studyChecks[`${selected.id}:${index}`]);
                    return (
                      <button type="button" className={checked ? "complete" : ""} key={item} onClick={() => toggleStudyStep(selected.id, index)}>
                        <span className="lesson-check">{checked ? "✓" : String(index + 1).padStart(2, "0")}</span>
                        <span><strong>{item}</strong><small>{selectedLesson.details[index]}</small></span>
                      </button>
                    );
                  })}
                </div>
              </article>
              <article className="pitfall-card">
                <span className="sheet-index">02 / 常见误区</span>
                <ul>{selectedLesson.pitfalls.map((item) => <li key={item}>{item}</li>)}</ul>
              </article>
              <article className="project-card">
                <span className="sheet-index">03 / 工程练习</span>
                <p>{selectedGuide.project}</p>
              </article>
              <article>
                <span className="sheet-index">04 / 验收标准</span>
                <ul className="acceptance-list">{selectedGuide.acceptance.map((item) => <li key={item}><i>✓</i><span>{item}</span></li>)}</ul>
              </article>
              <article className="quiz-card">
                <span className="sheet-index">05 / 学完自测</span>
                <ol>{selectedLesson.quiz.map((item, index) => <li key={item}><span>Q{index + 1}</span><p>{item}</p></li>)}</ol>
              </article>
              <article className="resources-card">
                <div className="resource-summary">
                  <span className="sheet-index">06 / 精选资料</span>
                  <strong>{selectedResourceCount}/{selectedResources.length} 已读</strong>
                </div>
                <p className="resource-lead">按当前章节筛选的官方文档、规范、论文与开源实现。建议先完成分步学习，再带着问题阅读。</p>
                <div className="resource-list">
                  {selectedResources.map((resource) => {
                    const isRead = Boolean(resourceReads[resource.id]);
                    return (
                      <section className={`resource-item ${isRead ? "read" : ""}`} key={resource.id}>
                        <div className="resource-tags"><span className="resource-type">{resource.category}</span><span>{resource.level}</span><span>{resource.duration}</span></div>
                        <h3>{resource.title}</h3>
                        <p>{resource.note}</p>
                        <div className="resource-actions">
                          <button type="button" className="resource-read" onClick={() => toggleResourceRead(resource.id)} aria-pressed={isRead}>{isRead ? "✓ 已读" : "标记已读"}</button>
                          <a className="resource-open" href={resource.url} target="_blank" rel="noreferrer">一键打开 <ArrowIcon /></a>
                        </div>
                      </section>
                    );
                  })}
                </div>
              </article>
            </div>
            <div className="sheet-footer">
              <div><span>建议投入</span><strong>{selected.time}</strong></div>
              <div><span>当前阶段</span><strong>{selected.level}</strong></div>
              <StatusButton value={progress[selected.id] || 0} onChange={() => cycleProgress(selected.id)} />
            </div>
          </section>
        </div>
      )}

      <footer>
        <div className="brand"><span className="brand-mark"><i></i><i></i><i></i></span><span>XUANSHU<span>/</span>玄枢</span></div>
        <p>持续学习的关键，不是收藏更多知识，而是让知识之间真正连接。</p>
        <a href="#top">BACK TO TOP ↑</a>
      </footer>
      <button type="button" className="ai-fab" onClick={() => openAssistant()} aria-label="打开玄枢 AI 助教"><span>玄</span><i></i><em>问玄枢</em></button>
      <AIAssistant
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        chapter={assistantChapter ? chapterById[assistantChapter] : null}
        lesson={assistantChapter ? chapterLessons[assistantChapter] : null}
      />
      {notice && <div className="toast" role="status">{notice}</div>}
    </main>
  );
}
