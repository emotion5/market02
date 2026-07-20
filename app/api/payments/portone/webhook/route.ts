import { Webhook } from "@portone/server-sdk";
import { syncPayment } from "@/server/payments/service";

// 포트원 입금통보(및 발급/실패) 웹훅 수신.
// 공개 엔드포인트지만 웹훅 시크릿 서명검증으로 보호한다(관리자 가드 없음 — 포트원이 호출).
// 검증 후에는 본문을 신뢰하지 않고 syncPayment 가 포트원에 재조회해 DB 를 맞춘다.
export async function POST(request: Request) {
  const body = await request.text(); // 서명검증은 원문(raw) 으로 해야 한다.

  let event;
  try {
    event = await Webhook.verify(
      process.env.PORTONE_WEBHOOK_SECRET ?? "",
      body,
      Object.fromEntries(request.headers),
    );
  } catch {
    return new Response("invalid webhook signature", { status: 400 });
  }

  // 결제(Transaction.*) 웹훅만 처리. data.paymentId = 우리 orderNo.
  if ("data" in event && "paymentId" in event.data) {
    try {
      await syncPayment(event.data.paymentId);
    } catch (e) {
      // 처리 실패 시 500 → 포트원이 재시도한다.
      console.error("[portone] webhook 처리 실패", e);
      return new Response("processing error", { status: 500 });
    }
  }

  return new Response(null, { status: 200 }); // 30초 내 200 필수
}
