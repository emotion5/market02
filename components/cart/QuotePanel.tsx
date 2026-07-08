"use client";

import Link from "next/link";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";
import styles from "./QuotePanel.module.css";

// 리스트/상세 페이지 좌측에 항상 표시되는 견적서 패널
export default function QuotePanel() {
  const { items, totalCount, totalPrice, updateQuantity, removeItem, clearCart } =
    useCart();

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>견적서</span>
        <span className={styles.headerCount}>{totalCount} ITEMS</span>
      </div>

      {items.length === 0 ? (
        <p className={styles.empty}>
          담긴 상품이 없습니다.
          <br />
          상품을 견적서에 담아보세요.
        </p>
      ) : (
        <>
          <ul className={styles.items}>
            {items.map((item) => (
              <li
                key={`${item.productId}-${item.variantId}`}
                className={styles.item}
              >
                <Link href={`/products/${item.productId}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.productName}
                    className={styles.thumb}
                  />
                </Link>

                <div className={styles.itemInfo}>
                  <Link
                    href={`/products/${item.productId}`}
                    className={styles.itemName}
                  >
                    {item.productName}
                  </Link>
                  <p className={styles.itemVariant}>{item.variantName}</p>

                  <div className={styles.itemRow}>
                    <div className={styles.quantity}>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.variantId,
                            item.quantity - 1,
                          )
                        }
                        aria-label="수량 줄이기"
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.variantId,
                            item.quantity + 1,
                          )
                        }
                        aria-label="수량 늘리기"
                      >
                        +
                      </button>
                    </div>
                    <span className={styles.itemPrice}>
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.remove}
                  onClick={() => removeItem(item.productId, item.variantId)}
                  aria-label={`${item.productName} 삭제`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>

          <dl className={styles.totals}>
            <div className={styles.totalRow}>
              <dt>총 합계</dt>
              <dd>{formatPrice(totalPrice)}</dd>
            </div>
          </dl>

          <div className={styles.actions}>
            <Link href="/cart" className={styles.primaryAction}>
              견적서 보기
            </Link>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={clearCart}
            >
              전체 비우기
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
