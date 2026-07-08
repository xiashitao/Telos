/**
 * 统一登录网关（id.xsticq.com）接入契约 —— 所有 xsticq.com 下的应用共享同一套。
 *
 * 这些值必须与网关签发端保持一致（同名 Cookie、同一 JWT 密钥、同一算法），
 * 全部通过环境变量注入，Telos 本身不硬编码任何机密。
 *
 * 本地开发默认 AUTH_ENABLED=false —— 不拦截、不跳转，保持现有开发体验；
 * 网关就绪后在 .env 打开即可，无需改代码。
 */

/** 认证总开关：未就绪前保持 false，不影响本地开发 */
export const AUTH_ENABLED = process.env.AUTH_ENABLED === "true";

/** 网关下发的会话 Cookie 名（跨应用契约，建议中性名） */
export const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "xsticq_session";

/** 网关签发 JWT 用的对称密钥（HS256）。生产必须由环境注入，与网关一致。 */
export const AUTH_JWT_SECRET = process.env.AUTH_JWT_SECRET ?? "";

/** JWT 签名算法，与网关一致 */
export const AUTH_JWT_ALG = process.env.AUTH_JWT_ALG ?? "HS256";

/** 网关登录页地址（未登录跳这里，带 ?redirect 回跳本站） */
export const AUTH_GATEWAY_URL =
  process.env.AUTH_GATEWAY_URL ?? "https://id.xsticq.com";

/** 网关“当前用户”接口，用于取 email/name 等 JWT 里没有的资料（可选） */
export const AUTH_ME_URL =
  process.env.AUTH_ME_URL ?? `${AUTH_GATEWAY_URL}/api/auth/me`;

/** 需要登录才能访问的路径前缀（AUTH_ENABLED 为 true 时中间件据此拦截） */
export const PROTECTED_PREFIXES = ["/editor"];

/** 拼接跳转到网关登录页的完整地址（带回跳） */
export function buildLoginUrl(returnTo: string): string {
  const url = new URL("/login", AUTH_GATEWAY_URL);
  url.searchParams.set("redirect", returnTo);
  return url.toString();
}

/** 拼接跳转到网关登出的完整地址（清父域 Cookie 后回跳） */
export function buildLogoutUrl(returnTo: string): string {
  const url = new URL("/logout", AUTH_GATEWAY_URL);
  url.searchParams.set("redirect", returnTo);
  return url.toString();
}
