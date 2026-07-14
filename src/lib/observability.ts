import "server-only";

/**
 * 轻量错误可观测性（零依赖，provider 无关）。
 * - 始终打一条结构化 JSON 到 stderr（被 systemd/journald 收走，`journalctl -u telos` 可查）。
 * - 若配了 ERROR_WEBHOOK_URL，fire-and-forget 转发到该地址（Sentry 的 ingest / Slack /
 *   任意收集器都可）。不阻塞请求、失败静默，绝不因上报本身再抛错。
 */

interface ErrorContext {
  scope: string; // 如 "api/export"
  [k: string]: unknown;
}

export function captureError(err: unknown, ctx: ErrorContext): void {
  const payload = {
    level: "error" as const,
    ts: new Date().toISOString(),
    ...ctx,
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  };

  // 1) 结构化日志（始终）
  try {
    console.error(JSON.stringify(payload));
  } catch {
    console.error("[captureError]", ctx.scope, payload.message);
  }

  // 2) 可选转发（不 await，不影响响应）
  const url = process.env.ERROR_WEBHOOK_URL;
  if (url) {
    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {
      /* 上报失败静默 */
    });
  }
}
