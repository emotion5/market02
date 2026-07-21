import { getAdmin } from "@/lib/admin-guard";
import { updateProductFields } from "@/server/catalog/admin";
import { productUpdateSchema } from "@/lib/schemas";

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
  const parsed = productUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "입력값을 확인해주세요.", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const d = parsed.data;
  const ok = await updateProductFields(id, {
    name: d.name,
    categorySlug: d.categorySlug,
    summary: d.summary ?? null,
    description: d.description,
    price: d.price,
    isActive: d.isActive,
    modelName: d.modelName?.trim() || null,
    origin: d.origin?.trim() || null,
    maker: d.maker?.trim() || null,
    dimensions: d.dimensions?.trim() || null,
    material: d.material?.trim() || null,
    colorInfo: d.colorInfo?.trim() || null,
    composition: d.composition?.trim() || null,
    certInfo: d.certInfo?.trim() || null,
  });
  if (!ok) {
    return Response.json({ error: "상품을 찾을 수 없습니다." }, { status: 404 });
  }
  return Response.json({ ok: true });
}
