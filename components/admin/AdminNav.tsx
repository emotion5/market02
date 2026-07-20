"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "@/app/admin/admin.module.css";

// 어드민 좌측 메뉴. 활성 항목 하이라이트를 위해 client 컴포넌트.
const ITEMS = [
  { href: "/admin", label: "대시보드", exact: true },
  { href: "/admin/members", label: "회원 관리" },
  { href: "/admin/products", label: "상품 관리" },
  { href: "/admin/categories", label: "카테고리 노출" },
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
        // 대시보드(/admin)는 모든 어드민 경로의 접두사라 정확 일치로 판정
        const active =
          "exact" in it && it.exact
            ? pathname === it.href
            : pathname.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`${styles.navItem} ${active ? styles.navActive : ""}`}
          >
            {it.label}
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
