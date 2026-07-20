import { getSessionUser } from "@/lib/session";
import { syncPayment } from "@/server/payments/service";
import { getUserOrder } from "@/server/orders/service";

// 가상계좌 발급 직후 프론트에서 호출 — 웹훅을 기다리지 않고 즉시 발급 계좌를 조회·표시.
// 본인 주문만 동기화할 수 있다(포트원 재조회는 syncPayment 가 수행).
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ orderNo: string }> },
) {
  const session = await getSessionUser();
  if (!session) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { orderNo } = await params;

  // 소유권 확인 후에만 동기화
  const owned = await getUserOrder(orderNo, session.userId);
  if (!owned) {
    return Response.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
  }

  await syncPayment(orderNo);
  const order = await getUserOrder(orderNo, session.userId);
  return Response.json({ order });
}
