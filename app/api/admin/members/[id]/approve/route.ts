import { getAdmin } from "@/lib/admin-guard";
import { approveBusiness } from "@/server/auth/service";
import { businessApproveSchema } from "@/lib/schemas";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdmin();
  if (!admin) {
    return Response.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  const { id } = await params;

  // 승인 시 관리자가 등록증 보고 확정한 사업자 정보를 함께 받는다.
  const body = await request.json().catch(() => null);
  const parsed = businessApproveSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "입력값을 확인해주세요.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  await approveBusiness(id, admin.id, parsed.data);
  return Response.json({ ok: true });
}
