import "server-only";
import { PortOneClient } from "@portone/server-sdk";

// 포트원 V2 서버 클라이언트. 서버에서 결제 단건조회 등 REST API 호출에 사용.
// PORTONE_API_SECRET 은 비밀값(브라우저로 절대 노출 금지).
export const portone = PortOneClient({
  secret: process.env.PORTONE_API_SECRET ?? "",
});

// 우리 주문번호(orderNo)를 포트원 결제 식별자(paymentId)로 그대로 사용한다.
// (orderNo 형식 "YYYYMMDD-HHMMSS" 는 포트원 규칙 6~64자·영숫자·-_ 을 만족)

// 표준 은행 코드 → 표시용 한글명. 없는 코드는 코드 문자열을 그대로 노출한다.
const BANK_LABEL: Record<string, string> = {
  KOOKMIN: "국민은행",
  SHINHAN: "신한은행",
  WOORI: "우리은행",
  HANA: "하나은행",
  NONGHYUP: "농협은행",
  LOCAL_NONGHYUP: "지역농협",
  IBK: "기업은행",
  KDB: "산업은행",
  SC: "SC제일은행",
  CITI: "씨티은행",
  SUHYUP: "수협은행",
  KFCC: "새마을금고",
  SHINHYUP: "신협",
  POST: "우체국",
  KWANGJU: "광주은행",
  KYONGNAM: "경남은행",
  BUSAN: "부산은행",
  DAEGU: "대구은행",
  JEONBUK: "전북은행",
  JEJU: "제주은행",
  KAKAO: "카카오뱅크",
  K_BANK: "케이뱅크",
  TOSS: "토스뱅크",
  TOSSBANK: "토스뱅크",
};

export function bankLabel(code: string | null | undefined): string {
  if (!code) return "";
  return BANK_LABEL[code] ?? code;
}
