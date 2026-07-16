# XUANSHU/玄枢 · 机器人学习中枢

一个面向长期维护的机器人学习平台，覆盖机器人系统、ROS 2、运动学、嵌入式系统与大模型/具身智能，并提供结合当前章节内容的 AI 学习助教。

## 架构

- `app/`：React 前端，负责学习路线、章节、进度、精选资料和“问玄枢”交互。
- `backend/`：独立 FastAPI 服务，负责知识检索、提示词组装、模型调用与 SQLite 数据访问。
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

首次启动前，在 `backend/.env` 中至少设置管理令牌和数据库加密密钥：

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

把输出保存为 `SETTINGS_ENCRYPTION_KEY`，再为 `ADMIN_TOKEN` 设置一个足够长的随机值。二者都不能提交到 Git。`DASHSCOPE_API_KEY` 可以继续通过环境变量设置，也可以在网站右上角的“AI 配置”页面中填写；页面保存的 API Key 会使用 Fernet 加密后写入 SQLite，接口只返回配置状态和密钥尾号。

默认使用中国内地 DashScope 兼容地址和 `qwen-plus`；如需固定当前新版本，可以把 `LLM_MODEL` 改为百炼控制台中已开通的模型。数据库配置优先于环境变量，删除数据库配置后会自动回退到环境变量。

如果 API Key 属于其他地域，需要同时把 `LLM_BASE_URL` 改成该地域的 OpenAI 兼容地址；API Key 与地域必须匹配。

```bash
uvicorn app.main:app --reload --port 8888
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

Docker Compose 会把 SQLite 文件保存在项目的 `data/` 目录，并挂载到容器的 `/app/data`。升级或重建容器不会删除学习记录与模型配置；请同时备份数据库文件和 `SETTINGS_ENCRYPTION_KEY`，缺少原密钥将无法解密已保存的 API Key。

## 内容维护

- 路线、章节与知识图谱数据集中在 `app/data.js`。
- `chapterGuides` 保存学习重点、工程练习和验收标准。
- `chapterLessons` 保存学习目标、分步讲解、常见误区和自测问题。
- `resourceCatalog` 是可复用的精选资料目录，保存分类、难度、阅读时长、链接与推荐说明。
- `chapterResources` 通过资料 ID 为每个章节配置精选资料；同一资料可被多个章节复用，并共享已读状态。
- 每个章节使用稳定的 `id` 保存学习状态；新增章节时请保持 `id` 唯一。
- 章节状态、分步学习记录和资料已读状态目前保存在浏览器 `localStorage`，也可以在页面右上角导出或导入 JSON 备份。
- SQLite 已提供通用学习记录 CRUD，可保存章节进度、资料已读、笔记和问答记录等 JSON 数据。后续接入账号系统时可以把现有浏览器记录迁移到该接口，而不需要调整数据库表结构。
- AI 对话按章节保存在浏览器中；问题会携带当前章节、路线与学习目标，但不会携带模型密钥。
- 修改课程数据后运行 `npm run content:export`，即可更新 FastAPI 使用的知识快照；生产构建会自动执行此步骤。

## AI API

- `GET /api/v1/health`：后端和模型配置状态。
- `GET /api/v1/models`：当前模型供应商与默认模型。
- `POST /api/v1/chat/stream`：SSE 流式知识问答。
- `POST /api/v1/chat/feedback`：预留的答疑反馈接口。
- `GET /api/v1/settings/llm`：读取安全的模型配置摘要，不返回原始 API Key。
- `PUT /api/v1/settings/llm`：新增或修改模型配置，需要 `X-Admin-Token`。
- `DELETE /api/v1/settings/llm`：删除数据库模型配置并回退环境变量，需要 `X-Admin-Token`。
- `POST /api/v1/learning-records`：创建学习记录。
- `GET /api/v1/learning-records`：按 `client_id` 和可选 `record_type` 查询记录。
- `GET / PUT / DELETE /api/v1/learning-records/{id}`：读取、修改或删除单条记录。

SQLite 表由后端首次启动时自动创建。`app_settings` 存储运行时配置，`learning_records` 使用 `client_id + record_type + record_key` 唯一约束，避免同一学习对象产生重复记录。

## 验证

```bash
npm run build
cd backend && pytest
```
