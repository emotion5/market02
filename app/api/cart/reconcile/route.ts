import { getSessionUser } from "@/lib/session";
import { reconcileCart } from "@/server/cart/service";
import { cartReconcileSchema } from "@/lib/schemas";
import type { CartItem } from "@/lib/types";

// 담긴 항목을 현재 DB와 대조한다. 로그인은 선택(비회원 장바구니도 대조 가능,
// 등급가는 로그인 사용자에게만 반영).
export async function POST(request: Request) {
  const session = await getSessionUser();
  const body = await request.json().catch(() => null);
  const parsed = cartReconcileSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "입력값을 확인해주세요." }, { status: 400 });
  }
  const result = await reconcileCart(
    session?.userId ?? null,
    parsed.data.items as CartItem[],
  );
  return Response.json(result);
}
