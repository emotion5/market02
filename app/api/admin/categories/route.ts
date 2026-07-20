import { getAdmin } from "@/lib/admin-guard";
import { setCategoryVisibility } from "@/server/catalog/admin";
import { categoryVisibilitySchema } from "@/lib/schemas";

export async function PUT(request: Request) {
  const admin = await getAdmin();
  if (!admin) {
    return Response.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const parsed = categoryVisibilitySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "입력값을 확인해주세요.", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  await setCategoryVisibility(parsed.data.categories);
  return Response.json({ ok: true });
}
