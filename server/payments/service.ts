import "server-only";
import { prisma } from "@/server/db";
import { portone } from "./portone";

// 포트원 결제 건(paymentId = 우리 orderNo)을 조회해 DB 를 "실제 상태"로 맞춘다.
// 웹훅과 프론트 동기화가 모두 이 함수를 거친다 — 웹훅 본문을 믿지 않고 포트원에
// 직접 재조회(getPayment)하므로 위조·재전송에 안전하다.
//   - VIRTUAL_ACCOUNT_ISSUED → 발급 계좌정보 저장(입금 안내용)
//   - PAID                   → 금액 대조 후 주문 입금확인(멱등)
//   - FAILED / CANCELLED     → 미입금 상태면 주문 취소
export async function syncPayment(paymentId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { orderNo: paymentId },
    include: { payment: true },
  });
  if (!order) return; // 우리 주문이 아님 → 무시

  const payment = await portone.payment.getPayment({ paymentId });
  const raw = JSON.parse(JSON.stringify(payment)); // Json 컬럼 저장용(감사)

  switch (payment.status) {
    case "VIRTUAL_ACCOUNT_ISSUED": {
      const method = payment.method;
      if (method?.type === "PaymentMethodVirtualAccount") {
        await prisma.payment.update({
          where: { orderId: order.id },
          data: {
            provider: "PORTONE",
            method: "가상계좌",
            status: "READY",
            pgTid: payment.transactionId ?? null,
            vaBank: method.bank ?? null,
            vaAccountNumber: method.accountNumber,
            vaDueDate: method.expiredAt ? new Date(method.expiredAt) : null,
            raw,
          },
        });
      }
      break;
    }

    case "PAID": {
      // 금액 대조 — 실제 결제금액이 주문 총액과 다르면 절대 입금확인하지 않는다.
      if (payment.amount.total !== order.total) {
        console.error(
          `[portone] 금액 불일치 order=${paymentId} 주문=${order.total} 결제=${payment.amount.total}`,
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
              provider: "PORTONE",
              status: "PAID",
              paidAt: new Date(),
              pgTid: payment.transactionId ?? null,
              raw,
            },
          }),
        ]);
      }
      break;
    }

    case "FAILED":
    case "CANCELLED": {
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
              status: payment.status === "CANCELLED" ? "CANCELLED" : "FAILED",
              raw,
            },
          }),
        ]);
      }
      break;
    }
  }
}
