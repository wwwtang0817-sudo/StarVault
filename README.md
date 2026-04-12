# 收藏知识银河

一个单用户网页工具，用来把收藏内容整理成可回看、可搜索、可导出的知识卡片。

## 功能

- 支持两种导入方式：手动整段粘贴、链接导入
- 链接模式目前支持小红书分享链接和公众号文章链接
- AI 先整理标题、正文和分类建议，用户确认后再入库
- 一个内容可加入多个一级分类
- 支持标题、正文、备注搜索，命中结果高亮
- 三栏布局：分类区、卡片流、详情编辑区
- 支持按单条或按分类导出为 Markdown / Excel
- 未配置 AI API Key 时，自动切换为本地兜底整理

## 启动

```bash
python3 app.py
```

默认地址：

```text
http://127.0.0.1:8000
```

## 可选环境变量

### 使用 OpenAI

```bash
export OPENAI_API_KEY=your_key
export OPENAI_MODEL=gpt-4.1-mini
```

### 使用阿里云百炼（DashScope 兼容模式）

```bash
export DASHSCOPE_API_KEY=your_key
export DASHSCOPE_MODEL=qwen-plus
```

如同时配置了 OpenAI 和百炼，默认优先使用百炼。也可以手动指定：

```bash
export AI_PROVIDER=openai
# 或
export AI_PROVIDER=dashscope
```

通用服务地址配置：

```bash
export APP_HOST=127.0.0.1
export APP_PORT=8000
```

## 数据存储

- SQLite 数据库：`data/knowledge.db`
- 无登录、无多用户

## 部署建议

如果只是为了投递时附一个在线演示链接，推荐优先部署到支持 Python Web Service 的平台，例如 Render 或 Railway。

最小部署条件：

- Python 3 运行环境
- 启动命令：`python3 app.py`
- 可写文件系统：当前数据保存在 `data/knowledge.db`
- 环境变量：按需配置 `DASHSCOPE_API_KEY` / `OPENAI_API_KEY`
- 如需 demo 浏览版：额外配置 `READ_ONLY_MODE=true`

当前服务已兼容云平台常见的 `PORT` 注入；本地默认仍使用 `127.0.0.1:8000`，部署到云端时会自动监听平台分配的端口。

如果你要给面试官展示，建议单独准备一个演示实例，并开启 `READ_ONLY_MODE=true`。这样页面仍可完整浏览，但新增、整理、修改、删除等写操作会被统一拦截并提示当前是 demo 预览版本。

## 说明

- 小红书链接抓取受页面结构和访问限制影响，解析失败时页面会引导切换到手动粘贴模式。
- 公众号正文抓取基于公开文章页面结构提取，若文章受限制或结构变化，也可能需要改用手动粘贴。
- Excel 导出为原生 `.xlsx` 文件，不依赖第三方 Python 包。
