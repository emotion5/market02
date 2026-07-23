import { getAdmin } from "@/lib/admin-guard";
import { setProductActive } from "@/server/catalog/admin";
import { productActiveSchema } from "@/lib/schemas";

// 상품 목록에서 활성(쇼핑몰 노출) 상태를 바로 켜고 끈다.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdmin();
  if (!admin) {
    return Response.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = productActiveSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "입력값을 확인해주세요.", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const ok = await setProductActive(id, parsed.data.active);
  if (!ok) {
    return Response.json({ error: "상품을 찾을 수 없습니다." }, { status: 404 });
  }
  return Response.json({ ok: true });
}
