"use client";

import { useState } from "react";
import { mediumUrl } from "@/lib/utils";
import styles from "./ProductGallery.module.css";

const MAX_THUMBS = 6;
const PLACEHOLDER = "/images/placeholder.svg";

// 상세 이미지 갤러리: 큰 메인 이미지 + 하단 썸네일 1행(최대 6장 균등 배치, 스크롤 없음).
// 이미지가 1장뿐이면 썸네일 없이 이미지만 보여준다.
export default function ProductGallery({
  images,
  alt,
  fallbackSrc,
}: {
  images: string[];
  alt: string;
  fallbackSrc?: string; // 대표이미지 — 갤러리 로드 실패 시 우선 폴백(그것도 실패하면 placeholder)
}) {
  const [active, setActive] = useState(0);

  const list = (images.length > 0 ? images : [""]).slice(0, MAX_THUMBS);
  const current = list[Math.min(active, list.length - 1)];

  return (
    <div className={styles.gallery}>
      {/* 폴백 체인: 깨진 갤러리 이미지 → 대표이미지(fallbackSrc) → placeholder */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={current || fallbackSrc || PLACEHOLDER}
        alt={alt}
        className={styles.main}
        onError={(e) => {
          const img = e.currentTarget;
          const step = img.dataset.fallback;
          // 1단계: 대표이미지로 폴백(아직 시도 안 했고, 유효하면)
          if (!step && fallbackSrc) {
            img.dataset.fallback = "rep";
            img.src = fallbackSrc;
            return;
          }
          // 2단계: 대표이미지도 실패 → placeholder (최종)
          if (step !== "ph") {
            img.dataset.fallback = "ph";
            img.src = PLACEHOLDER;
          }
        }}
      />

      {list.length > 1 && (
        <ul
          className={styles.thumbs}
          style={{ gridTemplateColumns: `repeat(${list.length}, 1fr)` }}
        >
          {list.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                className={`${styles.thumb} ${
                  i === active ? styles.thumbActive : ""
                }`}
                onClick={() => setActive(i)}
                aria-label={`이미지 ${i + 1} 보기`}
                aria-pressed={i === active}
              >
                {/* 중간 파생본(.med.webp) 우선, 없으면 onError 로 원본 폴백 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mediumUrl(src)}
                  alt=""
                  className={styles.thumbImg}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (img.dataset.fallback) return;
                    img.dataset.fallback = "1";
                    img.src = src;
                  }}
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
