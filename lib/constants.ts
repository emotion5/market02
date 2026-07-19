import type { Category } from "./types";

// 배열 순서 = 상단 내비 칩 순서 = 홈 카테고리 섹션 순서.
// slug는 URL·상품 데이터·이미지 폴더를 잇는 내부 키라 표시 이름과 별개로 유지한다.
export const CATEGORIES: Category[] = [
  { slug: "hardware", name: "하드웨어", en: "Hardware" },
  { slug: "panel", name: "가구재", en: "Panel" },
  { slug: "pressbevel", name: "바닥재", en: "PressBevel" },
  { slug: "antipress", name: "장판", en: "AntiPress" },
  { slug: "bathmatch", name: "위생", en: "BathMatch" },
  { slug: "stablecore", name: "건자재", en: "StableCore" },
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

// 홈 큐레이션(featured) 카테고리당 최대 노출 수 (4열 × 2행). 클라이언트·서버 공용 상수.
export const FEATURED_MAX = 8;
