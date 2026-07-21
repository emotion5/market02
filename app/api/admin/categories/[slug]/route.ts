import { getAdmin } from "@/lib/admin-guard";
import { updateCategory, deleteCategory } from "@/server/catalog/admin";
import { categoryUpdateSchema } from "@/lib/schemas";

// 카테고리 표시명·순서 수정 (slug 는 불변)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const admin = await getAdmin();
  if (!admin) {
    return Response.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  const { slug } = await params;
  const body = await request.json().catch(() => null);
  const parsed = categoryUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." },
      { status: 400 },
    );
  }
  const result = await updateCategory(decodeURIComponent(slug), parsed.data);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  return Response.json({ ok: true });
}

// 카테고리 삭제 (소속 상품이 없을 때만)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const admin = await getAdmin();
  if (!admin) {
    return Response.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  const { slug } = await params;
  const result = await deleteCategory(decodeURIComponent(slug));
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  return Response.json({ ok: true });
}
