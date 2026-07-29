import "server-only";

// 현금영수증(소득공제용) 발급 provider 추상화 — 세금계산서 provider와 동일한 격리 패턴.
// env CASH_RECEIPT_MODE=mock|live 로 전환(기본 mock). 실연동(Toss 현금영수증 API 등)은
// 실계약 키가 준비되면 live 구현만 채우면 되고, 호출부는 이 인터페이스만 안다.

export interface CashReceiptIssueInput {
  orderNo: string; // 멱등키
  phone: string; // 소득공제용 휴대폰번호
  supplyCost: number; // 공급가액
  vat: number; // 부가세
  total: number; // 합계(공급가액+부가세)
}

export interface CashReceiptIssueResult {
  approvalNo: string; // 현금영수증 승인번호 → CashReceipt.approvalNo 에 저장
}

export interface CashReceiptProvider {
  issue(input: CashReceiptIssueInput): Promise<CashReceiptIssueResult>;
}

// mock — 키 없이 발행 흐름을 검증한다(가짜 승인번호).
function mockIssue(input: CashReceiptIssueInput): Promise<CashReceiptIssueResult> {
  const digits = input.orderNo.replace(/\D/g, "").slice(-8) || "00000000";
  return Promise.resolve({ approvalNo: `CR${digits}` });
}

// live 자리(미구현) — 실계약 후 Toss 현금영수증 API 등으로 채운다.
function liveIssue(): Promise<CashReceiptIssueResult> {
  throw new Error("현금영수증 실연동(live)이 아직 설정되지 않았습니다.");
}

export function getCashReceiptProvider(): CashReceiptProvider {
  const mode = process.env.CASH_RECEIPT_MODE ?? "mock";
  return { issue: mode === "live" ? liveIssue : mockIssue };
}
