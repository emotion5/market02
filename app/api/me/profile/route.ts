import { getSessionUser } from "@/lib/session";
import { getProfile, updateProfile } from "@/server/auth/service";
import { profileUpdateSchema } from "@/lib/schemas";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const profile = await getProfile(session.userId);
  if (!profile) return Response.json({ error: "회원 정보를 찾을 수 없습니다." }, { status: 404 });
  return Response.json({ profile });
}

export async function PATCH(request: Request) {
  const session = await getSessionUser();
  if (!session) return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "입력값을 확인해주세요.", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  await updateProfile(session.userId, parsed.data);
  const profile = await getProfile(session.userId);
  return Response.json({ profile });
}
