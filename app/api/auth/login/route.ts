import { loginSchema } from "@/lib/schemas";
import { login, sessionFor, AuthError } from "@/server/auth/service";
import { setSessionCookie } from "@/lib/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "이메일과 비밀번호를 확인해주세요." },
      { status: 400 },
    );
  }
  try {
    const user = await login(parsed.data);
    await setSessionCookie(sessionFor(user));
    return Response.json({ user });
  } catch (e) {
    if (e instanceof AuthError) {
      return Response.json({ error: e.message, code: e.code }, { status: 401 });
    }
    throw e;
  }
}
