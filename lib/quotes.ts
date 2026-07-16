import type { CartItem } from "./types";
import { QUOTE_VALID_DAYS } from "./constants";

// 공급받는 자 (견적서를 받는 쪽) 정보
export interface QuoteCustomer {
  company: string;
  contactName: string;
  contactTel: string;
}

// 발행된 견적서. 발행 시점의 번호·날짜·품목·가격을 그대로 굳혀 보관한다 —
// 고객에게 보낸 문서와 나중에 다시 열어본 문서가 같아야 하므로,
// 이후 장바구니를 바꾸거나 상품 가격이 변해도 여기엔 영향이 없다.
export interface SavedQuote {
  number: string; // 예: Q-20260716-142530
  issuedAt: string; // ISO 문자열
  items: CartItem[];
  customer: QuoteCustomer;
  total: number;
  supply: number;
  vat: number;
}

const STORAGE_KEY = "market02-quotes";

// 견적번호는 발행 시각으로 만든다. 초까지 넣어야 같은 분에 두 건을 발행해도
// 번호가 겹치지 않는다 (번호가 곧 조회 키다).
export function makeQuoteNumber(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `Q-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(
    d.getHours(),
  )}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

// 유효기간: 발행일로부터 QUOTE_VALID_DAYS일
export function quoteValidUntil(issuedAt: string): Date {
  return new Date(new Date(issuedAt).getTime() + QUOTE_VALID_DAYS * 86400000);
}

export function isQuoteExpired(issuedAt: string): boolean {
  return quoteValidUntil(issuedAt).getTime() < Date.now();
}

// 품목에서 공급가액·부가세를 계산 (표시가는 부가세 포함가)
export function quoteTotals(items: CartItem[]): {
  total: number;
  supply: number;
  vat: number;
} {
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const supply = Math.round(total / 1.1);
  return { total, supply, vat: total - supply };
}

// ── 저장/조회 ──────────────────────────────────────────
export function getQuotes(): SavedQuote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedQuote[]) : [];
  } catch {
    return [];
  }
}

export function saveQuote(quote: SavedQuote): void {
  if (typeof window === "undefined") return;
  const quotes = getQuotes();
  // 최신 견적서가 앞에 오도록
  localStorage.setItem(STORAGE_KEY, JSON.stringify([quote, ...quotes]));
}

export function getQuote(number: string): SavedQuote | undefined {
  return getQuotes().find((q) => q.number === number);
}
