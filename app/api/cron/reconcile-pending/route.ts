import { reconcileOverduePending } from "@/server/payments/service";

// 입금기한 지난 미결제 주문 정리(웹훅 유실 대비 그물망). Vercel Cron 이 주기 호출한다.
// Vercel Cron 은 요청에 Authorization: Bearer <CRON_SECRET> 를 자동으로 붙인다.
// CRON_SECRET 이 없거나 일치하지 않으면 거부 → 외부에서 임의 호출 불가.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const result = await reconcileOverduePending();
  return Response.json({ ok: true, ...result });
}
