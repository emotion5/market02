import { prisma } from "@/server/db";

// 로그인 무차별 대입 방어 — 클라이언트 IP별로 실패를 세고, 임계치 넘으면 잠근다.
// (서버리스라 메모리 카운터가 인스턴스마다 달라져서 DB에 기록해 공유)

const MAX_FAILS = 10; // 창(window) 안에서 허용하는 실패 횟수
const WINDOW_MS = 10 * 60_000; // 실패 집계 창: 10분
const LOCK_MS = 15 * 60_000; // 초과 시 잠금: 15분

// 잠겨 있으면 해제 시각을, 아니면 null.
export async function loginLockedUntil(key: string): Promise<Date | null> {
  const t = await prisma.loginThrottle.findUnique({ where: { key } });
  if (t?.lockedUntil && t.lockedUntil > new Date()) return t.lockedUntil;
  return null;
}

// 실패 1회 기록. 창이 지났으면 리셋, 임계치 도달 시 잠금 설정.
export async function recordLoginFail(key: string): Promise<void> {
  const now = new Date();
  const t = await prisma.loginThrottle.findUnique({ where: { key } });
  if (!t) {
    await prisma.loginThrottle.create({
      data: { key, failCount: 1, windowStart: now },
    });
    return;
  }
  const windowExpired = now.getTime() - t.windowStart.getTime() > WINDOW_MS;
  const failCount = windowExpired ? 1 : t.failCount + 1;
  const windowStart = windowExpired ? now : t.windowStart;
  const lockedUntil =
    failCount >= MAX_FAILS ? new Date(now.getTime() + LOCK_MS) : null;
  await prisma.loginThrottle.update({
    where: { key },
    data: { failCount, windowStart, lockedUntil },
  });
}

// 로그인 성공 시 해당 IP 기록 제거(카운트 리셋).
export async function clearLoginThrottle(key: string): Promise<void> {
  await prisma.loginThrottle.deleteMany({ where: { key } });
}
