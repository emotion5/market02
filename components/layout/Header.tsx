"use client";

import Link from "next/link";
import { Search, ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import styles from "./Header.module.css";

export default function Header() {
  const { totalCount } = useCart();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          MMM MARKET
        </Link>
        <nav className={styles.nav}>
          <Link href="/products" className={styles.navLink}>
            전체 상품
          </Link>
          <button
            type="button"
            className={styles.navLink}
            aria-label="검색"
            title="검색"
          >
            <Search size={20} strokeWidth={1.75} />
          </button>
          <Link href="/cart" className={styles.navLink} aria-label="견적서" title="견적서">
            <ShoppingCart size={20} strokeWidth={1.75} />
            {totalCount > 0 && <span className={styles.badge}>{totalCount}</span>}
          </Link>
        </nav>
      </div>
    </header>
  );
}
