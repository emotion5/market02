import { getAdmin } from "@/lib/admin-guard";
import { rejectBusiness } from "@/server/auth/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdmin();
  if (!admin) {
    return Response.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const reason = typeof body?.reason === "string" ? body.reason : "";
  await rejectBusiness(id, admin.id, reason);
  return Response.json({ ok: true });
}
