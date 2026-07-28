import { getSessionUser } from "@/lib/session";
import { cancelOwnOrder } from "@/server/orders/service";

// 본인 주문 취소(입금 전만). 소유자·상태 검증은 서버에서 강제한다.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderNo: string }> },
) {
  const session = await getSessionUser();
  if (!session) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  if (!body || body.action !== "cancel") {
    return Response.json({ error: "지원하지 않는 요청입니다." }, { status: 400 });
  }
  const { orderNo } = await params;
  const result = await cancelOwnOrder(session.userId, decodeURIComponent(orderNo));
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  return Response.json({ ok: true });
}
