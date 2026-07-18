import { SignJWT, jwtVerify } from "jose";

// 로그인 세션 = httpOnly 쿠키에 담는 JWT.
// 이 파일은 "서명/검증"만 담당하고 Next(next/headers)에 의존하지 않는다
// → 그대로 다른 백엔드(NestJS 등)로 이식 가능. jose 는 edge 런타임에서도 동작.
// 쿠키를 실제로 굽고 읽는 것은 Next 경계(proxy.ts / route handler)가 한다.

export const SESSION_COOKIE = "market02_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7일(초)

export type SessionRole = "CUSTOMER" | "ADMIN";

export interface SessionPayload {
  userId: string;
  role: SessionRole;
}

function secret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET 환경변수가 필요합니다.");
  return new TextEncoder().encode(s);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ userId: payload.userId, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

export async function verifySession(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.userId !== "string" || typeof payload.role !== "string") {
      return null;
    }
    return { userId: payload.userId, role: payload.role as SessionRole };
  } catch {
    return null;
  }
}
