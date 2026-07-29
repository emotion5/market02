import { loginSchema } from "@/lib/schemas";
import { login, sessionFor, AuthError } from "@/server/auth/service";
import { setSessionCookie } from "@/lib/session";
import {
  loginLockedUntil,
  recordLoginFail,
  clearLoginThrottle,
} from "@/server/auth/throttle";

// 요청 IP(프록시 경유 x-forwarded-for 첫 항목). 레이트리밋 키로 사용.
function clientKey(request: Request): string {
  const xff = request.headers.get("x-forwarded-for") ?? "";
  return xff.split(",")[0].trim() || "unknown";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "이메일과 비밀번호를 확인해주세요." },
      { status: 400 },
    );
  }

  // 무차별 대입 방어: 이 IP가 잠겨 있으면 비밀번호 검증 자체를 건너뛴다.
  const key = clientKey(request);
  if (await loginLockedUntil(key)) {
    return Response.json(
      { error: "로그인 시도가 너무 많습니다. 잠시 후(약 15분) 다시 시도해주세요." },
      { status: 429 },
    );
  }

  try {
    const user = await login(parsed.data);
    await clearLoginThrottle(key); // 성공 → 카운트 리셋
    await setSessionCookie(sessionFor(user));
    return Response.json({ user });
  } catch (e) {
    if (e instanceof AuthError) {
      // 비밀번호 오류만 카운트(정지·탈퇴 등 상태 오류는 제외)
      if (e.code === "INVALID_CREDENTIALS") await recordLoginFail(key);
      return Response.json({ error: e.message, code: e.code }, { status: 401 });
    }
    throw e;
  }
}
