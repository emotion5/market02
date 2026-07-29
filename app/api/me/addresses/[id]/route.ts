import { getSessionUser } from "@/lib/session";
import {
  deleteAddress,
  setDefaultAddress,
  listAddresses,
} from "@/server/address/service";

// 배송지 삭제
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionUser();
  if (!session) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { id } = await params;
  await deleteAddress(session.userId, id);
  const addresses = await listAddresses(session.userId);
  return Response.json({ addresses });
}

// 기본 배송지 설정 (body: { action: "default" })
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionUser();
  if (!session) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  if (body?.action !== "default") {
    return Response.json({ error: "지원하지 않는 요청입니다." }, { status: 400 });
  }
  const { id } = await params;
  await setDefaultAddress(session.userId, id);
  const addresses = await listAddresses(session.userId);
  return Response.json({ addresses });
}
