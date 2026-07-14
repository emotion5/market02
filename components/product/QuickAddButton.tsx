"use client";

import { useState } from "react";
import { FileText, Check } from "lucide-react";
import type { Product } from "@/lib/types";
import { useCart } from "@/hooks/useCart";
import styles from "./ProductCard.module.css";

// 썸네일 위 빠른 추가 버튼: 상세로 들어가지 않고 대표 옵션을 견적서에 바로 담는다.
export default function QuickAddButton({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    // 카드 전체를 덮는 링크로 이동하지 않도록 클릭 차단
    e.preventDefault();
    e.stopPropagation();

    const variant = product.variants[0];
    const color = product.colors?.[0];
    addItem(
      {
        productId: product.id,
        // 색상이 있으면 색상까지 구분되도록 variantId를 합성 (VariantSelector와 동일 규칙)
        variantId: color ? `${variant.id}::${color}` : variant.id,
        productName: product.name,
        variantName: variant.name,
        price: variant.price,
        image: product.image,
        color: color || undefined,
      },
      1,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <button
      type="button"
      className={`${styles.quickAdd} ${added ? styles.quickAddDone : ""}`}
      onClick={handleClick}
      aria-label="견적서에 추가"
      data-tip="견적서에 추가"
    >
      {added ? (
        <Check size={16} strokeWidth={2} />
      ) : (
        <FileText size={16} strokeWidth={1.75} />
      )}
    </button>
  );
}
