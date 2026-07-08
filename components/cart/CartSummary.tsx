"use client";

import Link from "next/link";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";
import styles from "./CartSummary.module.css";

export default function CartSummary() {
  const { totalCount, totalPrice } = useCart();

  return (
    <aside className={styles.summary}>
      <h2 className={styles.title}>주문 요약</h2>
      <dl className={styles.rows}>
        <div className={styles.row}>
          <dt>상품 수</dt>
          <dd>{totalCount}개</dd>
        </div>
        <div className={styles.row}>
          <dt>배송비</dt>
          <dd>결제 시 계산</dd>
        </div>
        <div className={`${styles.row} ${styles.totalRow}`}>
          <dt>합계</dt>
          <dd>{formatPrice(totalPrice)}</dd>
        </div>
      </dl>
      <Link href="/quote" className={styles.quoteButton}>
        견적서 보기 · 인쇄
      </Link>
      <Link href="/checkout" className={styles.checkoutButton}>
        주문하기
      </Link>
    </aside>
  );
}
