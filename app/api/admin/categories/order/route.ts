import { getAdmin } from "@/lib/admin-guard";
import { reorderCategories } from "@/server/catalog/admin";
import { categoryReorderSchema } from "@/lib/schemas";

// 카테고리 표시 순서 일괄 저장. (정적 세그먼트 /order 가 [slug] 보다 우선한다)
export async function PUT(request: Request) {
  const admin = await getAdmin();
  if (!admin) {
    return Response.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const parsed = categoryReorderSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." },
      { status: 400 },
    );
  }
  await reorderCategories(parsed.data.slugs);
  return Response.json({ ok: true });
}
