"use client";

import { useState } from "react";
import styles from "./ProductGallery.module.css";

const MAX_THUMBS = 6;

// 상세 이미지 갤러리: 큰 메인 이미지 + 하단 썸네일 1행(최대 6장 균등 배치, 스크롤 없음).
// 이미지가 1장뿐이면 썸네일 없이 이미지만 보여준다.
export default function ProductGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [active, setActive] = useState(0);

  const list = (images.length > 0 ? images : [""]).slice(0, MAX_THUMBS);
  const current = list[Math.min(active, list.length - 1)];

  return (
    <div className={styles.gallery}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={current} alt={alt} className={styles.main} />

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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className={styles.thumbImg} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
