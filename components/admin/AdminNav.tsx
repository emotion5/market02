"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "@/app/admin/admin.module.css";

// 어드민 좌측 메뉴. 활성 항목 하이라이트를 위해 client 컴포넌트.
const ITEMS = [
  { href: "/admin", label: "대시보드", exact: true },
  { href: "/admin/members", label: "회원 관리" },
  // 상품 관리는 하위 편성 페이지에선 자식(홈 진열 편성)만 강조되도록 제외 처리
  { href: "/admin/products", label: "상품 관리", exclude: ["/admin/products/featured"] },
  { href: "/admin/products/featured", label: "홈 노출 편성", sub: true },
  { href: "/admin/categories", label: "카테고리 관리" },
  { href: "/admin/orders", label: "주문 관리" },
  { href: "/admin/quotes", label: "견적서 관리" },
  { href: "/admin/settings", label: "사이트 설정" },
];
const SOON = ["세금계산서"];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className={styles.nav}>
      {ITEMS.map((it) => {
        // 대시보드(/admin)는 모든 어드민 경로의 접두사라 정확 일치로 판정.
        // exclude 가 있으면 그 하위 경로에선 부모를 비활성(자식만 강조).
        const active =
          "exact" in it && it.exact
            ? pathname === it.href
            : pathname.startsWith(it.href) &&
              !("exclude" in it &&
                it.exclude?.some((e) => pathname.startsWith(e)));
        const isSub = "sub" in it && it.sub;
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`${styles.navItem} ${isSub ? styles.navSub : ""} ${
              active ? styles.navActive : ""
            }`}
          >
            {isSub ? `↳ ${it.label}` : it.label}
          </Link>
        );
      })}
      {SOON.map((label) => (
        <span key={label} className={`${styles.navItem} ${styles.navDisabled}`}>
          {label} (준비중)
        </span>
      ))}
    </nav>
  );
}
