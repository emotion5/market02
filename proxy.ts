import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/server/auth/session";

// Next 16: 예전 middleware = 지금 proxy. (node_modules/next/dist/docs/.../16-proxy.md)
// 여기서는 "낙관적(optimistic) 접근 제어"만 한다 — 세션 쿠키의 서명·역할만 보고
// 빠르게 리다이렉트. 최종 인가(회원상태·권한 재확인)는 route handler / server 레이어가 담당.
// (Next 지침: proxy 를 완전한 세션·인가 솔루션으로 쓰지 말 것)
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  // 관리자 영역: ADMIN 만
  if (pathname.startsWith("/admin")) {
    if (!session) return redirectToLogin(request);
    if (session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // 마이페이지: 로그인 필요
  if (pathname.startsWith("/mypage")) {
    if (!session) return redirectToLogin(request);
  }

  return NextResponse.next();
}

function redirectToLogin(request: NextRequest) {
  const url = new URL("/login", request.url);
  url.searchParams.set("redirect", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/mypage/:path*"],
};
