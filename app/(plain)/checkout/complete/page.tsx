"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";
import { type Order } from "@/lib/orders";
import styles from "../page.module.css";

function CompleteInner() {
  const params = useSearchParams();
  const { clearCart } = useCart();
  const [status, setStatus] = useState<"confirming" | "done" | "error">(
    "confirming",
  );
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const ran = useRef(false); // 승인은 1회만 (StrictMode 이중 호출 방지)

  const paymentKey = params.get("paymentKey");
  const orderId = params.get("orderId");
  const amount = params.get("amount");

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      if (!paymentKey || !orderId || !amount) {
        setError("결제 정보가 올바르지 않습니다.");
        setStatus("error");
        return;
      }
      try {
        const res = await fetch("/api/payments/toss/confirm", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "결제 승인에 실패했습니다.");
          setStatus("error");
          return;
        }
        setOrder(data.order as Order);
        clearCart();
        setStatus("done");
        window.scrollTo(0, 0);
      } catch {
        setError("네트워크 오류가 발생했습니다.");
        setStatus("error");
      }
    })();
  }, [paymentKey, orderId, amount, clearCart]);

  if (status === "confirming") {
    return (
      <div className={styles.page}>
        <div className={styles.doneCard}>
          <h1 className={styles.doneTitle}>결제를 확인하고 있습니다…</h1>
          <p className={styles.doneText}>잠시만 기다려주세요.</p>
        </div>
      </div>
    );
  }

  if (status === "error" || !order) {
    return (
      <div className={styles.page}>
        <div className={styles.doneCard}>
          <h1 className={styles.doneTitle}>결제 처리에 문제가 있습니다</h1>
          <p className={styles.doneText}>{error}</p>
          <div className={styles.doneActions}>
            <Link href="/mypage/orders" className={styles.secondaryAction}>
              주문내역 보기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.doneCard}>
        <p className={styles.doneBadge}>주문 접수 완료</p>
        <h1 className={styles.doneTitle}>입금을 기다리고 있습니다</h1>
        <p className={styles.doneText}>
          주문번호 <strong>{order.orderNo}</strong>
          <br />
          아래 <strong>전용 가상계좌</strong>로 입금해주시면 자동으로 확인됩니다.
        </p>

        {order.virtualAccount ? (
          <dl className={styles.depositBox}>
            <div>
              <dt>입금 은행</dt>
              <dd>{order.virtualAccount.bankLabel}</dd>
            </div>
            <div>
              <dt>가상계좌번호</dt>
              <dd>{order.virtualAccount.accountNumber}</dd>
            </div>
            <div className={styles.depositAmount}>
              <dt>입금 금액</dt>
              <dd>{formatPrice(order.total)}</dd>
            </div>
            {order.virtualAccount.dueDate && (
              <div>
                <dt>입금 기한</dt>
                <dd>
                  {new Date(order.virtualAccount.dueDate).toLocaleString(
                    "ko-KR",
                  )}
                </dd>
              </div>
            )}
          </dl>
        ) : (
          <p className={styles.doneText}>
            전용 가상계좌를 발급 중입니다. 잠시 후{" "}
            <Link href="/mypage/orders">주문내역</Link>에서 계좌번호를
            확인해주세요.
          </p>
        )}

        <p className={styles.doneNotice}>
          입금이 확인되면 <strong>자동으로</strong> 주문이 처리됩니다. 입금기한이
          지나면 주문은 자동 취소됩니다.
          {order.taxInvoice.requested && (
            <>
              <br />
              세금계산서는 입금 확인 후 사업자등록번호{" "}
              <strong>{order.taxInvoice.bizNo}</strong> 로 발행됩니다.
            </>
          )}
        </p>

        <div className={styles.doneActions}>
          <Link href="/" className={styles.primaryAction}>
            확인
          </Link>
          <Link href="/mypage/orders" className={styles.secondaryAction}>
            주문내역 보기
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutCompletePage() {
  return (
    <Suspense fallback={null}>
      <CompleteInner />
    </Suspense>
  );
}
