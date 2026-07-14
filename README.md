# Telos · AI 简历生成器

面向求职者的智能简历工具：填经历、AI 润色、按 JD 优化、多模板，一键导出 **ATS 可解析**的 PDF / HTML。

技术栈：Next.js 16（App Router）· React 19 · Tailwind v4 · Zustand · Zod · Vercel AI SDK（Anthropic）。

## 本地启动

Telos 是 **Next.js 全栈应用**，前端和所有接口（AI、导出、PDF 抽取）都在同一个进程里——**不用单独起后端**，一条命令即可。

```bash
nvm use            # 切到 Node 22（项目内含 .nvmrc）；ai@7 / Next 16 要求 Node ≥ 22
npm install
npm run dev        # http://localhost:3000 —— 页面 + 全部 API 一起起来
```

> 导出（Puppeteer 无头 Chrome）和 PDF 抽取都在进程内按需运行，首次 `npm install` 会下载 Chromium。
> 国内网络建议：`PUPPETEER_DOWNLOAD_BASE_URL=https://cdn.npmmirror.com/binaries/chrome-for-testing npm install`。

### 环境变量（`.env.local`）

```bash
# AI 功能需要（缺失时 enhance/analyze/import/tailor 返回 503；其余功能不受影响）
ANTHROPIC_API_KEY=
# 可选：覆盖默认模型（默认 claude-sonnet-5）
# AI_MODEL=claude-sonnet-5

# 统一登录网关接入（默认关闭；日常开发无需配置，详见 AUTH.md）
# 双模式：免登录=全功能本地可用；登录=可选增强(分享/未来云同步付费)。开启不会把站点上锁
AUTH_ENABLED=false
```

### 本地模式（隐私）

Telos 本就是**本地优先**：简历与自定义模板只存在浏览器 `localStorage`，从不上云。
导航栏的「**本地模式**」开关进一步收紧隐私：开启后隐藏模板分享（唯一的云写入）与登录入口，
并对会临时经服务器处理的 AI / 导出加透明提示。开关状态本地保存。

**记住两个例外：**

1. **AI 功能要 key**：`AI 润色 / 分析 / JD 匹配 / 导入 / 按 JD 优化` 需要 `ANTHROPIC_API_KEY`。
   非 AI 功能（编辑、导出 PDF/HTML、上传 PDF 抽文字）**不需要 key，直接可用**。
2. **登录网关是独立服务，平时不用起**：Telos 默认 `AUTH_ENABLED=false`，日常只起 Telos 即可。
   只有测跨子域 SSO 登录时才另起 `id-gateway`（见 [AUTH.md](./AUTH.md)）。

## 功能

- **编辑**：8 大模块（经历/项目/教育/技能/证书/语言/奖项）、拖拽排序、富文本、13+ 模板、主题（字体/配色/间距）。
- **AI（需 key）**：单条经历润色、整体评分、JD 匹配分析、**按 JD 一键优化整份简历**（编辑器顶部 JD 优化条，流式改写、可撤销）、生成简介、智能精简到一页。
- **导入**：上传 **PDF**（服务端 `pdf-parse` 抽取）或 **Markdown/文本** 文件、或直接粘贴，AI 流式结构化并填入表单（覆盖 + 二次确认）。
- **导出**：服务端无头浏览器渲染，输出 **文字版 PDF**（ATS 可解析、自动分页）或 **自包含 HTML**。

## 常用脚本

```bash
npm run dev      # 开发
npm run build    # 生产构建
npm run start    # 启动生产构建
npm run lint     # ESLint
```

## 项目文档

| 文档 | 内容 |
|---|---|
| [DEPLOY.md](./DEPLOY.md) | 部署上线（xsticq 全站：网关 + Telos + Kairos + Caddy + 验收清单） |
| [AUTH.md](./AUTH.md) | 统一登录网关（id.xsticq.com）接入契约与双模式说明 |
| [TEMPLATES-PLAN.md](./TEMPLATES-PLAN.md) | 模板体系方案（TemplateSpec / vibe coding / 分享，已实现） |
| [MONETIZATION.md](./MONETIZATION.md) | 收费方案（分产品 / 不订阅 / 按导出计费，暂缓实现） |

## 部署要点

- 自托管（Node 服务器）：`npm run build && npm run start`。导出接口是 Node 运行时，**不适合 Serverless 免费函数**。
- 服务器需 Chromium + 系统依赖（`npx puppeteer browsers install chrome` 并补 `libnss3` 等库）。
- 登录网关另有独立部署（FastAPI + Caddy），见 `../id-gateway`。
