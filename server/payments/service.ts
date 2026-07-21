import "server-only";
import { prisma } from "@/server/db";
import {
  confirmPayment as tossConfirm,
  getPaymentByOrderId,
  type TossPayment,
} from "./toss";

// 토스페이먼츠 결제 건(orderId = 우리 orderNo)을 우리 DB 에 반영한다.
//   - confirmPayment : successUrl 복귀 후 서버에서 승인(가상계좌 발급) → 계좌 저장
//   - syncPayment    : 입금통보 웹훅 시 토스에 재조회해 DB 를 "실제 상태"로 맞춘다
//                      (웹훅 본문을 믿지 않고 getPaymentByOrderId 로 재검증)

type OrderWithPayment = {
  id: string;
  orderNo: string;
  total: number;
  status: string;
};

// 토스 결제 상태를 우리 DB 에 멱등하게 반영.
async function apply(
  order: OrderWithPayment,
  payment: TossPayment,
): Promise<void> {
  const raw = JSON.parse(JSON.stringify(payment)); // Json 컬럼 저장용(감사)
  const va = payment.virtualAccount;

  switch (payment.status) {
    case "WAITING_FOR_DEPOSIT": {
      // 가상계좌 발급됨 → 입금 안내용 계좌정보 저장.
      if (va) {
        await prisma.payment.update({
          where: { orderId: order.id },
          data: {
            provider: "TOSS",
            method: "가상계좌",
            status: "READY",
            pgTid: payment.paymentKey,
            vaBank: va.bankCode ?? null,
            vaAccountNumber: va.accountNumber,
            vaDueDate: va.dueDate ? new Date(va.dueDate) : null,
            raw,
          },
        });
      }
      break;
    }

    case "DONE": {
      // 금액 대조 — 실제 결제금액이 주문 총액과 다르면 절대 입금확인하지 않는다.
      if (payment.totalAmount !== order.total) {
        console.error(
          `[toss] 금액 불일치 order=${order.orderNo} 주문=${order.total} 결제=${payment.totalAmount}`,
        );
        return;
      }
      // 멱등 — 아직 입금대기일 때만 확정(웹훅 중복 도착 대비).
      if (order.status === "PENDING") {
        await prisma.$transaction([
          prisma.order.update({
            where: { id: order.id },
            data: { status: "PAID" },
          }),
          prisma.payment.update({
            where: { orderId: order.id },
            data: {
              provider: "TOSS",
              status: "PAID",
              paidAt: new Date(),
              pgTid: payment.paymentKey,
              raw,
            },
          }),
        ]);
      }
      break;
    }

    case "CANCELED":
    case "EXPIRED":
    case "ABORTED": {
      // 입금기한 만료·결제실패 → 아직 미결제(입금대기)면 주문 취소.
      if (order.status === "PENDING") {
        await prisma.$transaction([
          prisma.order.update({
            where: { id: order.id },
            data: { status: "CANCELLED" },
          }),
          prisma.payment.update({
            where: { orderId: order.id },
            data: {
              status: payment.status === "CANCELED" ? "CANCELLED" : "FAILED",
              raw,
            },
          }),
        ]);
      }
      break;
    }
  }
}

// successUrl 복귀 후 서버 승인 — 금액 검증 후 토스 승인 API 호출, 결과를 DB 반영.
export async function confirmPayment(
  orderNo: string,
  paymentKey: string,
  amount: number,
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { orderNo },
    select: { id: true, orderNo: true, total: true, status: true },
  });
  if (!order) throw new Error("주문을 찾을 수 없습니다.");
  // 위변조 방지 — 쿼리로 넘어온 금액이 서버 주문총액과 다르면 승인하지 않는다.
  if (amount !== order.total) {
    throw new Error("결제 금액이 주문 금액과 일치하지 않습니다.");
  }
  const payment = await tossConfirm({ paymentKey, orderId: orderNo, amount });
  await apply(order, payment);
}

// 입금통보 웹훅/재동기화 — 토스에 재조회해 DB 를 실제 상태로 맞춘다.
export async function syncPayment(orderNo: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { orderNo },
    select: { id: true, orderNo: true, total: true, status: true },
  });
  if (!order) return; // 우리 주문이 아님 → 무시

  const payment = await getPaymentByOrderId(orderNo);
  if (!payment) return;
  await apply(order, payment);
}
