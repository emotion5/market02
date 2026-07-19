import { getAdmin } from "@/lib/admin-guard";
import { performOrderAction } from "@/server/orders/admin";
import { orderActionSchema } from "@/lib/schemas";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderNo: string }> },
) {
  const admin = await getAdmin();
  if (!admin) {
    return Response.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  const { orderNo } = await params;
  const body = await request.json().catch(() => null);
  const parsed = orderActionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "입력값을 확인해주세요.", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const result = await performOrderAction(
    decodeURIComponent(orderNo),
    parsed.data.action,
    { courier: parsed.data.courier, trackingNumber: parsed.data.trackingNumber },
  );
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  return Response.json({ ok: true });
}
