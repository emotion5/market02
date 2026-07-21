import "server-only";

// 토스페이먼츠 결제 서버 클라이언트 (REST). 시크릿 키로 Basic 인증.
// TOSS_SECRET_KEY 는 비밀값(브라우저 노출 금지). 테스트 키는 test_sk_... 형식.

const API_BASE = "https://api.tosspayments.com";

function authHeader(): string {
  const secret = process.env.TOSS_SECRET_KEY ?? "";
  // 시크릿 키 뒤에 ':' 를 붙여 base64 인코딩 (비밀번호는 빈 값).
  return `Basic ${Buffer.from(`${secret}:`).toString("base64")}`;
}

// 토스 결제 객체(필요한 필드만). 가상계좌 발급/입금 처리에 사용.
export interface TossPayment {
  paymentKey: string;
  orderId: string;
  status:
    | "READY"
    | "IN_PROGRESS"
    | "WAITING_FOR_DEPOSIT"
    | "DONE"
    | "CANCELED"
    | "PARTIAL_CANCELED"
    | "ABORTED"
    | "EXPIRED";
  totalAmount: number;
  method?: string | null;
  approvedAt?: string | null;
  virtualAccount?: {
    accountNumber: string;
    bankCode: string;
    customerName?: string | null;
    dueDate?: string | null;
    expired?: boolean | null;
  } | null;
  secret?: string | null;
}

interface TossError {
  code: string;
  message: string;
}

async function parse(res: Response): Promise<TossPayment> {
  const data = await res.json();
  if (!res.ok) {
    const err = data as TossError;
    throw new Error(`[toss] ${err.code}: ${err.message}`);
  }
  return data as TossPayment;
}

// 결제 승인 — 가상계좌는 승인 시점에 계좌가 발급되고 status=WAITING_FOR_DEPOSIT 이 된다.
export async function confirmPayment(input: {
  paymentKey: string;
  orderId: string;
  amount: number;
}): Promise<TossPayment> {
  const res = await fetch(`${API_BASE}/v1/payments/confirm`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  return parse(res);
}

// 주문번호(orderId = 우리 orderNo)로 결제 재조회 — 웹훅 본문을 믿지 않고 재검증할 때 사용.
export async function getPaymentByOrderId(
  orderId: string,
): Promise<TossPayment | null> {
  const res = await fetch(
    `${API_BASE}/v1/payments/orders/${encodeURIComponent(orderId)}`,
    { headers: { Authorization: authHeader() } },
  );
  if (res.status === 404) return null; // 아직 결제요청 전 등
  return parse(res);
}

// 표준 금융기관 코드 → 표시용 한글명. 없는 코드는 코드 문자열을 그대로 노출한다.
const BANK_LABEL: Record<string, string> = {
  "004": "국민은행",
  "088": "신한은행",
  "020": "우리은행",
  "081": "하나은행",
  "011": "농협은행",
  "012": "지역농협",
  "003": "기업은행",
  "002": "산업은행",
  "023": "SC제일은행",
  "027": "씨티은행",
  "007": "수협은행",
  "045": "새마을금고",
  "048": "신협",
  "071": "우체국",
  "050": "저축은행",
  "031": "대구은행",
  "032": "부산은행",
  "034": "광주은행",
  "035": "제주은행",
  "037": "전북은행",
  "039": "경남은행",
  "090": "카카오뱅크",
  "089": "케이뱅크",
  "092": "토스뱅크",
};

export function bankLabel(code: string | null | undefined): string {
  if (!code) return "";
  return BANK_LABEL[code] ?? code;
}
