import { getAdmin } from "@/lib/admin-guard";
import { updateProductBasics } from "@/server/catalog/admin";
import { productBasicsSchema } from "@/lib/schemas";

// 상품 목록에서 대표 항목(상품명·카테고리·대표가·상태)만 인라인 저장.
// 설명·요약·고시정보 등은 상세 수정화면(PATCH /api/admin/products/[id])에서.
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
  const parsed = productBasicsSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "입력값을 확인해주세요.", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const ok = await updateProductBasics(id, parsed.data);
  if (!ok) {
    return Response.json({ error: "상품을 찾을 수 없습니다." }, { status: 404 });
  }
  return Response.json({ ok: true });
}
