"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, User, ClipboardList } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import styles from "./Header.module.css";

export default function Header() {
  const { totalCount } = useCart();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/brand/symbol.svg"
            alt="MMM MARKET"
            className={styles.logoImg}
          />
          <span className={styles.wordmark}>Made Make Material Market</span>
        </Link>
        <nav className={styles.nav}>
          <Link href="/products" className={styles.navLink}>
            전체 상품
          </Link>
          <form className={styles.search} onSubmit={handleSearch} role="search">
            <input
              type="search"
              className={styles.searchInput}
              placeholder="검색어를 입력해주세요"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="검색어"
            />
            <button
              type="submit"
              className={styles.searchButton}
              aria-label="검색"
              title="검색"
            >
              <Search size={18} strokeWidth={1.75} />
            </button>
          </form>
          <Link href="/cart" className={styles.navLink} aria-label="견적서" title="견적서">
            <ShoppingCart size={20} strokeWidth={1.75} />
            {totalCount > 0 && <span className={styles.badge}>{totalCount}</span>}
          </Link>
          <Link
            href="/mypage/orders"
            className={styles.navLink}
            aria-label="마이페이지"
            title="마이페이지"
          >
            <ClipboardList size={20} strokeWidth={1.75} />
          </Link>
          <Link href="/login" className={styles.navLink} aria-label="로그인" title="로그인">
            <User size={20} strokeWidth={1.75} />
          </Link>
          <Link href="/business-signup" className={styles.businessLink}>
            기업회원 가입
          </Link>
        </nav>
      </div>
    </header>
  );
}
