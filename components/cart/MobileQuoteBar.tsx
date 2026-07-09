"use client";

import { useEffect, useState } from "react";
import { ChevronUp, X } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";
import QuotePanel from "./QuotePanel";
import styles from "./MobileQuoteBar.module.css";

// 모바일 전용: 담긴 상품이 있을 때 하단에 요약 바가 따라다니고,
// 탭하면 데스크톱 좌측 패널(QuotePanel)을 바텀시트로 올려 보여준다.
export default function MobileQuoteBar() {
  const { totalCount, totalPrice } = useCart();
  const [open, setOpen] = useState(false);

  // 시트가 열려 있는 동안 배경 스크롤 잠금 + ESC로 닫기
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (totalCount === 0) return null;

  return (
    <>
      {open && (
        <div className={styles.backdrop} onClick={() => setOpen(false)}>
          <div
            className={styles.sheet}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="견적서"
          >
            <div className={styles.handle}>
              <span className={styles.grip} aria-hidden />
              <button
                type="button"
                className={styles.close}
                onClick={() => setOpen(false)}
                aria-label="닫기"
              >
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>
            <QuotePanel className={styles.sheetPanel} />
          </div>
        </div>
      )}

      <button
        type="button"
        className={styles.bar}
        onClick={() => setOpen(true)}
        aria-label="견적서 열기"
      >
        <span className={styles.barLeft}>
          <span className={styles.barCount}>{totalCount}</span>
          <span>견적서</span>
        </span>
        <span className={styles.barRight}>
          <strong>{formatPrice(totalPrice)}</strong>
          <ChevronUp size={18} strokeWidth={2} />
        </span>
      </button>
    </>
  );
}
