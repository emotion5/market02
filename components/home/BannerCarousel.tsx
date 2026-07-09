"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./BannerCarousel.module.css";

interface Slide {
  key: string;
  theme: "brand" | "product";
  eyebrow: string;
  title: string;
  desc: string;
  note?: string;
  cta: { label: string; href: string };
  image?: string;
  imageAlt?: string;
  opaqueWhite?: boolean; // 흰 배경 사진이면 multiply로 배경에 녹여줌 (투명 PNG는 불필요)
}

// 메인 상단 롤링 배너. 슬라이드는 아래 배열만 늘리면 자동으로 추가된다.
const SLIDES: Slide[] = [
  {
    key: "brand",
    theme: "brand",
    eyebrow: "MMM MARKET",
    title: "인테리어 자재, 필요한 만큼 골라 견적까지",
    desc: "수전부터 바닥재·강마루·장판·하드웨어·서랍까지. 카테고리별 추천 상품을 담아 바로 견적서를 만들어 보세요.",
    cta: { label: "전체 상품 보기", href: "/products" },
    image: "/images/products/hardware/hardware-0005.jpg",
    imageAlt: "스테인리스 수건걸이",
    opaqueWhite: true,
  },
  {
    key: "faucet-0004",
    theme: "product",
    eyebrow: "이 달의 추천 · 주방 수전",
    title: "설거지가 즐거워지는 클래식 풀다운 주방 수전",
    desc: "곡선형 스파우트에 헤드를 당겨 쓰는 풀다운 방식. 싱크 구석구석 물줄기가 닿아 설거지와 세척이 한결 편해집니다.",
    note: "132,000원부터",
    cta: { label: "제품 보러가기", href: "/products/faucet-0004" },
    image: "/images/products/faucet/faucet-0004.png",
    imageAlt: "클래식 풀다운 주방 수전",
  },
];

export default function BannerCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = SLIDES.length;

  const goTo = (i: number) => setIndex(((i % count) + count) % count);
  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  // 자동 롤링 (마우스 오버 시 일시정지)
  useEffect(() => {
    if (paused || count <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), 5000);
    return () => clearInterval(t);
  }, [index, paused, count]);

  // 모바일 스와이프
  const [touchX, setTouchX] = useState<number | null>(null);
  const onTouchEnd = (endX: number) => {
    if (touchX === null) return;
    const dx = endX - touchX;
    if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
    setTouchX(null);
  };

  return (
    <section
      className={styles.carousel}
      aria-label="프로모션 배너"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        className={styles.track}
        style={{ transform: `translateX(-${index * 100}%)` }}
        onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
        onTouchEnd={(e) => onTouchEnd(e.changedTouches[0].clientX)}
      >
        {SLIDES.map((slide) => (
          <div
            key={slide.key}
            className={`${styles.slide} ${
              slide.theme === "product" ? styles.product : styles.brand
            }`}
          >
            <div className={styles.body}>
              <p className={styles.eyebrow}>{slide.eyebrow}</p>
              <h2 className={styles.title}>{slide.title}</h2>
              <p className={styles.desc}>{slide.desc}</p>
              {slide.note && <p className={styles.note}>{slide.note}</p>}
              <Link href={slide.cta.href} className={styles.cta}>
                {slide.cta.label}
              </Link>
            </div>
            {slide.image && (
              <div className={styles.media}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.image}
                  alt={slide.imageAlt ?? ""}
                  className={slide.opaqueWhite ? styles.multiply : undefined}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowLeft}`}
            onClick={prev}
            aria-label="이전 배너"
          >
            <ChevronLeft size={20} strokeWidth={2} />
          </button>
          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowRight}`}
            onClick={next}
            aria-label="다음 배너"
          >
            <ChevronRight size={20} strokeWidth={2} />
          </button>

          <div
            className={`${styles.dots} ${
              SLIDES[index]?.theme === "product" ? styles.dotsLight : ""
            }`}
            role="tablist"
            aria-label="배너 선택"
          >
            {SLIDES.map((slide, i) => (
              <button
                key={slide.key}
                type="button"
                className={`${styles.dot} ${i === index ? styles.dotActive : ""}`}
                onClick={() => goTo(i)}
                aria-label={`${i + 1}번 배너`}
                aria-selected={i === index}
                role="tab"
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
