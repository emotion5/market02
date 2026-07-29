import { getSessionUser } from "@/lib/session";
import { getUserOrder } from "@/server/orders/service";
import { getTracker, TrackingError } from "@/server/shipping/tracker";
import { courierCodeByName } from "@/lib/couriers";

// 본인 주문의 실시간 배송조회. 주문/결제 로직과 결합하지 않는 읽기 전용 조회다.
// 운송장이 없거나 조회 미지원 택배사면 tracking:null + reason 으로 부드럽게 안내한다.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderNo: string }> },
) {
  const session = await getSessionUser();
  if (!session) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { orderNo } = await params;
  const order = await getUserOrder(decodeURIComponent(orderNo), session.userId);
  if (!order) {
    return Response.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
  }

  if (!order.trackingNumber) {
    return Response.json({ tracking: null, reason: "배송 준비 중입니다." });
  }
  const code = courierCodeByName(order.courier);
  if (!code) {
    return Response.json({
      tracking: null,
      reason: "실시간 조회를 지원하지 않는 배송입니다.",
    });
  }

  try {
    const tracking = await getTracker().track({
      courierCode: code,
      trackingNumber: order.trackingNumber,
    });
    return Response.json({ tracking });
  } catch (e) {
    if (e instanceof TrackingError) {
      return Response.json({ tracking: null, reason: e.message });
    }
    throw e;
  }
}
