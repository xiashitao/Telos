import { getSession, fetchGatewayUser } from "@/lib/auth";
import { AUTH_ENABLED } from "@/lib/auth-config";

/** 当前登录用户。未登录返回 401；auth 未启用返回 { enabled:false }。 */
export async function GET() {
  if (!AUTH_ENABLED) {
    return Response.json({ enabled: false, user: null });
  }
  const session = await getSession();
  if (!session) {
    return Response.json({ enabled: true, user: null }, { status: 401 });
  }
  // 优先向网关取完整资料（email/name）；取不到则退回 JWT 里的信息。
  const gatewayUser = await fetchGatewayUser();
  const user = gatewayUser ?? {
    id: session.userId,
    email: "",
    name: "",
    role: session.role,
  };
  return Response.json({ enabled: true, user });
}
