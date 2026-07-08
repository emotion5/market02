"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import styles from "./VariantSelector.module.css";

// 상품 상세의 인터랙션 영역: 옵션 선택 + 수량 + 장바구니 담기
export default function VariantSelector({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const variant = product.variants.find((v) => v.id === variantId);
  if (!variant) return null;

  const handleAdd = () => {
    addItem(
      {
        productId: product.id,
        variantId: variant.id,
        productName: product.name,
        variantName: variant.name,
        price: variant.price,
        image: product.image,
      },
      quantity,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className={styles.selector}>
      <div className={styles.field}>
        <label htmlFor="variant" className={styles.label}>
          옵션
        </label>
        <select
          id="variant"
          className={styles.select}
          value={variantId}
          onChange={(e) => setVariantId(e.target.value)}
        >
          {product.variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} — {formatPrice(v.price)}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <span className={styles.label}>수량</span>
        <div className={styles.quantity}>
          <button
            type="button"
            className={styles.quantityButton}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="수량 줄이기"
          >
            −
          </button>
          <span className={styles.quantityValue}>{quantity}</span>
          <button
            type="button"
            className={styles.quantityButton}
            onClick={() => setQuantity((q) => q + 1)}
            aria-label="수량 늘리기"
          >
            +
          </button>
        </div>
      </div>

      <div className={styles.total}>
        <span>합계</span>
        <strong>{formatPrice(variant.price * quantity)}</strong>
      </div>

      <button type="button" className={styles.addButton} onClick={handleAdd}>
        {added ? "장바구니에 담았습니다" : "장바구니 담기"}
      </button>
    </div>
  );
}
