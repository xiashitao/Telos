import { NextResponse, type NextRequest } from "next/server";
import { buildLogoutUrl } from "@/lib/auth-config";

/** 跳转到网关登出（清父域 Cookie 后回跳）。?next=<回跳地址>，默认回首页。 */
export function GET(req: NextRequest) {
  const next = req.nextUrl.searchParams.get("next") || `${req.nextUrl.origin}/`;
  return NextResponse.redirect(buildLogoutUrl(next));
}
