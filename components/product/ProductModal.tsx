"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import styles from "./ProductModal.module.css";

// 상품 상세를 목록 위에 오버랩하는 모달. 인터셉팅 라우트로 열리며,
// 배경 클릭 / ESC / 닫기 버튼 → router.back()으로 URL과 함께 닫힌다.
export default function ProductModal({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => router.back(), [router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    // 모달 열린 동안 배경 스크롤 잠금
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [close]);

  return (
    <div
      ref={overlayRef}
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === overlayRef.current) close();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className={styles.dialog}>
        <button
          type="button"
          className={styles.close}
          onClick={close}
          aria-label="닫기"
        >
          <X size={20} strokeWidth={1.75} />
        </button>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
