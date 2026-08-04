import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { makeOrderNo } from "@/lib/orders";
import { bankLabel } from "@/server/payments/toss";
import type { Order, OrderStatus, OrderDraftInput } from "@/lib/orders";
import type { CartItem } from "@/lib/types";

// 주문 도메인(생성/조회). localStorage 대체.
// 발행(주문) 시 가격은 클라이언트를 믿지 않고 DB 옵션가 + 회원 등급으로 재계산한다(스냅샷).

export class OrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderError";
  }
}

function baseVariantId(variantId: string): string {
  return variantId.split("::")[0];
}

async function isWholesaleUser(userId: string): Promise<boolean> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { grade: true, status: true },
  });
  return u?.grade === "WHOLESALE" && u?.status === "ACTIVE";
}

const STATUS_MAP: Record<string, OrderStatus> = {
  PENDING: "pending",
  PAID: "paid",
  PREPARING: "preparing",
  SHIPPING: "shipping",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

type OrderRow = Prisma.OrderGetPayload<{
  include: { items: true; taxInvoice: true; cashReceipt: true; payment: true };
}>;

function toOrder(o: OrderRow): Order {
  const items: CartItem[] = o.items.map((it) => ({
    productId: it.productId,
    variantId: it.variantId,
    productName: it.productName,
    variantName: it.variantName,
    price: it.unitPrice,
    image: it.image,
    quantity: it.quantity,
    color: it.color ?? undefined,
  }));
  return {
    orderNo: o.orderNo,
    createdAt: o.createdAt.toISOString(),
    status: STATUS_MAP[o.status] ?? "pending",
    items,
    total: o.total,
    supply: o.supply,
    vat: o.vat,
    orderer: {
      name: o.ordererName,
      tel: o.ordererTel,
      address: o.ordererAddress,
      memo: o.ordererMemo ?? undefined,
    },
    depositor: o.depositorName,
    taxInvoice: {
      requested: o.taxInvoice?.requested ?? false,
      bizNo: o.taxInvoice?.bizNo ?? undefined,
      company: o.taxInvoice?.company ?? undefined,
      issued: o.taxInvoice?.status === "ISSUED",
      issuedAt: o.taxInvoice?.issuedAt?.toISOString(),
      ntsApprovalNo: o.taxInvoice?.ntsApprovalNo ?? undefined,
    },
    cashReceipt: {
      requested: o.cashReceipt?.requested ?? false,
      phone: o.cashReceipt?.phone ?? undefined,
      issued: o.cashReceipt?.status === "ISSUED",
      issuedAt: o.cashReceipt?.issuedAt?.toISOString(),
      approvalNo: o.cashReceipt?.approvalNo ?? undefined,
    },
    courier: o.courier ?? undefined,
    trackingNumber: o.trackingNumber ?? undefined,
    paidAt: o.payment?.paidAt?.toISOString(),
    canceledAt: o.canceledAt?.toISOString(),
    cancelReason: o.cancelReason ?? undefined,
    virtualAccount:
      o.payment?.vaAccountNumber && o.payment.vaBank
        ? {
            bank: o.payment.vaBank,
            bankLabel: bankLabel(o.payment.vaBank),
            accountNumber: o.payment.vaAccountNumber,
            dueDate: o.payment.vaDueDate?.toISOString(),
          }
        : undefined,
  };
}

// 주문 생성 → 주문 DTO 반환. 무통장입금(입금대기)로 접수.
export async function placeOrder(
  userId: string,
  input: OrderDraftInput,
): Promise<Order> {
  if (!input.items.length) {
    throw new OrderError("주문할 상품이 없습니다.");
  }
  const { name, tel, address } = input.orderer;
  if (!name.trim() || !tel.trim() || !address.trim() || !input.depositor.trim()) {
    throw new OrderError("주문자·배송·입금자 정보를 모두 입력해주세요.");
  }
  // 증빙(택1) 검증 — 세금계산서면 사업자번호, 현금영수증이면 휴대폰번호가 필요하다.
  if (input.evidence.type === "tax_invoice") {
    const digits = input.evidence.bizNo.replace(/\D/g, "");
    if (digits.length !== 10) {
      throw new OrderError("세금계산서용 사업자등록번호를 확인해주세요.");
    }
  } else if (input.evidence.type === "cash_receipt") {
    const digits = input.evidence.phone.replace(/\D/g, "");
    if (digits.length < 10) {
      throw new OrderError("현금영수증용 휴대폰번호를 확인해주세요.");
    }
  }

  const baseIds = [...new Set(input.items.map((i) => baseVariantId(i.variantId)))];
  const variants = await prisma.variant.findMany({
    where: { id: { in: baseIds } },
    include: { product: true },
  });
  const vmap = new Map(variants.map((v) => [v.id, v]));
  const wholesale = await isWholesaleUser(userId);

  // 담긴 뒤 삭제된 옵션은 조용히 제외한다(화면에서 이미 대조·안내됨).
  const lineItems = input.items.flatMap((i) => {
    const v = vmap.get(baseVariantId(i.variantId));
    if (!v) return [];
    const unitPrice =
      wholesale && v.wholesalePrice != null ? v.wholesalePrice : v.price;
    return [
      {
        productId: v.productId,
        productName: v.product.name,
        variantId: i.variantId,
        variantName: v.name,
        color: i.color ?? null,
        image: v.product.repImage,
        unitPrice,
        quantity: Math.max(1, Math.floor(i.quantity)),
      },
    ];
  });
  if (!lineItems.length) {
    throw new OrderError("주문할 상품이 없습니다.");
  }

  const total = lineItems.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const supply = Math.round(total / 1.1);
  const vat = total - supply;

  // 선택한 증빙 하나만 생성한다(둘 다 만들지 않음 → 이중 증빙 원천 차단).
  const ev = input.evidence;
  const taxData =
    ev.type === "tax_invoice"
      ? {
          create: {
            requested: true,
            bizNo: ev.bizNo.trim() || null,
            company: ev.company?.trim() || null,
            status: "PENDING" as const, // 입금확인 후 관리자가 발행
          },
        }
      : undefined;
  const cashData =
    ev.type === "cash_receipt"
      ? {
          create: {
            requested: true,
            phone: ev.phone.trim() || null,
            status: "PENDING" as const,
          },
        }
      : undefined;

  for (let attempt = 0; attempt < 6; attempt++) {
    const now = new Date();
    const base = makeOrderNo(now);
    const orderNo =
      attempt === 0 ? base : `${base}-${Math.floor(Math.random() * 900 + 100)}`;
    try {
      const created = await prisma.order.create({
        data: {
          orderNo,
          userId,
          ordererName: name.trim(),
          ordererTel: tel.trim(),
          ordererAddress: address.trim(),
          ordererMemo: input.orderer.memo?.trim() || null,
          depositorName: input.depositor.trim(),
          paymentMethod: "BANK_TRANSFER",
          status: "PENDING",
          supply,
          vat,
          shippingFee: 0,
          total,
          items: { create: lineItems },
          taxInvoice: taxData,
          cashReceipt: cashData,
          // 가상계좌(토스페이먼츠) 결제 건. 발급 전에는 READY 이며, 발급/입금 시 승인·웹훅으로 갱신.
          payment: {
            create: {
              provider: "TOSS",
              method: "가상계좌",
              status: "READY",
              amount: total,
            },
          },
        },
        include: { items: true, taxInvoice: true, cashReceipt: true, payment: true },
      });
      return toOrder(created);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002" &&
        attempt < 5
      ) {
        continue; // 주문번호 충돌 → 재시도
      }
      throw e;
    }
  }
  throw new OrderError("주문번호 생성에 실패했습니다. 다시 시도해주세요.");
}

export type CancelResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

// 본인 주문 취소 — 입금 전(입금대기)만 셀프 취소 가능.
// 입금 후에는 돈이 오갔으므로 고객센터 요청 → 관리자 환불 처리로 안내한다.
export async function cancelOwnOrder(
  userId: string,
  orderNo: string,
): Promise<CancelResult> {
  const o = await prisma.order.findUnique({
    where: { orderNo },
    select: { userId: true, status: true },
  });
  if (!o || o.userId !== userId) {
    return { ok: false, status: 404, error: "주문을 찾을 수 없습니다." };
  }
  if (o.status !== "PENDING") {
    return {
      ok: false,
      status: 409,
      error:
        "입금 전(입금대기) 주문만 직접 취소할 수 있습니다. 입금 후에는 고객센터로 취소를 요청해주세요.",
    };
  }
  await prisma.order.update({
    where: { orderNo },
    data: {
      status: "CANCELLED",
      canceledAt: new Date(),
      cancelReason: "고객 취소(입금 전)",
      payment: { update: { status: "CANCELLED" } },
    },
  });
  return { ok: true };
}

export async function getUserOrder(
  orderNo: string,
  userId: string,
): Promise<Order | null> {
  const o = await prisma.order.findUnique({
    where: { orderNo },
    include: { items: true, taxInvoice: true, cashReceipt: true, payment: true },
  });
  if (!o || o.userId !== userId) return null;
  return toOrder(o);
}

// 택배사 조회 결과가 "배송완료"일 때 주문 상태를 배송중→배송완료로 자동 승격.
// 배송조회(읽기)에서 완료가 확인된 순간 호출한다. SHIPPING 인 건만 바꾸므로
// 멱등하고(이미 DELIVERED면 0건), 다른 상태(취소 등)로는 절대 되돌리지 않는다.
// 반환값: 이번 호출로 실제 승격됐으면 true.
export async function autoCompleteDelivery(
  orderNo: string,
  userId: string,
): Promise<boolean> {
  const res = await prisma.order.updateMany({
    where: { orderNo, userId, status: "SHIPPING" },
    data: { status: "DELIVERED" },
  });
  return res.count > 0;
}

export async function listUserOrders(userId: string): Promise<Order[]> {
  const rows = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { items: true, taxInvoice: true, cashReceipt: true, payment: true },
  });
  return rows.map(toOrder);
}
