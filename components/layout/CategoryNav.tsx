"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { NavCategory } from "@/lib/types";
import styles from "./CategoryNav.module.css";

// 가로 스크롤 칩 바. 카테고리가 수십 개로 늘어도 한 줄을 유지하며,
// 모바일은 스와이프, 데스크톱은 좌우 화살표로 탐색한다.
// 노출 목록(showInNav=true)은 서버(레이아웃)에서 받아온다.
export default function CategoryNav({
  categories,
}: {
  categories: NavCategory[];
}) {
  const pathname = usePathname();
  const scrollerRef = useRef<HTMLDivElement>(null);
  // 홈에서 스크롤 위치로 정해지는 활성 섹션(스크롤 스파이 결과)
  const [spyActive, setSpyActive] = useState<string | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  // 표시할 활성 칩: 홈 → 스크롤 스파이, 카테고리 페이지 → 해당 slug, 그 외 → 없음
  const active =
    pathname === "/"
      ? spyActive
      : pathname.startsWith("/category/")
        ? pathname.split("/")[2] ?? null
        : null;

  // 홈에서는 스크롤 위치에 따라 화면 상단의 카테고리 섹션을 활성화(스크롤 스파이)
  useEffect(() => {
    if (pathname !== "/") return;
    const sections = categories
      .filter((c) => c.onHome)
      .map((c) => document.getElementById(`category-${c.slug}`))
      .filter((el): el is HTMLElement => !!el);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0])
          setSpyActive(visible[0].target.id.replace("category-", ""));
      },
      { rootMargin: "-120px 0px -55% 0px", threshold: 0 },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [pathname, categories]);

  // 활성 칩을 스크롤 바 안에서 가운데로 자동 이동
  useEffect(() => {
    if (!active) return;
    const el = scrollerRef.current?.querySelector<HTMLElement>(
      `[data-key="${active}"]`,
    );
    el?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [active]);

  // 좌우 끝 도달 여부(화살표/페이드 토글)
  useEffect(() => {
    const s = scrollerRef.current;
    if (!s) return;
    const update = () => {
      setAtStart(s.scrollLeft <= 1);
      setAtEnd(s.scrollLeft + s.clientWidth >= s.scrollWidth - 1);
    };
    update();
    s.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      s.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // 마우스 휠(세로)을 칩 바 가로 스크롤로 변환. 단, 양 끝에 닿으면
  // 페이지 세로 스크롤로 양보해 답답하지 않게 한다.
  useEffect(() => {
    const s = scrollerRef.current;
    if (!s) return;
    const onWheel = (e: WheelEvent) => {
      if (s.scrollWidth <= s.clientWidth) return; // 스크롤할 게 없음
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; // 이미 가로 제스처
      const atLeftEdge = s.scrollLeft <= 0;
      const atRightEdge = s.scrollLeft + s.clientWidth >= s.scrollWidth - 1;
      if ((e.deltaY < 0 && atLeftEdge) || (e.deltaY > 0 && atRightEdge)) return;
      e.preventDefault();
      s.scrollLeft += e.deltaY;
    };
    s.addEventListener("wheel", onWheel, { passive: false });
    return () => s.removeEventListener("wheel", onWheel);
  }, []);

  const scrollByStep = (dir: number) =>
    scrollerRef.current?.scrollBy({ left: dir * 260, behavior: "smooth" });

  return (
    <nav
      className={`${styles.nav} ${atStart ? styles.atStart : ""} ${
        atEnd ? styles.atEnd : ""
      }`}
      aria-label="카테고리"
    >
      <div className={styles.bar}>
        <button
          type="button"
          className={`${styles.arrow} ${styles.arrowLeft} ${
            atStart ? styles.arrowHidden : ""
          }`}
          onClick={() => scrollByStep(-1)}
          aria-label="이전 카테고리"
          tabIndex={atStart ? -1 : 0}
        >
          <ChevronLeft size={18} strokeWidth={2} />
        </button>

        <div className={styles.scroller} ref={scrollerRef}>
          <ul className={styles.list}>
            {categories.map((category) => (
              <li key={category.slug} data-key={category.slug}>
                <Link
                  href={
                    category.onHome
                      ? `/#category-${category.slug}`
                      : `/category/${category.slug}`
                  }
                  className={`${styles.chip} ${
                    active === category.slug ? styles.active : ""
                  }`}
                >
                  {/* 기본은 영문, hover 시 영문이 위로 사라지고 한글이 올라옴 */}
                  <span className={styles.label} aria-hidden="true">
                    <span className={styles.labelEn}>{category.en}</span>
                    <span className={styles.labelKo}>{category.name}</span>
                  </span>
                  {/* 스크린리더/접근성용: 한글 명칭 */}
                  <span className={styles.srOnly}>{category.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          className={`${styles.arrow} ${styles.arrowRight} ${
            atEnd ? styles.arrowHidden : ""
          }`}
          onClick={() => scrollByStep(1)}
          aria-label="다음 카테고리"
          tabIndex={atEnd ? -1 : 0}
        >
          <ChevronRight size={18} strokeWidth={2} />
        </button>
      </div>
    </nav>
  );
}
