"use client";

import { Heart } from "lucide-react";
import type { Product } from "@/lib/types";
import { useCart } from "@/hooks/useCart";
import styles from "./ProductCard.module.css";

// 썸네일 위 빠른 추가 버튼: 상세로 들어가지 않고 대표 옵션을 견적서에 바로 담는다.
// 담긴 상태는 따로 저장하지 않고 견적서 내용에서 파생시킨다 —
// 견적서 자체가 localStorage에 저장되므로 새로고침해도 그대로 유지된다.
export default function QuickAddButton({ product }: { product: Product }) {
  const { items, addItem, removeItem } = useCart();

  const variant = product.variants[0];
  const color = product.colors?.[0];
  // 색상이 있으면 색상까지 구분되도록 variantId를 합성 (VariantSelector와 동일 규칙)
  const variantId = color ? `${variant.id}::${color}` : variant.id;

  const inQuote = items.some(
    (i) => i.productId === product.id && i.variantId === variantId,
  );

  const handleClick = (e: React.MouseEvent) => {
    // 카드 전체를 덮는 링크로 이동하지 않도록 클릭 차단
    e.preventDefault();
    e.stopPropagation();

    if (inQuote) {
      removeItem(product.id, variantId);
      return;
    }

    addItem(
      {
        productId: product.id,
        variantId,
        productName: product.name,
        variantName: variant.name,
        price: variant.price,
        image: product.image,
        color: color || undefined,
      },
      1,
    );
  };

  const label = inQuote ? "견적서에서 빼기" : "견적서에 추가";

  return (
    <button
      type="button"
      className={`${styles.quickAdd} ${inQuote ? styles.quickAddDone : ""}`}
      onClick={handleClick}
      aria-label={label}
      aria-pressed={inQuote}
      data-tip={label}
    >
      <Heart size={10} strokeWidth={1.75} fill="currentColor" />
    </button>
  );
}
