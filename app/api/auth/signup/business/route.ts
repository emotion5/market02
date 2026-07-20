import { businessSignupSchema } from "@/lib/schemas";
import { signupBusiness, AuthError } from "@/server/auth/service";
import { uploadPrivate, deletePrivate } from "@/server/storage";

// 사업자등록증 허용 형식 (스캔 이미지 또는 PDF)
const LICENSE_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};
const MAX_LICENSE_BYTES = 10 * 1024 * 1024; // 10MB

// 가입 필드 + 사업자등록증 파일을 한 요청(multipart/form-data)으로 받는다.
// 파일을 별도 공개 엔드포인트로 올리지 않으므로, 검증을 통과한 가입에서만 저장된다
// (비로그인 공개 업로드 창구 없음 → 고아 파일·버킷 남용 방지).
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) {
    return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  // 텍스트 필드 검증. licenseFileUrl 은 클라이언트가 보내지 않는다
  // (서버가 업로드 후 저장 키로 채운다 — 클라이언트가 임의 값을 넣지 못하게).
  const parsed = businessSignupSchema.safeParse({
    email: form.get("email"),
    password: form.get("password"),
    bizNo: form.get("bizNo"),
    company: form.get("company") || undefined,
  });
  if (!parsed.success) {
    return Response.json(
      { error: "입력값을 확인해주세요.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  // 사업자등록증 파일 검증
  const file = form.get("license");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json(
      { error: "사업자등록증 파일을 첨부해주세요." },
      { status: 400 },
    );
  }
  const ext = LICENSE_EXT[file.type];
  if (!ext) {
    return Response.json(
      { error: "이미지(jpg/png/webp) 또는 PDF 파일만 첨부할 수 있습니다." },
      { status: 400 },
    );
  }
  if (file.size > MAX_LICENSE_BYTES) {
    return Response.json(
      { error: "10MB 이하만 첨부할 수 있습니다." },
      { status: 400 },
    );
  }

  // 비공개 버킷(business-docs)에 업로드. DB 에는 저장 키만 보관하고,
  // 열람은 관리자 화면에서 만료되는 서명 URL 로만 가능(공개 URL 아님).
  const key = `licenses/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await uploadPrivate(key, buffer, file.type);

  try {
    const user = await signupBusiness({ ...parsed.data, licenseFileUrl: key });
    return Response.json({ user }, { status: 201 });
  } catch (e) {
    // 가입 실패(이메일·사업자번호 중복 등) 시 방금 올린 파일을 정리해 고아 파일을 남기지 않는다.
    await deletePrivate(key).catch(() => {});
    if (e instanceof AuthError) {
      return Response.json({ error: e.message, code: e.code }, { status: 409 });
    }
    throw e;
  }
}
