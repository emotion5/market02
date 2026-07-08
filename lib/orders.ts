import type { CartItem } from "./types";

export type OrderStatus =
  | "pending" // 입금대기
  | "paid" // 입금확인
  | "preparing" // 배송준비
  | "shipping" // 배송중
  | "delivered"; // 배송완료

export interface Order {
  orderNo: string;
  createdAt: string; // ISO 문자열
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
  };
}

const STORAGE_KEY = "market02-orders";

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
};

// ── 목(mock) 배송 시뮬레이션 ────────────────────────────
// 백엔드가 없으므로 주문 후 경과 시간에 따라 상태를 자동 진행시킨다.
// (실 서비스에서는 서버가 관리하는 실제 상태로 대체)
export function deriveStatus(createdAt: string): OrderStatus {
  const mins = (Date.now() - new Date(createdAt).getTime()) / 60000;
  if (mins < 1) return "pending";
  if (mins < 2) return "paid";
  if (mins < 4) return "preparing";
  if (mins < 7) return "shipping";
  return "delivered";
}

// 주문번호에서 안정적인 목 운송장 번호 생성
export function trackingNumber(orderNo: string): string {
  const digits = orderNo.replace(/\D/g, "");
  return `6${digits.slice(-11).padStart(11, "0")}`;
}

export const COURIER = "MMM 물류 (택배)";

// ── 저장/조회 ──────────────────────────────────────────
export function getOrders(): Order[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Order[]) : [];
  } catch {
    return [];
  }
}

export function saveOrder(order: Order): void {
  if (typeof window === "undefined") return;
  const orders = getOrders();
  // 최신 주문이 앞에 오도록
  localStorage.setItem(STORAGE_KEY, JSON.stringify([order, ...orders]));
}

export function getOrder(orderNo: string): Order | undefined {
  return getOrders().find((o) => o.orderNo === orderNo);
}
