import type { NextRequest } from "next/server";
import { captureError } from "@/lib/observability";
import { rateLimit, RL } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** 接收客户端崩溃上报（来自 global-error.tsx），转交 captureError。 */
export async function POST(req: NextRequest) {
  const limited = rateLimit(req, RL.normal);
  if (limited) return limited;

  const body = await req.json().catch(() => ({}));
  const message = typeof body?.message === "string" ? body.message.slice(0, 500) : "unknown client error";
  captureError(new Error(message), {
    scope: "client",
    digest: typeof body?.digest === "string" ? body.digest : undefined,
    ua: req.headers.get("user-agent") ?? undefined,
  });
  return Response.json({ ok: true });
}
