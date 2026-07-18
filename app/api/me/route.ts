import { getSessionUser } from "@/lib/session";
import { getMe } from "@/server/auth/service";

// 로그인 안 됨도 200 + { user: null } 로 응답 (클라이언트 hydration 단순화)
export async function GET() {
  const session = await getSessionUser();
  if (!session) return Response.json({ user: null });
  const user = await getMe(session.userId);
  return Response.json({ user });
}
