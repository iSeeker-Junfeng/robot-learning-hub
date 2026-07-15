# XUANSHU/玄枢 · 机器人学习中枢

一个面向长期维护的机器人学习平台，覆盖机器人系统、ROS 2、运动学、嵌入式系统与大模型/具身智能，并提供结合当前章节内容的 AI 学习助教。

## 架构

- `app/`：React 前端，负责学习路线、章节、进度、精选资料和“问玄枢”交互。
- `backend/`：独立 FastAPI 服务，负责知识检索、提示词组装和模型调用。
- `content/knowledge.json`：由前端课程数据生成的后端知识快照，避免前后端各维护一份课程内容。
- 模型服务通过 OpenAI 兼容协议接入，默认使用阿里云百炼 DashScope，也可以替换为其他兼容服务。

## 本地运行

```bash
npm install
npm run dev
```

浏览器打开 `http://localhost:3000`。

## 启动 AI 后端

需要 Python 3.11 或更高版本：

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
```

在 `backend/.env` 中设置 `DASHSCOPE_API_KEY`。默认使用中国内地 DashScope 兼容地址和 `qwen-plus`；如需固定当前新版本，可以把 `LLM_MODEL` 改为百炼控制台中已开通的模型，例如 `qwen3.7-plus`。密钥只保存在后端。

如果 API Key 属于其他地域，需要同时把 `LLM_BASE_URL` 改成该地域的 OpenAI 兼容地址；API Key 与地域必须匹配。

```bash
uvicorn app.main:app --reload --port 8000
```

另一个终端启动前端：

```bash
cp .env.example .env
npm run dev
```

也可以使用 Docker 启动后端：

```bash
cp backend/.env.example backend/.env
docker compose up --build api
```

生产环境需要把 `NEXT_PUBLIC_XUANSHU_API_URL` 设置为 FastAPI 的公开 HTTPS 地址，并把前端域名加入后端 `CORS_ORIGINS`。

## 内容维护

- 路线、章节与知识图谱数据集中在 `app/data.js`。
- `chapterGuides` 保存学习重点、工程练习和验收标准。
- `chapterLessons` 保存学习目标、分步讲解、常见误区和自测问题。
- `resourceCatalog` 是可复用的精选资料目录，保存分类、难度、阅读时长、链接与推荐说明。
- `chapterResources` 通过资料 ID 为每个章节配置精选资料；同一资料可被多个章节复用，并共享已读状态。
- 每个章节使用稳定的 `id` 保存学习状态；新增章节时请保持 `id` 唯一。
- 章节状态、分步学习记录和资料已读状态保存在浏览器 `localStorage`，也可以在页面右上角导出或导入 JSON 备份。
- AI 对话按章节保存在浏览器中；问题会携带当前章节、路线与学习目标，但不会携带模型密钥。
- 修改课程数据后运行 `npm run content:export`，即可更新 FastAPI 使用的知识快照；生产构建会自动执行此步骤。

## AI API

- `GET /api/v1/health`：后端和模型配置状态。
- `GET /api/v1/models`：当前模型供应商与默认模型。
- `POST /api/v1/chat/stream`：SSE 流式知识问答。
- `POST /api/v1/chat/feedback`：预留的答疑反馈接口。

## 验证

```bash
npm run build
cd backend && pytest
```
