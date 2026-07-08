import { NextResponse, type NextRequest } from "next/server";
import { buildLoginUrl } from "@/lib/auth-config";

/**
 * 跳转到网关登录页。?next=<回跳地址> 指定登录后回到哪，默认回编辑器。
 * 供导航栏“登录”入口使用（服务端读网关地址，无需暴露到客户端）。
 */
export function GET(req: NextRequest) {
  const next = req.nextUrl.searchParams.get("next") || `${req.nextUrl.origin}/editor`;
  return NextResponse.redirect(buildLoginUrl(next));
}
