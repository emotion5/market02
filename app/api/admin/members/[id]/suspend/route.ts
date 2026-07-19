import { getAdmin } from "@/lib/admin-guard";
import { suspendMember } from "@/server/auth/service";

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
  const result = await suspendMember(id, admin.id, reason);
  if (result === "not_found") {
    return Response.json({ error: "회원을 찾을 수 없습니다." }, { status: 404 });
  }
  if (result === "invalid_state") {
    return Response.json(
      { error: "활성 회원만 정지할 수 있습니다." },
      { status: 409 },
    );
  }
  return Response.json({ ok: true });
}
