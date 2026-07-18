"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

// 어드민(/admin)에서는 쇼핑몰 푸터를 숨긴다. 그 외 모든 페이지엔 그대로 노출.
export default function ConditionalFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return <Footer />;
}
