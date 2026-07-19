import { getAdmin } from "@/lib/admin-guard";
import { reactivateMember } from "@/server/auth/service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdmin();
  if (!admin) {
    return Response.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  const { id } = await params;
  const result = await reactivateMember(id);
  if (result === "not_found") {
    return Response.json({ error: "회원을 찾을 수 없습니다." }, { status: 404 });
  }
  if (result === "invalid_state") {
    return Response.json(
      { error: "정지 상태인 회원만 해제할 수 있습니다." },
      { status: 409 },
    );
  }
  return Response.json({ ok: true });
}
