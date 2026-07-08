"use client";

import Link from "next/link";
import type { CartItem as CartItemType } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import styles from "./CartItem.module.css";

export default function CartItem({ item }: { item: CartItemType }) {
  const { updateQuantity, removeItem } = useCart();

  return (
    <div className={styles.item}>
      <Link href={`/products/${item.productId}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.image} alt={item.productName} className={styles.image} />
      </Link>

      <div className={styles.info}>
        <Link href={`/products/${item.productId}`} className={styles.name}>
          {item.productName}
        </Link>
        <p className={styles.variant}>
          {item.color && (
            <span
              className={styles.colorDot}
              style={{ backgroundColor: item.color }}
              aria-hidden
            />
          )}
          {item.variantName}
        </p>

        <div className={styles.quantity}>
          <button
            type="button"
            className={styles.quantityButton}
            onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
            aria-label="수량 줄이기"
          >
            −
          </button>
          <span className={styles.quantityValue}>{item.quantity}</span>
          <button
            type="button"
            className={styles.quantityButton}
            onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
            aria-label="수량 늘리기"
          >
            +
          </button>
        </div>
      </div>

      <div className={styles.side}>
        <p className={styles.price}>{formatPrice(item.price * item.quantity)}</p>
        <button
          type="button"
          className={styles.remove}
          onClick={() => removeItem(item.productId, item.variantId)}
        >
          삭제
        </button>
      </div>
    </div>
  );
}
