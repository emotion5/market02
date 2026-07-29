import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import type { OrderStatus } from "@/lib/orders";
import {
  getTaxInvoiceProvider,
  type TaxInvoiceIssueItem,
} from "@/server/tax-invoice/provider";
import { getCashReceiptProvider } from "@/server/cash-receipt/provider";

// 어드민 주문 관리(조회 + 상태전이). 소비자용 server/orders/service 와 분리.

const TO_CLIENT: Record<string, OrderStatus> = {
  PENDING: "pending",
  PAID: "paid",
  PREPARING: "preparing",
  SHIPPING: "shipping",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};
const TO_DB: Record<string, Prisma.EnumOrderStatusFilter["equals"]> = {
  pending: "PENDING",
  paid: "PAID",
  preparing: "PREPARING",
  shipping: "SHIPPING",
  delivered: "DELIVERED",
  cancelled: "CANCELLED",
};

export type TaxInvoiceState = "none" | "pending" | "issued";

function taxState(
  t: { requested: boolean; status: string } | null,
): TaxInvoiceState {
  if (!t || !t.requested) return "none";
  return t.status === "ISSUED" ? "issued" : "pending";
}

// 작성일자용 KST 오늘(YYYY-MM-DD). 서버 TZ 무관하게 서울 기준으로 고정.
function todayKST(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

// 주문 라인 → 세금계산서 품목. unitPrice 는 VAT 포함 판매가이므로 공급가액/세액으로 분해한다.
// 라인별 반올림 합계가 주문 공급가액(order.supply)과 어긋나면 마지막 줄에서 보정해
// 계산서 총액이 주문 총액과 정확히 일치하도록 맞춘다.
function buildTaxItems(order: {
  supply: number;
  items: {
    productName: string;
    variantName: string;
    unitPrice: number;
    quantity: number;
  }[];
}): TaxInvoiceIssueItem[] {
  const rows: TaxInvoiceIssueItem[] = order.items.map((it) => {
    const lineTotal = it.unitPrice * it.quantity; // VAT 포함
    const supplyCost = Math.round(lineTotal / 1.1);
    return {
      name: `${it.productName} / ${it.variantName}`.slice(0, 100),
      supplyCost,
      tax: lineTotal - supplyCost,
      quantity: it.quantity,
    };
  });
  const diff = order.supply - rows.reduce((s, r) => s + r.supplyCost, 0);
  if (diff !== 0 && rows.length) {
    const last = rows[rows.length - 1];
    last.supplyCost += diff; // 공급가액 합계를 주문값에 맞춤
    last.tax -= diff; // 라인 총액 보존 → 세액 합계도 자동 일치
  }
  return rows;
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
  paidAt: string | null; // 취소 라벨(환불/반품/취소) 판정용
  trackingNumber: string | null;
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
        payment: { select: { paidAt: true } },
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
      paidAt: o.payment?.paidAt?.toISOString() ?? null,
      trackingNumber: o.trackingNumber ?? null,
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
    issuanceKey: string | null; // 볼타 발행키(ntsRef)
    ntsApprovalNo: string | null; // 국세청승인번호
  };
  cash: {
    state: "none" | "pending" | "issued"; // 현금영수증 발행 상태
    phone: string | null;
    issuedAt: string | null;
    approvalNo: string | null;
  };
  courier: string | null;
  trackingNumber: string | null;
  paidAt: string | null;
  canceledAt: string | null;
  cancelReason: string | null;
}

export async function getOrderForAdmin(
  orderNo: string,
): Promise<AdminOrderDetail | null> {
  const o = await prisma.order.findUnique({
    where: { orderNo },
    include: {
      items: { orderBy: { id: "asc" } },
      taxInvoice: true,
      cashReceipt: true,
      user: { select: { email: true } },
      payment: { select: { paidAt: true } },
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
      issuanceKey: o.taxInvoice?.ntsRef ?? null,
      ntsApprovalNo: o.taxInvoice?.ntsApprovalNo ?? null,
    },
    cash: {
      state: !o.cashReceipt?.requested
        ? "none"
        : o.cashReceipt.status === "ISSUED"
          ? "issued"
          : "pending",
      phone: o.cashReceipt?.phone ?? null,
      issuedAt: o.cashReceipt?.issuedAt?.toISOString() ?? null,
      approvalNo: o.cashReceipt?.approvalNo ?? null,
    },
    courier: o.courier,
    trackingNumber: o.trackingNumber,
    paidAt: o.payment?.paidAt?.toISOString() ?? null,
    canceledAt: o.canceledAt?.toISOString() ?? null,
    cancelReason: o.cancelReason,
  };
}

// ── 세금계산서 목록 (관리자) ──────────────────────────
// 주문에 흩어진 세금계산서를 한 곳에서: 발행대기(발행가능/입금대기) 큐 + 발행완료 대장.
export type TaxRowState = "issuable" | "waiting" | "issued";

export interface AdminTaxInvoiceRow {
  orderNo: string;
  createdAt: string; // 신청일(주문일)
  issuedAt: string | null;
  company: string | null;
  bizNo: string | null;
  supply: number;
  vat: number;
  total: number;
  ntsApprovalNo: string | null; // 국세청승인번호(발행완료 시)
  state: TaxRowState;
}

export interface AdminTaxInvoiceListResult {
  rows: AdminTaxInvoiceRow[];
  total: number;
  page: number;
  pageSize: number;
  counts: { issuable: number; waiting: number; issued: number };
}

export const TAX_PAGE_SIZE = 20;

function taxRowState(taxStatus: string, orderStatus: string): TaxRowState {
  if (taxStatus === "ISSUED") return "issued";
  if (orderStatus === "PENDING") return "waiting"; // 입금 전 → 발행 불가
  return "issuable"; // 입금확인 이후 → 발행 가능
}

export async function listTaxInvoicesForAdmin(
  opts: { tab?: string; q?: string; page?: number } = {},
): Promise<AdminTaxInvoiceListResult> {
  const tab = opts.tab === "issued" ? "issued" : "pending";
  const page = opts.page && opts.page > 0 ? opts.page : 1;
  const q = opts.q?.trim();

  // 공통 조건: 신청된 것만. 검색(주문번호·상호·사업자번호).
  const base: Prisma.TaxInvoiceWhereInput = { requested: true };
  if (q) {
    base.OR = [
      { order: { orderNo: { contains: q, mode: "insensitive" } } },
      { company: { contains: q, mode: "insensitive" } },
      { bizNo: { contains: q } },
    ];
  }
  // 발행대기 큐는 취소 주문을 제외(처리 대상 아님). 발행완료 대장은 상태 그대로.
  const where: Prisma.TaxInvoiceWhereInput =
    tab === "issued"
      ? { ...base, status: "ISSUED" }
      : { ...base, status: { not: "ISSUED" }, order: { status: { not: "CANCELLED" } } };

  const [records, total, issuable, waiting, issued] = await Promise.all([
    prisma.taxInvoice.findMany({
      where,
      include: {
        order: {
          select: {
            orderNo: true,
            status: true,
            supply: true,
            vat: true,
            total: true,
            createdAt: true,
          },
        },
      },
      // 발행대기: 발행가능(입금완료)을 위로, 그다음 신청 최신순. 발행완료: 발행일 최신순.
      orderBy:
        tab === "issued"
          ? { issuedAt: "desc" }
          : [{ order: { status: "desc" } }, { order: { createdAt: "desc" } }],
      skip: (page - 1) * TAX_PAGE_SIZE,
      take: TAX_PAGE_SIZE,
    }),
    prisma.taxInvoice.count({ where }),
    prisma.taxInvoice.count({
      where: { ...base, status: { not: "ISSUED" }, order: { status: { notIn: ["PENDING", "CANCELLED"] } } },
    }),
    prisma.taxInvoice.count({
      where: { ...base, status: { not: "ISSUED" }, order: { status: "PENDING" } },
    }),
    prisma.taxInvoice.count({ where: { ...base, status: "ISSUED" } }),
  ]);

  const rows: AdminTaxInvoiceRow[] = records.map((t) => ({
    orderNo: t.order.orderNo,
    createdAt: t.order.createdAt.toISOString(),
    issuedAt: t.issuedAt?.toISOString() ?? null,
    company: t.company,
    bizNo: t.bizNo,
    supply: t.order.supply,
    vat: t.order.vat,
    total: t.order.total,
    ntsApprovalNo: t.ntsApprovalNo ?? null,
    state: taxRowState(t.status, t.order.status),
  }));

  return { rows, total, page, pageSize: TAX_PAGE_SIZE, counts: { issuable, waiting, issued } };
}

// ── 상태 전이 (관리자) ──────────────────────────────
export type OrderAction =
  | "confirm_deposit"
  | "start_preparing"
  | "start_shipping"
  | "complete_delivery"
  | "issue_tax_invoice"
  | "issue_cash_receipt"
  | "cancel";

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
  extra: { courier?: string; trackingNumber?: string; reason?: string } = {},
): Promise<OrderActionResult> {
  const o = await prisma.order.findUnique({
    where: { orderNo },
    include: { taxInvoice: true, cashReceipt: true },
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

    case "issue_tax_invoice": {
      if (!o.taxInvoice || !o.taxInvoice.requested) {
        return fail(409, "세금계산서를 신청한 주문이 아닙니다.");
      }
      if (o.taxInvoice.status === "ISSUED") {
        return fail(409, "이미 발행 완료된 세금계산서입니다.");
      }
      if (o.status === "CANCELLED") {
        return fail(409, "취소된 주문은 세금계산서를 발행할 수 없습니다.");
      }
      if (o.status === "PENDING") {
        return fail(409, "입금확인 후 발행할 수 있습니다.");
      }

      // 발행에 필요한 공급받는자 정보·품목을 로드한다.
      // 상호·사업자번호는 신청 시점(taxInvoice)에 저장, 대표자는 사업자 프로필에서 보완.
      const full = await prisma.order.findUnique({
        where: { orderNo },
        include: {
          items: true,
          user: { include: { business: true } },
        },
      });
      const bp = full?.user.business ?? null;
      const bizNo = o.taxInvoice.bizNo ?? bp?.bizNo ?? null;
      const company = o.taxInvoice.company ?? bp?.company ?? null;
      const owner = bp?.owner ?? null;
      // 수신 이메일: 승인 시 확정한 세금계산서 수신 이메일 우선, 없으면 계정 이메일.
      const email = bp?.taxEmail ?? full?.user.email ?? null;
      if (!bizNo || !company || !owner) {
        return fail(
          400,
          "발행에 필요한 사업자 정보(사업자번호·상호·대표자)가 없습니다. 회원 정보를 확인하세요.",
        );
      }
      if (!email) return fail(400, "담당자 이메일(회원 이메일)이 없습니다.");

      let issuanceKey: string;
      let ntsApprovalNo: string | null;
      try {
        const result = await getTaxInvoiceProvider().issue({
          orderNo,
          date: todayKST(),
          supplied: {
            bizNo,
            organizationName: company,
            representativeName: owner,
            email,
          },
          items: buildTaxItems(full!),
        });
        issuanceKey = result.issuanceKey;
        ntsApprovalNo = result.ntsApprovalNo;
      } catch (e) {
        return fail(502, `세금계산서 발행에 실패했습니다: ${(e as Error).message}`);
      }

      await prisma.taxInvoice.update({
        where: { orderId: o.id },
        data: {
          status: "ISSUED",
          issuedAt: new Date(),
          ntsRef: issuanceKey,
          ntsApprovalNo,
        },
      });
      return { ok: true };
    }

    case "issue_cash_receipt": {
      // 현금영수증 발행. 세금계산서와 택1이라 현금영수증을 신청한 주문에서만 가능하다
      // (세금계산서 신청 주문엔 cashReceipt.requested 가 false → 여기서 막힘 = 이중발급 차단).
      if (!o.cashReceipt || !o.cashReceipt.requested) {
        return fail(409, "현금영수증을 신청한 주문이 아닙니다.");
      }
      if (o.cashReceipt.status === "ISSUED") {
        return fail(409, "이미 발행 완료된 현금영수증입니다.");
      }
      if (o.status === "CANCELLED") {
        return fail(409, "취소된 주문은 현금영수증을 발행할 수 없습니다.");
      }
      if (o.status === "PENDING") {
        return fail(409, "입금확인 후 발행할 수 있습니다.");
      }
      const phone = o.cashReceipt.phone ?? null;
      if (!phone) return fail(400, "현금영수증 발급용 휴대폰번호가 없습니다.");

      let approvalNo: string;
      try {
        const result = await getCashReceiptProvider().issue({
          orderNo,
          phone,
          supplyCost: o.supply,
          vat: o.vat,
          total: o.total,
        });
        approvalNo = result.approvalNo;
      } catch (e) {
        return fail(502, `현금영수증 발행에 실패했습니다: ${(e as Error).message}`);
      }

      await prisma.cashReceipt.update({
        where: { orderId: o.id },
        data: { status: "ISSUED", issuedAt: new Date(), approvalNo },
      });
      return { ok: true };
    }

    case "cancel": {
      // 취소·환불(반품 포함) 처리. 배송 전 취소든 배송 후 반품이든 여기서 마감한다.
      // 실제 환불 이체는 관리자가 계좌로 직접 처리하고, 여기선 결과만 기록한다.
      if (o.status === "CANCELLED") return fail(409, "이미 취소된 주문입니다.");
      // 입금대기는 관리자 취소 대상이 아니다(고객 셀프취소·입금기한 자동취소로 해소).
      if (o.status === "PENDING") {
        return fail(
          409,
          "입금대기 주문은 관리자가 취소할 수 없습니다. 고객 취소 또는 입금기한 자동취소로 처리됩니다.",
        );
      }
      await prisma.order.update({
        where: { orderNo },
        data: {
          status: "CANCELLED",
          canceledAt: new Date(),
          cancelReason: extra.reason?.trim() || "관리자 취소·환불 처리",
          payment: { update: { status: "CANCELLED" } },
        },
      });
      return { ok: true };
    }

    default:
      return fail(400, "알 수 없는 작업입니다.");
  }
}
