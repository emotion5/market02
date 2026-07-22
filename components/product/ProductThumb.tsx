"use client";

import { thumbUrl, mediumUrl } from "@/lib/utils";

// 상품 이미지 <img>. 표시 크기에 맞는 파생본을 우선 로드하고, 파일이 없으면
// (과거 데이터) onError 로 원본(master)으로 폴백한다. onError 핸들러 때문에
// 클라이언트 컴포넌트로 분리한다(서버·클라이언트 컴포넌트 양쪽에서 재사용).
//   size="medium" (기본, 600px) : 카드·목록(≥100px 표시)
//   size="thumb"  (96px)         : 소형 목록 썸네일(견적/주문 라인 등 ~40-60px)
export default function ProductThumb({
  src,
  alt,
  className,
  size = "medium",
}: {
  src: string;
  alt: string;
  className?: string;
  size?: "thumb" | "medium";
}) {
  const derived = size === "thumb" ? thumbUrl(src) : mediumUrl(src);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={derived}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={(e) => {
        const img = e.currentTarget;
        if (img.dataset.fallback) return;
        img.dataset.fallback = "1";
        img.src = src;
      }}
    />
  );
}
