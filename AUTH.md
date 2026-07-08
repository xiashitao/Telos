# 统一登录网关接入契约（xsticq.com）

所有 `*.xsticq.com` 应用共享同一套登录态。身份中心是独立网关 **id.xsticq.com**，
各应用（Telos、Kairos…）是纯接入方（relying party），只验 JWT，不自己做登录。

## 契约（各应用必须一致）

| 项 | 值 | 说明 |
|---|---|---|
| Cookie 名 | `xsticq_session` | 网关签发，中性名 |
| Cookie 域 | `Domain=.xsticq.com` | 挂父域，所有子域可读 |
| Cookie 属性 | `httpOnly; Secure; SameSite=Lax` | 本地 dev 用 lvh.me 时 `Secure=false` |
| 签名算法 | `HS256` | 对称密钥 |
| 密钥 | `AUTH_JWT_SECRET` | 网关与各应用共享，环境变量注入，勿入库 |
| JWT claims | `{ sub: 用户id, role, exp }` | `role` ∈ user/pro/max/admin |
| 登录页 | `https://id.xsticq.com/login?redirect=<回跳地址>` | 登录成功跳回 |
| 用户资料 | `GET https://id.xsticq.com/api/auth/me`（带 Cookie） | 取 email/name 等 |
| 登出 | `POST https://id.xsticq.com/api/auth/logout` | 清父域 Cookie |

## Telos 侧接入（已实现，P1）

- `src/lib/auth-config.ts` — 契约常量，全部读环境变量。
- `src/lib/auth.ts` — 服务端 `getSession()` / `verifyToken()` / `fetchGatewayUser()`（jose 验签）。
- `src/proxy.ts` — Next 16 Proxy：受保护路径（默认 `/editor`）无有效会话则跳网关登录页。
- 开关 `AUTH_ENABLED`：网关就绪前保持 `false`，不拦截、不影响本地开发。

打开方式：`.env.local` 里设 `AUTH_ENABLED=true` 且填入与网关一致的 `AUTH_JWT_SECRET`。

## 环境变量

```
AUTH_ENABLED=false                        # 网关就绪后置 true
AUTH_COOKIE_NAME=xsticq_session
AUTH_JWT_SECRET=                           # 与网关同一密钥
AUTH_JWT_ALG=HS256
AUTH_GATEWAY_URL=https://id.xsticq.com
```

## 本地 SSO 实时演示（lvh.me）

```bash
# 1) 起网关（见 ../id-gateway/README.md）
cd ../id-gateway && ./run.sh                      # http://id.lvh.me:8020

# 2) Telos .env.local 临时改为：
#    AUTH_ENABLED=true
#    AUTH_JWT_SECRET=<与 id-gateway/.env 的 JWT_SECRET 同值>
#    AUTH_GATEWAY_URL=http://id.lvh.me:8020
# 3) 起 Telos，浏览器开 http://telos.lvh.me:3000/editor
#    未登录 → 跳网关登录 → 注册/登录 → 自动跳回，已登录；导航栏显示账号 + 退出
```

默认 `AUTH_ENABLED=false`，不配网关也能独立开发 Telos。

## 待办（网关侧，P2/P3）

- 建 id.xsticq.com：复用 Kairos 现成 FastAPI 认证（bcrypt/OTP/Google OAuth）+ 补带 `?redirect` 的登录页；Cookie 改名 `xsticq_session` 并挂 `.xsticq.com`。
- Kairos 用户库迁移到网关，**保持 user_id 稳定**（其会话/记忆以 user_id 关联）。
- 本地用 `lvh.me` 子域联调（`telos.lvh.me` / `id.lvh.me`，`Secure=false`）。
