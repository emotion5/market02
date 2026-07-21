import { getSessionUser } from "@/lib/session";
import { confirmPayment } from "@/server/payments/service";
import { getUserOrder } from "@/server/orders/service";

// 토스 결제창 successUrl 복귀 후 프론트가 호출 — 서버에서 승인(가상계좌 발급)한다.
// 본인 주문만 승인할 수 있고, 금액 검증은 confirmPayment 가 서버 주문총액과 대조한다.
export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const paymentKey = body?.paymentKey;
  const orderId = body?.orderId;
  const amount = Number(body?.amount);
  if (!paymentKey || !orderId || !Number.isFinite(amount)) {
    return Response.json({ error: "결제 정보가 올바르지 않습니다." }, { status: 400 });
  }

  // 소유권 확인 후에만 승인
  const owned = await getUserOrder(orderId, session.userId);
  if (!owned) {
    return Response.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
  }

  try {
    await confirmPayment(orderId, paymentKey, amount);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "결제 승인에 실패했습니다.";
    return Response.json({ error: message }, { status: 400 });
  }

  const order = await getUserOrder(orderId, session.userId);
  return Response.json({ order });
}
