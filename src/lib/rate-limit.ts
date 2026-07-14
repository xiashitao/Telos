import "server-only";

/**
 * 轻量内存限流（固定窗口，按 IP+接口名计数）。单机 next start 够用；
 * 多实例部署时需换 Redis（见 DEPLOY.md）。反代(Caddy)下用 X-Forwarded-For 取真实 IP。
 *
 * 用法（路由处理器开头）：
 *   const limited = rateLimit(req, RL.ai);
 *   if (limited) return limited;
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();
let calls = 0;

/** 常用档位：expensive=AI 生成，heavy=起 Chromium，normal=普通写 */
export const RL = {
  ai: { name: "ai", limit: 12, windowMs: 60_000 },
  heavy: { name: "heavy", limit: 8, windowMs: 60_000 },
  normal: { name: "normal", limit: 30, windowMs: 60_000 },
} as const;

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "local";
}

function sweep(now: number) {
  for (const [k, b] of store) if (b.resetAt < now) store.delete(k);
}

export interface RateOpts {
  name: string;
  limit: number;
  windowMs: number;
}

/** 超限返回 429 Response，未超限返回 null。 */
export function rateLimit(req: Request, opts: RateOpts): Response | null {
  const now = Date.now();
  // 每 500 次调用清一次过期 key，避免 map 无界增长
  if (++calls % 500 === 0) sweep(now);

  const key = `${opts.name}:${clientIp(req)}`;
  let b = store.get(key);
  if (!b || b.resetAt < now) {
    b = { count: 0, resetAt: now + opts.windowMs };
    store.set(key, b);
  }
  b.count++;

  if (b.count > opts.limit) {
    const retry = Math.max(1, Math.ceil((b.resetAt - now) / 1000));
    return Response.json(
      { error: "请求过于频繁，请稍后再试" },
      { status: 429, headers: { "Retry-After": String(retry) } },
    );
  }
  return null;
}
