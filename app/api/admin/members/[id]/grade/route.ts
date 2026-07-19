import { getAdmin } from "@/lib/admin-guard";
import { setMemberGrade } from "@/server/auth/service";

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
  const grade = body?.grade;
  if (grade !== "GENERAL" && grade !== "WHOLESALE") {
    return Response.json({ error: "등급 값이 올바르지 않습니다." }, { status: 400 });
  }
  const result = await setMemberGrade(id, grade);
  if (result === "not_found") {
    return Response.json({ error: "회원을 찾을 수 없습니다." }, { status: 404 });
  }
  if (result === "invalid_state") {
    return Response.json(
      { error: "활성·정지 회원만 등급을 변경할 수 있습니다." },
      { status: 409 },
    );
  }
  return Response.json({ ok: true });
}
