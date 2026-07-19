import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import type { OrderStatus } from "@/lib/orders";

// 어드민 주문 관리(조회 + 상태전이). 소비자용 server/orders/service 와 분리.

const TO_CLIENT: Record<string, OrderStatus> = {
  PENDING: "pending",
  PAID: "paid",
  PREPARING: "preparing",
  SHIPPING: "shipping",
  DELIVERED: "delivered",
};
const TO_DB: Record<string, Prisma.EnumOrderStatusFilter["equals"]> = {
  pending: "PENDING",
  paid: "PAID",
  preparing: "PREPARING",
  shipping: "SHIPPING",
  delivered: "DELIVERED",
};

export type TaxInvoiceState = "none" | "pending" | "issued";

function taxState(
  t: { requested: boolean; status: string } | null,
): TaxInvoiceState {
  if (!t || !t.requested) return "none";
  return t.status === "ISSUED" ? "issued" : "pending";
}

export interface AdminOrderRow {
  orderNo: string;
  createdAt: string;
  ordererName: string;
  depositorName: string;
  total: number;
  status: OrderStatus;
  itemCount: number;
  firstItemName: string | null;
  tax: TaxInvoiceState;
}

export interface AdminOrderListResult {
  rows: AdminOrderRow[];
  total: number;
  page: number;
  pageSize: number;
}

export const ORDER_PAGE_SIZE = 20;

export async function listOrdersForAdmin(
  opts: { q?: string; status?: string; page?: number } = {},
): Promise<AdminOrderListResult> {
  const where: Prisma.OrderWhereInput = {};
  if (opts.status && TO_DB[opts.status]) {
    where.status = TO_DB[opts.status];
  }
  const q = opts.q?.trim();
  if (q) {
    where.OR = [
      { orderNo: { contains: q, mode: "insensitive" } },
      { ordererName: { contains: q, mode: "insensitive" } },
      { depositorName: { contains: q, mode: "insensitive" } },
    ];
  }

  const page = Math.max(1, opts.page ?? 1);
  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ORDER_PAGE_SIZE,
      take: ORDER_PAGE_SIZE,
      include: {
        _count: { select: { items: true } },
        items: { take: 1, orderBy: { id: "asc" }, select: { productName: true } },
        taxInvoice: { select: { requested: true, status: true } },
      },
    }),
  ]);

  return {
    rows: orders.map((o) => ({
      orderNo: o.orderNo,
      createdAt: o.createdAt.toISOString(),
      ordererName: o.ordererName,
      depositorName: o.depositorName,
      total: o.total,
      status: TO_CLIENT[o.status] ?? "pending",
      itemCount: o._count.items,
      firstItemName: o.items[0]?.productName ?? null,
      tax: taxState(o.taxInvoice),
    })),
    total,
    page,
    pageSize: ORDER_PAGE_SIZE,
  };
}

export interface AdminOrderItem {
  productId: string;
  productName: string;
  variantName: string;
  color: string | null;
  image: string;
  unitPrice: number;
  quantity: number;
}
export interface AdminOrderDetail {
  orderNo: string;
  createdAt: string;
  status: OrderStatus;
  userEmail: string;
  items: AdminOrderItem[];
  supply: number;
  vat: number;
  shippingFee: number;
  total: number;
  orderer: { name: string; tel: string; address: string; memo: string | null };
  depositor: string;
  tax: {
    state: TaxInvoiceState;
    bizNo: string | null;
    company: string | null;
    issuedAt: string | null;
  };
  courier: string | null;
  trackingNumber: string | null;
}

export async function getOrderForAdmin(
  orderNo: string,
): Promise<AdminOrderDetail | null> {
  const o = await prisma.order.findUnique({
    where: { orderNo },
    include: {
      items: { orderBy: { id: "asc" } },
      taxInvoice: true,
      user: { select: { email: true } },
    },
  });
  if (!o) return null;
  return {
    orderNo: o.orderNo,
    createdAt: o.createdAt.toISOString(),
    status: TO_CLIENT[o.status] ?? "pending",
    userEmail: o.user.email,
    items: o.items.map((it) => ({
      productId: it.productId,
      productName: it.productName,
      variantName: it.variantName,
      color: it.color,
      image: it.image,
      unitPrice: it.unitPrice,
      quantity: it.quantity,
    })),
    supply: o.supply,
    vat: o.vat,
    shippingFee: o.shippingFee,
    total: o.total,
    orderer: {
      name: o.ordererName,
      tel: o.ordererTel,
      address: o.ordererAddress,
      memo: o.ordererMemo,
    },
    depositor: o.depositorName,
    tax: {
      state: taxState(o.taxInvoice),
      bizNo: o.taxInvoice?.bizNo ?? null,
      company: o.taxInvoice?.company ?? null,
      issuedAt: o.taxInvoice?.issuedAt
        ? o.taxInvoice.issuedAt.toISOString()
        : null,
    },
    courier: o.courier,
    trackingNumber: o.trackingNumber,
  };
}

// ── 상태 전이 (관리자) ──────────────────────────────
export type OrderAction =
  | "confirm_deposit"
  | "start_preparing"
  | "start_shipping"
  | "complete_delivery"
  | "issue_tax_invoice";

export type OrderActionResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

const fail = (status: number, error: string): OrderActionResult => ({
  ok: false,
  status,
  error,
});

export async function performOrderAction(
  orderNo: string,
  action: OrderAction,
  extra: { courier?: string; trackingNumber?: string } = {},
): Promise<OrderActionResult> {
  const o = await prisma.order.findUnique({
    where: { orderNo },
    include: { taxInvoice: true },
  });
  if (!o) return fail(404, "주문을 찾을 수 없습니다.");

  switch (action) {
    case "confirm_deposit":
      if (o.status !== "PENDING") return fail(409, "입금대기 주문만 확인할 수 있습니다.");
      await prisma.order.update({ where: { orderNo }, data: { status: "PAID" } });
      return { ok: true };

    case "start_preparing":
      if (o.status !== "PAID") return fail(409, "입금확인 상태에서만 배송준비로 전환할 수 있습니다.");
      await prisma.order.update({ where: { orderNo }, data: { status: "PREPARING" } });
      return { ok: true };

    case "start_shipping": {
      if (o.status !== "PREPARING") return fail(409, "배송준비 상태에서만 배송을 시작할 수 있습니다.");
      const courier = extra.courier?.trim();
      const trackingNumber = extra.trackingNumber?.trim();
      if (!courier || !trackingNumber) {
        return fail(400, "택배사와 운송장번호를 입력하세요.");
      }
      await prisma.order.update({
        where: { orderNo },
        data: { status: "SHIPPING", courier, trackingNumber },
      });
      return { ok: true };
    }

    case "complete_delivery":
      if (o.status !== "SHIPPING") return fail(409, "배송중 주문만 배송완료로 처리할 수 있습니다.");
      await prisma.order.update({ where: { orderNo }, data: { status: "DELIVERED" } });
      return { ok: true };

    case "issue_tax_invoice":
      if (!o.taxInvoice || !o.taxInvoice.requested) {
        return fail(409, "세금계산서를 신청한 주문이 아닙니다.");
      }
      if (o.taxInvoice.status === "ISSUED") {
        return fail(409, "이미 발행 완료된 세금계산서입니다.");
      }
      if (o.status === "PENDING") {
        return fail(409, "입금확인 후 발행할 수 있습니다.");
      }
      await prisma.taxInvoice.update({
        where: { orderId: o.id },
        data: { status: "ISSUED", issuedAt: new Date() },
      });
      return { ok: true };

    default:
      return fail(400, "알 수 없는 작업입니다.");
  }
}
