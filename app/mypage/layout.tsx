"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./layout.module.css";

const MENU = [
  { href: "/mypage/orders", label: "결제내역" },
  { href: "/mypage/tax-invoices", label: "세금계산서 내역" },
  { href: "/mypage/addresses", label: "배송지 관리" },
  { href: "/mypage/profile", label: "회원정보 수정" },
  { href: "/mypage/withdraw", label: "회원 탈퇴" },
];

export default function MyPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>마이페이지</h1>
      <div className={styles.layout}>
        <nav className={styles.sidebar} aria-label="마이페이지 메뉴">
          <ul>
            {MENU.map((m) => {
              const active = pathname === m.href;
              return (
                <li key={m.href}>
                  <Link
                    href={m.href}
                    className={`${styles.menuLink} ${
                      active ? styles.active : ""
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    {m.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
