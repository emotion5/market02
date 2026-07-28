import "server-only";
import { boltaIssue } from "./bolta";
import { mockIssue } from "./mock";

// 전자세금계산서 발행 provider 추상화.
// 실제 연동(볼타)과 로컬 검증용 mock 을 같은 인터페이스로 교체한다.
// env BOLTA_MODE=mock|live 로 전환 (기본 mock — 키 없이 로컬 전체 흐름 검증).

// 발행 1건에 필요한 도메인 입력. provider 구현 세부와 무관한 형태로 유지한다.
export interface TaxInvoiceIssueItem {
  name: string; // 품목명 (1~100자)
  supplyCost: number; // 공급가액
  tax: number; // 세액
  quantity?: number;
}

export interface TaxInvoiceIssueInput {
  orderNo: string; // 멱등키로 사용(중복발행 방지)
  date: string; // 작성일자 YYYY-MM-DD
  supplied: {
    // 공급받는자(구매 사업자)
    bizNo: string; // 사업자등록번호(하이픈 포함 가능 — 어댑터에서 정리)
    organizationName: string; // 상호
    representativeName: string; // 대표자
    email: string; // 담당자 이메일(로그인 이메일)
  };
  items: TaxInvoiceIssueItem[];
}

export interface TaxInvoiceIssueResult {
  issuanceKey: string; // 발행키 → TaxInvoice.ntsRef 에 저장
}

export interface TaxInvoiceProvider {
  issue(input: TaxInvoiceIssueInput): Promise<TaxInvoiceIssueResult>;
}

export function getTaxInvoiceProvider(): TaxInvoiceProvider {
  const mode = process.env.BOLTA_MODE ?? "mock";
  return { issue: mode === "live" ? boltaIssue : mockIssue };
}
