"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, FileText, User, CircleUserRound, LogOut } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import styles from "./HeaderNav.module.css";

// 검색 + 유틸 아이콘(견적서·마이페이지·로그인·회원가입) 묶음.
// 셸 페이지에서는 콘텐츠 우측 상단, 그 외 페이지에서는 헤더 바 오른쪽에 놓인다.
export default function HeaderNav() {
  const { totalCount } = useCart();
  const { isLoggedIn, logout } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");
  // 모바일: 돋보기 아이콘 탭 시 검색창을 펼친다 (데스크톱은 항상 펼침)
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  // 펼쳐진 상태에서 바깥(다른 버튼 포함)을 클릭하거나 ESC를 누르면 접는다
  useEffect(() => {
    if (!searchOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (formRef.current?.contains(target) || toggleRef.current?.contains(target))
        return;
      setSearchOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
  };

  return (
    <nav className={styles.nav}>
      <button
        ref={toggleRef}
        type="button"
        className={styles.searchToggle}
        onClick={() => setSearchOpen((o) => !o)}
        aria-label="검색 열기"
        aria-expanded={searchOpen}
        title="검색"
      >
        <Search size={20} strokeWidth={1.25} />
      </button>
      <form
        ref={formRef}
        className={`${styles.search} ${searchOpen ? styles.searchOpen : ""}`}
        onSubmit={handleSearch}
        role="search"
      >
        <input
          ref={inputRef}
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
          <Search size={18} strokeWidth={1.25} />
        </button>
      </form>
      <Link href="/quote" className={styles.navLink} aria-label="견적서" title="견적서">
        <FileText size={20} strokeWidth={1.25} />
        {totalCount > 0 && <span className={styles.badge}>{totalCount}</span>}
      </Link>
      <Link
        href="/mypage/orders"
        className={styles.navLink}
        aria-label="마이페이지"
        title="마이페이지"
      >
        <CircleUserRound size={20} strokeWidth={1.25} />
      </Link>
      {isLoggedIn ? (
        <button
          type="button"
          onClick={() => {
            logout();
            router.push("/");
          }}
          className={`${styles.navLink} ${styles.navButton}`}
          aria-label="로그아웃"
          title="로그아웃"
        >
          <LogOut size={20} strokeWidth={1.25} />
        </button>
      ) : (
        <>
          <Link
            href="/login"
            className={styles.navLink}
            aria-label="로그인"
            title="로그인"
          >
            <User size={20} strokeWidth={1.25} />
          </Link>
          <Link href="/signup" className={styles.businessLink}>
            회원가입
          </Link>
        </>
      )}
    </nav>
  );
}
