export function formatPrice(price: number): string {
  return `${price.toLocaleString("ko-KR")}원`;
}

// 소비자가 대비 회원 도매가 할인율 (표시용)
// ★ 실제 소비자가 데이터가 생기면 이 역산 대신 데이터 값을 사용하도록 교체
export const MEMBER_DISCOUNT_RATE = 0.15;

// 회원 도매가로부터 소비자가(정가)를 역산 — 100원 단위 반올림
export function getConsumerPrice(memberPrice: number): number {
  const raw = memberPrice / (1 - MEMBER_DISCOUNT_RATE);
  return Math.round(raw / 100) * 100;
}
