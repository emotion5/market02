import type { Metadata } from "next";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import ConditionalFooter from "@/components/layout/ConditionalFooter";
import { getSiteSettings } from "@/lib/settings";
import "./fonts/pretendard.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "MMM MARKET",
  description: "인테리어 자재 온라인 스토어",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 푸터는 전 페이지 공통이라 여기(루트)에서 사업자 정보를 읽어 주입한다.
  const settings = await getSiteSettings();
  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          <CartProvider>
            {/* 헤더는 라우트 그룹별로 다르게 배치된다:
                (with-quote)는 컬럼에 직접, (plain)은 헤더 바로 */}
            <main>{children}</main>
            <ConditionalFooter settings={settings} />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
