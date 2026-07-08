import type { Category } from "./types";

export const CATEGORIES: Category[] = [
  { slug: "faucet", name: "수전" },
  { slug: "flooring", name: "바닥재" },
  { slug: "gangmaru", name: "강마루" },
  { slug: "jangpan", name: "장판" },
  { slug: "hardware", name: "하드웨어" },
  { slug: "drawer", name: "서랍" },
];

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

// TODO: 실제 사업자 정보로 교체
export const SUPPLIER = {
  name: "MMM MARKET",
  owner: "홍길동",
  bizNo: "000-00-00000",
  address: "서울특별시 ○○구 ○○로 00, 0층",
  category: "도소매 / 인테리어 자재",
  tel: "02-000-0000",
};

// 무통장입금 계좌 (공급자)
export const BANK_ACCOUNT = {
  bank: "국민은행",
  number: "000000-00-000000",
  holder: "MMM MARKET",
};

// 견적서 유효기간 (발행일로부터 일수)
export const QUOTE_VALID_DAYS = 14;
