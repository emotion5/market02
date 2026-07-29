"use client";

import type { QuoteMatch } from "@/hooks/useQuoteMatch";
import styles from "./QuoteMatchNotice.module.css";

// 견적서에서 넘어온 주문의 대조 결과 배너.
// 동일하면 안심 표시, 달라졌으면 무엇이 바뀌었는지 항목으로 안내한다.
export default function QuoteMatchNotice({ match }: { match: QuoteMatch | null }) {
  if (!match) return null;

  if (match.same) {
    return (
      <div className={`${styles.box} ${styles.ok}`} role="status">
        <p className={styles.title}>
          ✓ 견적서 {match.number}의 내용과 동일합니다.
        </p>
      </div>
    );
  }

  return (
    <div className={`${styles.box} ${styles.diff}`} role="status">
      <p className={styles.title}>
        견적서 {match.number}와(과) 달라진 점이 있습니다.
      </p>
      <ul className={styles.list}>
        {match.diffs.map((d, i) => (
          <li key={i}>{d}</li>
        ))}
      </ul>
      <p className={styles.foot}>주문 내용을 확인한 뒤 진행해주세요.</p>
    </div>
  );
}
