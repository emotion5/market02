"use client";

import Link from "next/link";
import { useCart } from "@/hooks/useCart";
import CartItem from "@/components/cart/CartItem";
import CartSummary from "@/components/cart/CartSummary";
import styles from "./page.module.css";

export default function CartPage() {
  const { items } = useCart();

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>견적서</h1>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <p>장바구니가 비어 있습니다.</p>
          <Link href="/products" className={styles.emptyLink}>
            상품 보러 가기
          </Link>
        </div>
      ) : (
        <div className={styles.layout}>
          <div>
            {items.map((item) => (
              <CartItem key={`${item.productId}-${item.variantId}`} item={item} />
            ))}
          </div>
          <CartSummary />
        </div>
      )}
    </div>
  );
}
