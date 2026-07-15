# 机器人学习中枢

一个面向长期维护的个人学习网站，覆盖机器人系统、ROS 2、运动学、嵌入式系统与大模型/具身智能。

## 本地运行

```bash
npm install
npm run dev
```

浏览器打开 `http://localhost:3000`。

## 内容维护

- 路线、章节与知识图谱数据集中在 `app/data.js`。
- 每个章节使用稳定的 `id` 保存学习状态；新增章节时请保持 `id` 唯一。
- 学习状态保存在浏览器 `localStorage`，也可以在页面右上角导出或导入 JSON 备份。

## 验证

```bash
npm run build
```
