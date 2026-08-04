import { getSessionUser } from "@/lib/session";
import { getUserOrder, autoCompleteDelivery } from "@/server/orders/service";
import { getTracker, TrackingError } from "@/server/shipping/tracker";

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

  try {
    // 택배사명 → provider 코드 변환은 어댑터가 담당(미지원이면 TrackingError).
    const tracking = await getTracker().track({
      courierName: order.courier ?? "",
      trackingNumber: order.trackingNumber,
    });
    // 택배사가 배송완료로 확인해주면 주문 상태를 자동 승격(배송중→배송완료).
    // 관리자가 수동으로 누르지 않아도 마이페이지/관리자 뱃지가 맞춰진다.
    const delivered = tracking.completed
      ? await autoCompleteDelivery(order.orderNo, session.userId)
      : false;
    return Response.json({ tracking, delivered });
  } catch (e) {
    if (e instanceof TrackingError) {
      return Response.json({ tracking: null, reason: e.message });
    }
    throw e;
  }
}
