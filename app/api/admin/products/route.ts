import { getAdmin } from "@/lib/admin-guard";
import { createProduct } from "@/server/catalog/admin";
import { productUpdateSchema } from "@/lib/schemas";

// 신규 상품 등록 (기본 옵션 1개 자동 생성, 이미지는 placeholder)
export async function POST(request: Request) {
  const admin = await getAdmin();
  if (!admin) {
    return Response.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const parsed = productUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "입력값을 확인해주세요.", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const d = parsed.data;
  const id = await createProduct({
    name: d.name,
    categorySlug: d.categorySlug,
    summary: d.summary ?? null,
    description: d.description,
    price: d.price,
    isActive: d.isActive,
  });
  return Response.json({ id }, { status: 201 });
}
