import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import {
  AUTH_ENABLED,
  AUTH_COOKIE_NAME,
  AUTH_JWT_SECRET,
  AUTH_JWT_ALG,
  PROTECTED_PREFIXES,
  buildLoginUrl,
} from "@/lib/auth-config";

/**
 * 登录网关接入代理（Next 16 Proxy，默认 Node 运行时）。
 * - AUTH_ENABLED=false：完全放行，保持网关就绪前的开发体验。
 * - 命中受保护路径且无有效会话：跳转 id.xsticq.com 登录页并带回跳地址。
 *
 * 注意：这里只用 jose 直接验请求 Cookie，保持 Proxy 自包含、不依赖渲染态模块。
 */
const secretKey = () => new TextEncoder().encode(AUTH_JWT_SECRET);

/**
 * 还原用户实际访问的完整 URL。反代（Caddy）下优先用 X-Forwarded-* 头，
 * 否则用 Host 头 —— 避免 req.nextUrl 在 dev/反代下把 host 归一成 localhost，
 * 导致登录后回跳到错误子域。
 */
function currentUrl(req: NextRequest): string {
  const host =
    req.headers.get("x-forwarded-host") ??
    req.headers.get("host") ??
    req.nextUrl.host;
  const proto =
    req.headers.get("x-forwarded-proto") ??
    req.nextUrl.protocol.replace(":", "");
  return `${proto}://${host}${req.nextUrl.pathname}${req.nextUrl.search}`;
}

async function hasValidSession(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token || !AUTH_JWT_SECRET) return false;
  try {
    await jwtVerify(token, secretKey(), { algorithms: [AUTH_JWT_ALG] });
    return true;
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  if (!AUTH_ENABLED) return NextResponse.next();

  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (!isProtected) return NextResponse.next();

  if (await hasValidSession(req)) return NextResponse.next();

  return NextResponse.redirect(buildLoginUrl(currentUrl(req)));
}

export const config = {
  // 跳过静态资源与 Next 内部路径；其余交给上面的逻辑判断
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)"],
};
