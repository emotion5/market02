"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "@/app/admin/admin.module.css";

// 어드민 좌측 메뉴. 활성 항목 하이라이트를 위해 client 컴포넌트.
const ITEMS = [
  { href: "/admin/members", label: "회원 승인" },
  { href: "/admin/products", label: "상품 관리" },
];
const SOON = ["주문 관리", "세금계산서"];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className={styles.nav}>
      {ITEMS.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className={`${styles.navItem} ${
            pathname.startsWith(it.href) ? styles.navActive : ""
          }`}
        >
          {it.label}
        </Link>
      ))}
      {SOON.map((label) => (
        <span key={label} className={`${styles.navItem} ${styles.navDisabled}`}>
          {label} (준비중)
        </span>
      ))}
    </nav>
  );
}
