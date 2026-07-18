import "server-only";
import { getSessionUser } from "./session";
import { getMe, type AuthUser } from "@/server/auth/service";

// API 라우트용 ADMIN 가드. ADMIN 이 아니면 null (현재 DB role 로 확인).
export async function getAdmin(): Promise<AuthUser | null> {
  const session = await getSessionUser();
  if (!session) return null;
  const user = await getMe(session.userId);
  return user && user.role === "ADMIN" ? user : null;
}
