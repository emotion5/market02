import { getAdmin } from "@/lib/admin-guard";
import { listPendingBusinesses } from "@/server/auth/service";

export async function GET() {
  const admin = await getAdmin();
  if (!admin) {
    return Response.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  const members = await listPendingBusinesses();
  return Response.json({ members });
}
