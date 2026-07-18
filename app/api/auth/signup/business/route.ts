import { businessSignupSchema } from "@/lib/schemas";
import { signupBusiness, AuthError } from "@/server/auth/service";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = businessSignupSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "입력값을 확인해주세요.", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  try {
    const user = await signupBusiness(parsed.data);
    return Response.json({ user }, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) {
      return Response.json({ error: e.message, code: e.code }, { status: 409 });
    }
    throw e;
  }
}
