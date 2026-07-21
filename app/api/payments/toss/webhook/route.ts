import { syncPayment } from "@/server/payments/service";

// 토스페이먼츠 입금통보(DEPOSIT_CALLBACK) 및 상태변경 웹훅 수신.
// 공개 엔드포인트지만 본문을 신뢰하지 않고, orderId 로 토스에 재조회(syncPayment)해
// DB 를 맞춘다 — 위조 본문으로는 상태를 바꿀 수 없다.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  // DEPOSIT_CALLBACK: { orderId, status, ... }
  // PAYMENT_STATUS_CHANGED: { data: { orderId, status, ... } }
  const orderId: string | undefined = body?.orderId ?? body?.data?.orderId;

  if (orderId) {
    try {
      await syncPayment(orderId);
    } catch (e) {
      // 처리 실패 시 500 → 토스가 재시도한다.
      console.error("[toss] webhook 처리 실패", e);
      return new Response("processing error", { status: 500 });
    }
  }

  return new Response(null, { status: 200 });
}
