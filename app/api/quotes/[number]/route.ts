import { getSessionUser } from "@/lib/session";
import { getUserQuote } from "@/server/quotes/service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ number: string }> },
) {
  const session = await getSessionUser();
  if (!session) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { number } = await params;
  const quote = await getUserQuote(decodeURIComponent(number), session.userId);
  if (!quote) {
    return Response.json(
      { error: "견적서를 찾을 수 없습니다." },
      { status: 404 },
    );
  }
  return Response.json({ quote });
}
