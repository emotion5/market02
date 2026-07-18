import { getAdmin } from "@/lib/admin-guard";
import { approveBusiness } from "@/server/auth/service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdmin();
  if (!admin) {
    return Response.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  const { id } = await params;
  await approveBusiness(id, admin.id);
  return Response.json({ ok: true });
}
