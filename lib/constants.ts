import type { Category } from "./types";

// 배열 순서 = 상단 내비 칩 순서 = 홈 카테고리 섹션 순서.
// slug는 URL·상품 데이터·이미지 폴더를 잇는 내부 키라 표시 이름과 별개로 유지한다.
export const CATEGORIES: Category[] = [
  { slug: "hardware", name: "하드웨어", en: "Hardware" },
  { slug: "drawer", name: "가구재", en: "Panel" },
  { slug: "flooring", name: "바닥재", en: "PressBevel" },
  { slug: "jangpan", name: "장판", en: "AntiPress" },
  { slug: "faucet", name: "위생", en: "BathMatch" },
  { slug: "gangmaru", name: "건자재", en: "StableCore" },
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
