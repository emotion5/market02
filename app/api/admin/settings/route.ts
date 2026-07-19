import { getAdmin } from "@/lib/admin-guard";
import { updateSiteSettings } from "@/server/settings/service";
import { siteSettingsSchema } from "@/lib/schemas";

export async function PUT(request: Request) {
  const admin = await getAdmin();
  if (!admin) {
    return Response.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const parsed = siteSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "입력값을 확인해주세요.", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  await updateSiteSettings(parsed.data);
  return Response.json({ ok: true });
}
