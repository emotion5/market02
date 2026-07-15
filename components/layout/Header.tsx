"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, FileText, User, CircleUserRound } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import styles from "./Header.module.css";

export default function Header() {
  const { totalCount } = useCart();
  const router = useRouter();
  const [query, setQuery] = useState("");
  // 모바일: 돋보기 아이콘 탭 시 검색창을 펼친다 (데스크톱은 항상 펼침)
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  // 헤더 높이를 CSS 변수(--header-h)로 노출 → 아래 카테고리 바가 헤더 밑에 딱 붙어 고정된다.
  // (모바일 검색 펼침 등으로 높이가 바뀌면 자동 갱신)
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const setVar = () =>
      document.documentElement.style.setProperty(
        "--header-h",
        `${el.offsetHeight}px`,
      );
    setVar();
    const ro = new ResizeObserver(setVar);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
    <header ref={headerRef} className={styles.header}>
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
          <Link href="/login" className={styles.navLink} aria-label="로그인" title="로그인">
            <User size={20} strokeWidth={1.25} />
          </Link>
          <Link href="/signup" className={styles.businessLink}>
            회원가입
          </Link>
        </nav>
      </div>
    </header>
  );
}
