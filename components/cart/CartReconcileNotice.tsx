"use client";

import { formatPrice } from "@/lib/utils";
import type { CartReconcileNotice as Notice } from "@/hooks/useCartReconcile";
import styles from "./CartReconcileNotice.module.css";

// 정합성 대조 결과 안내 배너. 견적서 보기·결제 화면에서 재사용.
// 사라진 항목 / 가격이 바뀐 항목을 항목 단위로 알려준다.
export default function CartReconcileNotice({ notice }: { notice: Notice | null }) {
  if (!notice) return null;
  const { removed, priceChanged } = notice;
  if (!removed.length && !priceChanged.length) return null;

  return (
    <div className={styles.box} role="status">
      <p className={styles.title}>담아두신 사이 일부 상품 정보가 바뀌어 반영했습니다.</p>
      <ul className={styles.list}>
        {removed.map((r, i) => (
          <li key={`r-${i}`}>
            <strong>{r.productName}</strong>
            {r.variantName ? ` (${r.variantName})` : ""} — 판매가 종료되어 견적서에서
            제외했습니다.
          </li>
        ))}
        {priceChanged.map((c, i) => (
          <li key={`c-${i}`}>
            <strong>{c.productName}</strong>
            {c.variantName ? ` (${c.variantName})` : ""} — 가격이 변경되어{" "}
            {formatPrice(c.oldPrice)} → {formatPrice(c.newPrice)}로 갱신했습니다.
          </li>
        ))}
      </ul>
    </div>
  );
}
