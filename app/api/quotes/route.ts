import { getSessionUser } from "@/lib/session";
import { issueQuote, listUserQuotes, QuoteError } from "@/server/quotes/service";
import { quoteDraftSchema } from "@/lib/schemas";

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const quotes = await listUserQuotes(session.userId);
  return Response.json({ quotes });
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const parsed = quoteDraftSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "입력값을 확인해주세요.", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  try {
    const number = await issueQuote(session.userId, parsed.data);
    return Response.json({ number });
  } catch (e) {
    if (e instanceof QuoteError) {
      return Response.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }
}
