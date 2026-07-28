"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "@/hooks/useCart";
import type { CartItem } from "@/lib/types";

export interface CartReconcileNotice {
  removed: { productName: string; variantName: string }[];
  priceChanged: {
    productName: string;
    variantName: string;
    oldPrice: number;
    newPrice: number;
  }[];
}

interface ReconcileResponse extends CartReconcileNotice {
  items: CartItem[];
}

// 견적서 보기·결제 화면 진입 시 담긴 상품을 현재 DB와 한 번 대조한다.
// 사라진 항목은 자동 제외하고, 가격이 바뀐 항목은 최신가로 갱신한 뒤
// 무엇이 바뀌었는지 알림(notice)으로 돌려준다.
// (과거의 blanket "일부 상품 정보가 변경되었습니다. 견적서를 새로 담아주세요." 대체)
export function useCartReconcile(): CartReconcileNotice | null {
  const { items, loaded, replaceItems } = useCart();
  const [notice, setNotice] = useState<CartReconcileNotice | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    // 카트 복원 이후 한 번만 대조한다(진입 시점 기준).
    if (!loaded || ran.current) return;
    ran.current = true;
    if (items.length === 0) return;

    const snapshot = items;
    (async () => {
      try {
        const res = await fetch("/api/cart/reconcile", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ items: snapshot }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as ReconcileResponse;
        replaceItems(data.items);
        if (data.removed.length || data.priceChanged.length) {
          setNotice({ removed: data.removed, priceChanged: data.priceChanged });
        }
      } catch {
        // 대조 실패는 조용히 무시(담긴 내용 그대로 진행)
      }
    })();
  }, [loaded, items, replaceItems]);

  return notice;
}
