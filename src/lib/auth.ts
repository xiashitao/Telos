import "server-only";
import { cookies } from "next/headers";
import { jwtVerify, type JWTPayload } from "jose";
import {
  AUTH_COOKIE_NAME,
  AUTH_JWT_SECRET,
  AUTH_JWT_ALG,
  AUTH_ME_URL,
} from "./auth-config";

/**
 * 网关签发的会话。sub = 用户 id，role = 角色（user/pro/max/admin）。
 * 与 id.xsticq.com 的 JWT claims 一致。
 */
export interface Session {
  userId: string;
  role: string;
}

/** 网关 /api/auth/me 返回的用户资料（JWT 里没带的字段） */
export interface GatewayUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

const secretKey = () => new TextEncoder().encode(AUTH_JWT_SECRET);

/** 校验一段 JWT，成功返回 Session，失败（无效/过期/未配密钥）返回 null。 */
export async function verifyToken(token: string): Promise<Session | null> {
  if (!AUTH_JWT_SECRET || !token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: [AUTH_JWT_ALG],
    });
    return payloadToSession(payload);
  } catch {
    return null;
  }
}

function payloadToSession(payload: JWTPayload): Session | null {
  const userId = typeof payload.sub === "string" ? payload.sub : "";
  if (!userId) return null;
  const role = typeof payload.role === "string" ? payload.role : "user";
  return { userId, role };
}

/**
 * 从请求 Cookie 读取并校验当前会话（服务端用）。
 * 用于 Server Component / Route Handler 判断登录态。
 */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * 向网关换取完整用户资料（email/name 等）。转发会话 Cookie 做鉴权。
 * 网关不可达或未登录时返回 null。
 */
export async function fetchGatewayUser(): Promise<GatewayUser | null> {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const res = await fetch(AUTH_ME_URL, {
      headers: { cookie: `${AUTH_COOKIE_NAME}=${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as GatewayUser;
  } catch {
    return null;
  }
}
