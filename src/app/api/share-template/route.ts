import type { NextRequest } from "next/server";
import { createShare, getShare } from "@/lib/share-db";
import { parseSpec } from "@/lib/template-spec";
import { getSession } from "@/lib/auth";
import { AUTH_ENABLED } from "@/lib/auth-config";
import { rateLimit, RL } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * 模板分享。
 * POST {name, spec} → {slug, url}   分享（登录开启时需登录；spec 过 schema 校验后才入库）
 * GET  ?slug=xxx    → {name, spec}  取分享（使用方 fork 用，无需登录）
 */
export async function POST(req: NextRequest) {
  const limited = rateLimit(req, RL.normal);
  if (limited) return limited;

  let owner = "anonymous";
  if (AUTH_ENABLED) {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "请先登录后再分享模板" }, { status: 401 });
    }
    owner = session.userId;
  }

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 40) : "";
  const spec = parseSpec(body?.spec);
  if (!name || !spec) {
    return Response.json({ error: "模板名或参数不合法" }, { status: 400 });
  }

  const slug = createShare(name, JSON.stringify(spec), owner);
  const url = `${req.nextUrl.origin}/t/${slug}`;
  return Response.json({ slug, url });
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug") ?? "";
  const row = slug ? getShare(slug) : null;
  const spec = row ? parseSpec(JSON.parse(row.specJson)) : null;
  if (!row || !spec) {
    return Response.json({ error: "分享不存在或已失效" }, { status: 404 });
  }
  return Response.json({ name: row.name, spec });
}
