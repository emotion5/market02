import { getAdmin } from "@/lib/admin-guard";
import { updateProductOptions } from "@/server/catalog/admin";
import { productOptionsSchema } from "@/lib/schemas";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdmin();
  if (!admin) {
    return Response.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = productOptionsSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "입력값을 확인해주세요.", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const ok = await updateProductOptions(id, parsed.data);
  if (!ok) {
    return Response.json({ error: "상품을 찾을 수 없습니다." }, { status: 404 });
  }
  return Response.json({ ok: true });
}
