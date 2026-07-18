import { getSessionUser, clearSessionCookie } from "@/lib/session";
import { withdraw } from "@/server/auth/service";

export async function POST() {
  const session = await getSessionUser();
  if (!session) return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  await withdraw(session.userId);
  await clearSessionCookie();
  return Response.json({ ok: true });
}
