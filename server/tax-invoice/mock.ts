import "server-only";
import type {
  TaxInvoiceIssueInput,
  TaxInvoiceIssueResult,
} from "./provider";

// 볼타/국세청 연동 없이 로컬에서 발행 흐름(신청→관리자 발행→ntsRef 저장)을 검증하는 mock.
// 실제 호출 대신 orderNo 기반의 결정적 가짜 발행키를 돌려준다. live 어댑터와 동일한 필수값 가드를 둔다.
export async function mockIssue(
  input: TaxInvoiceIssueInput,
): Promise<TaxInvoiceIssueResult> {
  if (!input.supplied.bizNo) {
    throw new Error("[bolta:mock] 공급받는자 사업자번호가 없습니다.");
  }
  if (!input.items.length) {
    throw new Error("[bolta:mock] 발행할 품목이 없습니다.");
  }
  return {
    issuanceKey: `MOCK-${input.orderNo}`,
    ntsApprovalNo: `test_nts_MOCK-${input.orderNo}`,
  };
}
