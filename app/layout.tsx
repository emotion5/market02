import type { Metadata } from "next";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import Footer from "@/components/layout/Footer";
import "./fonts/pretendard.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "MMM MARKET",
  description: "인테리어 자재 온라인 스토어",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          <CartProvider>
            {/* 헤더는 라우트 그룹별로 다르게 배치된다:
                (with-quote)는 컬럼에 직접, (plain)은 헤더 바로 */}
            <main>{children}</main>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
