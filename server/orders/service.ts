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
  include: { items: true; taxInvoice: true; payment: true };
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
    },
    courier: o.courier ?? undefined,
    trackingNumber: o.trackingNumber ?? undefined,
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
  if (input.taxInvoice.requested) {
    const digits = (input.taxInvoice.bizNo ?? "").replace(/\D/g, "");
    if (digits.length !== 10) {
      throw new OrderError("세금계산서용 사업자등록번호를 확인해주세요.");
    }
  }

  const baseIds = [...new Set(input.items.map((i) => baseVariantId(i.variantId)))];
  const variants = await prisma.variant.findMany({
    where: { id: { in: baseIds } },
    include: { product: true },
  });
  const vmap = new Map(variants.map((v) => [v.id, v]));
  const wholesale = await isWholesaleUser(userId);

  const lineItems = input.items.map((i) => {
    const v = vmap.get(baseVariantId(i.variantId));
    if (!v) {
      throw new OrderError(
        "일부 상품 정보가 변경되었습니다. 견적서를 새로 담아주세요.",
      );
    }
    const unitPrice =
      wholesale && v.wholesalePrice != null ? v.wholesalePrice : v.price;
    return {
      productId: v.productId,
      productName: v.product.name,
      variantId: i.variantId,
      variantName: v.name,
      color: i.color ?? null,
      image: v.product.repImage,
      unitPrice,
      quantity: Math.max(1, Math.floor(i.quantity)),
    };
  });

  const total = lineItems.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const supply = Math.round(total / 1.1);
  const vat = total - supply;

  const taxData = input.taxInvoice.requested
    ? {
        create: {
          requested: true,
          bizNo: (input.taxInvoice.bizNo ?? "").trim() || null,
          company: input.taxInvoice.company?.trim() || null,
          status: "PENDING" as const, // 입금확인 후 관리자가 발행
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
        include: { items: true, taxInvoice: true, payment: true },
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

export async function getUserOrder(
  orderNo: string,
  userId: string,
): Promise<Order | null> {
  const o = await prisma.order.findUnique({
    where: { orderNo },
    include: { items: true, taxInvoice: true, payment: true },
  });
  if (!o || o.userId !== userId) return null;
  return toOrder(o);
}

export async function listUserOrders(userId: string): Promise<Order[]> {
  const rows = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { items: true, taxInvoice: true, payment: true },
  });
  return rows.map(toOrder);
}
