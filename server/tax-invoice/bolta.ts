import "server-only";
import type {
  TaxInvoiceIssueInput,
  TaxInvoiceIssueResult,
} from "./provider";

// 볼타(Bolta) 전자세금계산서 정발행 어댑터.
// 인증은 토스와 동일한 Basic 방식(API 키 뒤에 ':' 붙여 base64). test_/live_ 접두사로 환경 구분.
// 발행 200/응답 issuanceKey. 공급받는자 휴폐업 유효성은 발행 시 볼타가 자동 검증(발행비에 포함).

const API_BASE = "https://xapi.bolta.io";

// 발행 후 입금완료 상태이므로 영수(RECEIPT). 청구는 CLAIM.
const PURPOSE = "RECEIPT";

function authHeader(): string {
  const key = process.env.BOLTA_API_KEY ?? "";
  return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}

const digits = (s: string) => s.replace(/\D/g, "");

// 공급자(우리 쇼핑몰) 고정 정보. 값은 .env 에서 주입(자리만 준비).
function shopSupplier() {
  return {
    identificationNumber: digits(process.env.SHOP_BIZNO ?? ""),
    organizationName: process.env.SHOP_COMPANY ?? "",
    representativeName: process.env.SHOP_OWNER ?? "",
    manager: {
      name: process.env.SHOP_MANAGER_NAME ?? "",
      email: process.env.SHOP_MANAGER_EMAIL ?? "",
    },
  };
}

interface BoltaError {
  code: string;
  message: string;
  traceId?: string;
}

export async function boltaIssue(
  input: TaxInvoiceIssueInput,
): Promise<TaxInvoiceIssueResult> {
  const supplierKey = process.env.BOLTA_SUPPLIER_KEY ?? "";

  const body = {
    date: input.date,
    purpose: PURPOSE,
    taxType: "TAXABLE",
    supplier: shopSupplier(),
    supplied: {
      identificationNumber: digits(input.supplied.bizNo),
      organizationName: input.supplied.organizationName,
      representativeName: input.supplied.representativeName,
      managers: [
        {
          name: input.supplied.representativeName,
          email: input.supplied.email,
        },
      ],
    },
    items: input.items.map((it) => ({
      date: input.date,
      name: it.name,
      supplyCost: it.supplyCost,
      tax: it.tax,
      ...(it.quantity != null ? { quantity: it.quantity } : {}),
    })),
  };

  const res = await fetch(`${API_BASE}/v1/taxInvoices/issue`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Supplier-Key": supplierKey,
      // 멱등키: 같은 주문으로 재요청해도 중복 발행되지 않음.
      "Bolta-Client-Reference-Id": input.orderNo,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    const err = data as BoltaError;
    throw new Error(`[bolta] ${err.code}: ${err.message}`);
  }
  return { issuanceKey: (data as { issuanceKey: string }).issuanceKey };
}
