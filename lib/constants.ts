import type { Category, SiteSettings } from "./types";

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

// 사업자등록증 기준 공급자(법인) 정보. (상호=법인명, 브랜드명 "MMM MARKET"과 별개)
// TODO: 전화번호(tel)는 아직 placeholder — 실제 대표 전화로 교체 필요
export const SUPPLIER = {
  name: "메이드메이크메테리얼 주식회사",
  owner: "김영빈",
  bizNo: "216-88-03916",
  address: "서울특별시 송파구 송파대로 222, 1층 (가락동)",
  category: "제조업, 도매 및 소매업",
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

// 사이트 설정 기본값 — DB SiteSetting 의 시드값이자, 행이 없을 때의 읽기 폴백.
// (기존 하드코딩 상수를 그대로 이어받아 초기 동작을 보존한다)
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  supplierName: SUPPLIER.name,
  supplierOwner: SUPPLIER.owner,
  supplierBizNo: SUPPLIER.bizNo,
  supplierAddress: SUPPLIER.address,
  supplierCategory: SUPPLIER.category,
  supplierTel: SUPPLIER.tel,
  bankName: BANK_ACCOUNT.bank,
  bankAccountNumber: BANK_ACCOUNT.number,
  bankAccountHolder: BANK_ACCOUNT.holder,
  quoteValidDays: QUOTE_VALID_DAYS,
  csEmail: "help@mmm-market.com",
  csTel: "02-000-0000",
};
