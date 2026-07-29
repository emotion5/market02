"use client";

import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";
import type { CartItem } from "@/lib/types";

// 견적서에서 넘어온 주문인지 확인하는 안전판.
// 체크아웃 URL 의 ?from=<견적번호> 를 읽어 그 견적서를 불러온 뒤,
// 현재 장바구니와 품목 단위로 대조해 "동일/달라진 점"을 돌려준다.
// 주문·DB 는 건드리지 않는 순수 클라이언트 검증이다(연결이 아니라 대조).

export interface QuoteMatch {
  number: string;
  same: boolean;
  diffs: string[];
}

export function useQuoteMatch(): QuoteMatch | null {
  const { items, loaded } = useCart();
  // 견적 스냅샷은 한 번만 불러와 보관하고, 대조는 장바구니 변화에 맞춰 다시 계산한다.
  const [ref, setRef] = useState<{ number: string; items: CartItem[] } | null>(
    null,
  );

  useEffect(() => {
    const from = new URLSearchParams(window.location.search).get("from");
    if (!from) return;
    let alive = true;
    fetch(`/api/quotes/${encodeURIComponent(from)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const q = data?.quote;
        if (alive && q) setRef({ number: q.number, items: q.items });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return useMemo(() => {
    if (!ref || !loaded) return null;
    const key = (i: CartItem) => `${i.productId}::${i.variantId}`;
    const qMap = new Map(ref.items.map((i) => [key(i), i]));
    const cMap = new Map(items.map((i) => [key(i), i]));
    const diffs: string[] = [];

    // 견적서에 있던 품목: 제외/수량변경/단가변경 확인
    for (const [k, q] of qMap) {
      const c = cMap.get(k);
      if (!c) {
        diffs.push(`${q.productName} — 견적서에 있었으나 제외됨`);
        continue;
      }
      if (c.quantity !== q.quantity) {
        diffs.push(`${q.productName} — 수량 ${q.quantity} → ${c.quantity}`);
      }
      if (c.price !== q.price) {
        diffs.push(
          `${q.productName} — 단가 ${formatPrice(q.price)} → ${formatPrice(c.price)}`,
        );
      }
    }
    // 견적서에 없던 품목: 추가됨
    for (const [k, c] of cMap) {
      if (!qMap.has(k)) {
        diffs.push(`${c.productName} — 견적서에 없던 상품 추가됨`);
      }
    }

    return { number: ref.number, same: diffs.length === 0, diffs };
  }, [ref, items, loaded]);
}
