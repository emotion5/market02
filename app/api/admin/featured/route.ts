import { getAdmin } from "@/lib/admin-guard";
import { setFeatured } from "@/server/catalog/admin";
import { featuredUpdateSchema } from "@/lib/schemas";

export async function PUT(request: Request) {
  const admin = await getAdmin();
  if (!admin) {
    return Response.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const parsed = featuredUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "입력값을 확인해주세요.", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const ok = await setFeatured(parsed.data.categorySlug, parsed.data.productIds);
  if (!ok) {
    return Response.json({ error: "카테고리를 찾을 수 없습니다." }, { status: 404 });
  }
  return Response.json({ ok: true });
}
