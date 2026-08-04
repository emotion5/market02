// 택배사 목록 + 이름↔코드 매핑. (SweetTracker t_code 기준)
// 관리자 운송장 입력의 드롭다운과, 서버 배송조회의 코드 변환에 함께 쓴다.
// 목록을 넓히려면 SweetTracker `companylist` API 로 코드를 확인해 추가하면 된다.

export interface Courier {
  code: string; // SweetTracker t_code
  deliveryCode: string; // deliveryapi.co.kr courierCode
  name: string; // 표시·저장용 택배사명
}

// 국내 주요 택배사(도매 배송에서 실제로 쓰는 것 위주).
export const COURIERS: Courier[] = [
  { code: "04", deliveryCode: "cj", name: "CJ대한통운" },
  { code: "01", deliveryCode: "post", name: "우체국택배" },
  { code: "05", deliveryCode: "hanjin", name: "한진택배" },
  { code: "08", deliveryCode: "lotte", name: "롯데택배" },
  { code: "06", deliveryCode: "logen", name: "로젠택배" },
];

const byName = new Map(COURIERS.map((c) => [c.name, c.code]));
const byCode = new Map(COURIERS.map((c) => [c.code, c.name]));
const deliveryByName = new Map(COURIERS.map((c) => [c.name, c.deliveryCode]));

// 저장된 택배사명 → SweetTracker 조회용 코드. 미지원(자체배송 등)이면 null.
export function courierCodeByName(name?: string | null): string | null {
  if (!name) return null;
  return byName.get(name.trim()) ?? null;
}

// 저장된 택배사명 → deliveryapi.co.kr courierCode. 미지원이면 null.
export function deliveryApiCodeByName(name?: string | null): string | null {
  if (!name) return null;
  return deliveryByName.get(name.trim()) ?? null;
}

export function courierNameByCode(code?: string | null): string | null {
  if (!code) return null;
  return byCode.get(code) ?? null;
}
