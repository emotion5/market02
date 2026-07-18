import { prisma } from "@/server/db";

export const dynamic = "force-dynamic";

// 인프라 배선 확인용 엔드포인트. DB 연결 여부까지 점검한다.
// (DATABASE_URL 이 placeholder 면 db: "down" 으로 응답 — 정상)
export async function GET() {
  let db = "up";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    db = "down";
  }
  return Response.json({ ok: true, db });
}
