import type { CartItem } from "./types";

export type OrderStatus =
  | "pending" // 입금대기
  | "paid" // 입금확인
  | "preparing" // 배송준비
  | "shipping" // 배송중
  | "delivered" // 배송완료
  | "cancelled"; // 주문취소(가상계좌 만료·결제실패)

// 서버(DB)에서 내려오는 주문 한 건. 주문 시점 값을 그대로 굳힌 스냅샷.
export interface Order {
  orderNo: string;
  createdAt: string; // ISO
  status: OrderStatus; // 저장된 실제 상태(관리자가 진행) — 더 이상 시간 기반 목이 아님
  items: CartItem[];
  total: number;
  supply: number;
  vat: number;
  orderer: {
    name: string;
    tel: string;
    address: string;
    memo?: string;
  };
  depositor: string;
  taxInvoice: {
    requested: boolean;
    bizNo?: string;
    company?: string;
    issued: boolean; // 발행완료 여부(관리자 처리)
    issuedAt?: string; // 실제 발행일시(ISO). 발행 전이면 없음
    ntsApprovalNo?: string; // 국세청승인번호
  };
  courier?: string;
  trackingNumber?: string;
  paidAt?: string; // 입금확인 시각(ISO). 취소 시 "환불 완료" 판정에 사용
  canceledAt?: string; // 취소·환불 처리 시각(ISO)
  cancelReason?: string; // 취소·환불 사유
  // 가상계좌(포트원) 발급 정보 — 입금대기 안내용. 발급 전이면 없음.
  virtualAccount?: {
    bank: string; // 은행 코드(예: KOOKMIN)
    bankLabel: string; // 표시용 은행명(한글)
    accountNumber: string;
    dueDate?: string; // ISO
  };
}

// 주문 생성 요청(클라이언트 → 서버). 가격·주문번호는 서버가 산정한다.
export interface OrderDraftInput {
  orderer: { name: string; tel: string; address: string; memo?: string };
  depositor: string;
  taxInvoice: { requested: boolean; bizNo?: string; company?: string };
  items: {
    productId: string;
    variantId: string;
    quantity: number;
    color?: string;
  }[];
}

// 상태 진행 순서와 라벨
export const STATUS_FLOW: OrderStatus[] = [
  "pending",
  "paid",
  "preparing",
  "shipping",
  "delivered",
];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "입금대기",
  paid: "입금확인",
  preparing: "배송준비",
  shipping: "배송중",
  delivered: "배송완료",
  cancelled: "주문취소",
};

// 취소 건은 상태값을 늘리지 않고, 결제·배송 이력으로 표시 라벨만 세분한다.
//  - 배송 나간 뒤 취소 → 반품완료
//  - 입금 후 취소 → 환불완료
//  - 입금 전 취소 → 주문취소
export function orderStatusLabel(o: {
  status: OrderStatus;
  paidAt?: string | null;
  trackingNumber?: string | null;
}): string {
  if (o.status !== "cancelled") return STATUS_LABEL[o.status];
  if (o.trackingNumber) return "반품완료";
  if (o.paidAt) return "환불완료";
  return "주문취소";
}

// 운송장이 아직 없을 때 표시할 기본 택배사명
export const DEFAULT_COURIER = "MMM 물류 (택배)";

// 주문번호: YYYYMMDD-HHMMSS (초까지 → 같은 분 다건도 구분). 서버 채번에 사용.
export function makeOrderNo(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(
    d.getHours(),
  )}${p(d.getMinutes())}${p(d.getSeconds())}`;
}
