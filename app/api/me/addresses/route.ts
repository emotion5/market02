import { getSessionUser } from "@/lib/session";
import { listAddresses, createAddress } from "@/server/address/service";
import { addressCreateSchema } from "@/lib/schemas";

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const addresses = await listAddresses(session.userId);
  return Response.json({ addresses });
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const parsed = addressCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "입력값을 확인해주세요.", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  await createAddress(session.userId, parsed.data);
  const addresses = await listAddresses(session.userId);
  return Response.json({ addresses }, { status: 201 });
}
