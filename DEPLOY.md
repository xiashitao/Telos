# 部署文档 — Telos + xsticq 全站

把 Telos（简历）、id-gateway（统一登录）、Kairos（墨鉴，已在跑）部署到同一台
Linux 云服务器（以 Ubuntu 22.04+ 为例）。架构是 **单机 + Caddy 反向代理**：
Caddy 负责 HTTPS（自动签发续期证书）与三个子域的分发；三个服务都绑
`127.0.0.1`，只暴露给 Caddy。登录态靠挂在 `.xsticq.com` 的同一个 JWT Cookie 跨子域共享。

```
                          ┌────────────────────────── 云服务器 ──────────────────────────┐
  浏览器 ──HTTPS──▶       │  Caddy :443（自动 HTTPS）                                     │
                          │   ├─ id.xsticq.com     → 127.0.0.1:8020  (uvicorn / 网关)     │
                          │   ├─ telos.xsticq.com  → 127.0.0.1:3000  (next start / Telos) │
                          │   │        └─ 导出时无头 Chrome 回环访问 127.0.0.1:3000/print │
                          │   └─ kairos.xsticq.com → 127.0.0.1:8010 + 静态 (已在跑)       │
                          │  SQLite：telos.db(分享) / gateway 用户库(可与 charts.db 共享) │
                          └──────────────────────────────────────────────────────────────┘
```

> 适用规模：个人 / 小流量。SQLite + 单机足够；量上来再考虑拆分。

---

## 0. 前置要求

| 组件 | 版本/要求 | 说明 |
|------|----------|------|
| Node.js | **22 LTS**（≥22 硬性要求） | `ai@7` / Next 16 要求；Kairos 构建用的 20 不够 Telos 用 |
| Python | 3.10+ | 网关（FastAPI）；无需 3.13（那是 Kairos 引擎的要求） |
| Caddy | 任意稳定版 | 反代 + 自动 HTTPS |
| Chromium 系统依赖 | 见 §2.2 | Telos 服务端导出 PDF 用 |
| DNS | 三条 A 记录或泛解析 | `id` / `telos` / `kairos` .xsticq.com → 服务器公网 IP |
| 安全组 | 放行 **80 / 443** | 其余端口一律不对外 |

**上线前先生成一个生产密钥（整个 SSO 的契约，三处同值）：**

```bash
openssl rand -hex 32     # 记为 <JWT_SECRET>，别用本地开发用过的那个
```

---

## 1. 部署统一登录网关（id.xsticq.com）

```bash
sudo mkdir -p /opt && sudo chown "$USER" /opt
cd /opt && git clone https://github.com/xiashitao/id-gateway.git
cd id-gateway
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

配置 `/opt/id-gateway/.env`（参考仓库 `.env.example`）：

```bash
JWT_SECRET=<JWT_SECRET>
COOKIE_NAME=xsticq_session
COOKIE_DOMAIN=.xsticq.com          # 挂父域，跨子域共享的关键
COOKIE_SECURE=true
DB_PATH=gateway.db                 # 想复用 Kairos 老用户：指向其 charts.db 绝对路径（免迁移）
ALLOWED_REDIRECT_SUFFIXES=.xsticq.com
CORS_ORIGINS=https://telos.xsticq.com,https://kairos.xsticq.com
PUBLIC_BASE_URL=https://id.xsticq.com

EMAIL_PROVIDER=smtp                # 生产必配，否则验证码只打日志
SMTP_HOST=…  SMTP_PORT=465  SMTP_USER=…  SMTP_PASSWORD=…  SMTP_SSL=true

GOOGLE_CLIENT_ID=                  # 可选；回调地址在 Google 后台登记为
GOOGLE_CLIENT_SECRET=              # https://id.xsticq.com/api/auth/google/callback
```

systemd 守护（模板在本仓库 `deploy/id-gateway.service`，替换 `<GATEWAY>`/`<USER>` 后）：

```bash
sudo cp deploy/id-gateway.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now id-gateway
curl -s http://127.0.0.1:8020/api/health    # → {"status":"ok"}
```

---

## 2. 部署 Telos（telos.xsticq.com）

### 2.1 代码与依赖

```bash
# Node 22（NodeSource）
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

cd /opt && git clone https://github.com/xiashitao/Telos.git telos && cd telos
# Chromium 走 npmmirror 镜像，避免下载卡死
PUPPETEER_DOWNLOAD_BASE_URL=https://cdn.npmmirror.com/binaries/chrome-for-testing \
  npm ci --registry=https://registry.npmmirror.com
```

### 2.2 Chromium 系统依赖（服务端导出 PDF 必需）

```bash
sudo apt install -y libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
  libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 \
  libasound2 fonts-noto-cjk
# fonts-noto-cjk：无头 Chrome 渲染中文的兜底字体，缺了 PDF 里中文会变豆腐块
```

### 2.3 环境变量与构建

```bash
cp deploy/env.production.example .env.local && vim .env.local
# 必填：AUTH_JWT_SECRET=<JWT_SECRET>、ANTHROPIC_API_KEY
# 已预置：AUTH_ENABLED=true(双模式,不上锁)、EXPORT_BASE_URL=http://127.0.0.1:3000、
#         TELOS_DB_PATH=/opt/telos-data/telos.db
sudo mkdir -p /opt/telos-data && sudo chown "$USER" /opt/telos-data

npm run build
# 若服务器直连不了 Google Fonts(构建报 next/font error)：
#   HTTPS_PROXY=http://<代理>:<端口> npm run build   ← Turbopack 只认【大写】变量
```

### 2.4 systemd

```bash
sudo cp deploy/telos.service /etc/systemd/system/   # 先替换 <REPO>/<USER>
sudo systemctl daemon-reload && sudo systemctl enable --now telos
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/   # → 200
```

日常更新：`bash /opt/telos/deploy/update.sh`（拉代码→装依赖→构建→重启）。

---

## 3. Kairos 切成接入方（只改 .env，不改代码）

在 Kairos 的 `web/.env` 追加/修改，然后重启 `kairos.service`：

```bash
COOKIE_NAME=xsticq_session
COOKIE_DOMAIN=.xsticq.com
JWT_SECRET=<JWT_SECRET>            # 与网关同值
COOKIE_SECURE=true
```

> 生效后 Kairos 自己登录下发的 Cookie 就是全站通用的；若网关 `DB_PATH` 指向了
> Kairos 的 charts.db，则老用户直接可在网关登录，零迁移。

---

## 4. Caddy（三个子域一并接管）

配置模板在 **id-gateway 仓库 `deploy/Caddyfile`**（已写好三个子域，Telos 段带
`header_up Host` 保证登录回跳指向正确子域）。

```bash
sudo cp /opt/id-gateway/deploy/Caddyfile /etc/caddy/Caddyfile
# 核对 kairos 段的静态目录路径后：
sudo systemctl reload caddy
```

---

## 5. 上线验收清单

按顺序过一遍，全绿才算上线成功：

- [ ] `https://id.xsticq.com/login` 打开登录页，注册/验证码登录成功
- [ ] 登录后浏览器 Cookie `xsticq_session` 的 Domain 是 **`.xsticq.com`**
- [ ] 打开 `https://telos.xsticq.com` **无需登录**即可编辑简历（免登录模式）
- [ ] Telos 导航栏显示已登录账号（SSO 生效，无需再登）
- [ ] `https://kairos.xsticq.com` 同样已登录（三方互通）
- [ ] Telos 导出 PDF：文字可选中（非图片）、中文正常、多页分页正确
- [ ] 自定义模板 → 分享 → 无痕窗口打开链接 → 「使用此模板」fork 成功
- [ ] 未登录时点「分享」出现「去登录」引导，登录回跳后可分享
- [ ] AI 功能（润色/导入/按 JD 优化）正常（`ANTHROPIC_API_KEY` 生效）
- [ ] 网关 `/logout` 登出后，三个子域都变为未登录

---

## 6. 安全与运维要点

- **密钥**：`<JWT_SECRET>` 泄漏 = 任何人可伪造全站登录态。只放服务器 .env（600 权限），换密钥 = 全员重新登录。
- **限流（已内置）**：AI/导出接口按 IP 内存限流（`src/lib/rate-limit.ts`，AI 12/min、导出 8/min），超限 429。**多实例部署需换 Redis**（当前是单进程内存计数）。可再叠一层 Caddy 层限速做纵深防御。
- **错误上报**：服务端错误走 `captureError` 打结构化 JSON 到 `journalctl -u telos`；配 `ERROR_WEBHOOK_URL` 可转发到 Sentry/Slack。客户端崩溃由 `global-error.tsx` → `/api/client-error` 上报。
- **备份**：`/opt/telos-data/telos.db`、网关用户库、Kairos `charts.db`——三个 SQLite 文件定时 `sqlite3 xx.db ".backup …"` 即可。
- **进程模型**：Telos 导出用的内存暂存（export-store）是单进程语义，`next start` 单实例没问题；未来多实例需换 Redis。
- **常见坑速查**：
  | 症状 | 原因/解法 |
  |---|---|
  | 构建报 `next/font: error` | 服务器直连不了 Google Fonts → `HTTPS_PROXY`（大写）走代理 |
  | 导出 PDF 中文豆腐块 | 缺 `fonts-noto-cjk` |
  | 导出 500 / Chromium 起不来 | §2.2 系统依赖没装全；`npx puppeteer browsers install chrome` 重装 |
  | 登录后 Cookie 不跨子域 | 网关 `COOKIE_DOMAIN` 没设 `.xsticq.com`，或某处密钥不一致 |
  | git push HTTP2 framing 错 | `git -c http.version=HTTP/1.1 push`（配代理） |

---

## 7. 尚未部署的能力（备忘）

- **按导出付费**（MONETIZATION.md）：方案已定未实现，上线收费前需先补支付渠道与限流。
- **多简历 / 云同步**：需要 Telos 后端扩表（复用 telos.db + 网关 user_id），未开工。
