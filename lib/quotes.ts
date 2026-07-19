import type { CartItem } from "./types";

// 공급받는 자 (견적서를 받는 쪽) 정보
export interface QuoteCustomer {
  company: string;
  contactName: string;
  contactTel: string;
}

// 발행된 견적서(서버/DB에서 내려오는 표현). 발행 시점의 번호·날짜·유효기한·품목·가격을
// 그대로 굳혀 보관한다 — 이후 장바구니나 상품 가격이 변해도 여기엔 영향이 없다.
export interface SavedQuote {
  number: string; // 예: Q-20260716-142530
  issuedAt: string; // ISO 문자열
  validUntil: string; // ISO — 발행 시점 유효기한(스냅샷)
  expired: boolean; // 서버 계산(validUntil < now)
  items: CartItem[];
  customer: QuoteCustomer;
  total: number;
  supply: number;
  vat: number;
}

// 견적 발행 요청(클라이언트 → 서버). 가격·번호·유효기한은 서버가 산정한다.
export interface QuoteDraftInput {
  customer: QuoteCustomer;
  items: {
    productId: string;
    variantId: string; // 색상 포함 합성 id 가능("<vid>::<color>")
    quantity: number;
    color?: string;
  }[];
}

// 견적번호는 발행 시각으로 만든다. 초까지 넣어야 같은 분에 두 건을 발행해도
// 번호가 겹치지 않는다 (번호가 곧 조회 키다).
export function makeQuoteNumber(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `Q-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(
    d.getHours(),
  )}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

// 품목에서 공급가액·부가세를 계산 (표시가는 부가세 포함가)
export function quoteTotals(items: { price: number; quantity: number }[]): {
  total: number;
  supply: number;
  vat: number;
} {
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const supply = Math.round(total / 1.1);
  return { total, supply, vat: total - supply };
}
