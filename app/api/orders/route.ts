import { getSessionUser } from "@/lib/session";
import { placeOrder, listUserOrders, OrderError } from "@/server/orders/service";
import { orderDraftSchema } from "@/lib/schemas";

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const orders = await listUserOrders(session.userId);
  return Response.json({ orders });
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const parsed = orderDraftSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "입력값을 확인해주세요.", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  try {
    const order = await placeOrder(session.userId, parsed.data);
    return Response.json({ order });
  } catch (e) {
    if (e instanceof OrderError) {
      return Response.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }
}
