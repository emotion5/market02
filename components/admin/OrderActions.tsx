"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@/lib/orders";
import type { TaxInvoiceState } from "@/lib/admin";
import styles from "@/app/admin/admin.module.css";

// 주문 상세의 관리 동작: 입금확인 → 배송준비 → 배송시작(운송장) → 배송완료,
// 그리고 세금계산서 발행완료 처리.
export default function OrderActions({
  orderNo,
  status,
  tax,
}: {
  orderNo: string;
  status: OrderStatus;
  tax: TaxInvoiceState;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [courier, setCourier] = useState("");
  const [tracking, setTracking] = useState("");

  async function run(
    action: string,
    extra?: { courier?: string; trackingNumber?: string },
  ) {
    setBusy(true);
    const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderNo)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    setBusy(false);
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "처리에 실패했습니다.");
    }
  }

  const canIssueTax = tax === "pending" && status !== "pending";

  return (
    <div className={styles.orderActions}>
      {status === "pending" && (
        <div className={styles.orderActionRow}>
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            disabled={busy}
            onClick={() => run("confirm_deposit")}
          >
            입금 확인
          </button>
          <span className={styles.sectionDesc} style={{ margin: 0 }}>
            입금을 확인했으면 눌러 입금확인 상태로 전환합니다.
          </span>
        </div>
      )}

      {status === "paid" && (
        <div className={styles.orderActionRow}>
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            disabled={busy}
            onClick={() => run("start_preparing")}
          >
            배송 준비
          </button>
        </div>
      )}

      {status === "preparing" && (
        <div className={styles.trackForm}>
          <input
            className={styles.smallInput}
            value={courier}
            onChange={(e) => setCourier(e.target.value)}
            placeholder="택배사 (예: MMM 물류)"
          />
          <input
            className={styles.smallInput}
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="운송장번호"
          />
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            disabled={busy || !courier.trim() || !tracking.trim()}
            onClick={() =>
              run("start_shipping", {
                courier: courier.trim(),
                trackingNumber: tracking.trim(),
              })
            }
          >
            배송 시작
          </button>
        </div>
      )}

      {status === "shipping" && (
        <div className={styles.orderActionRow}>
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            disabled={busy}
            onClick={() => run("complete_delivery")}
          >
            배송 완료
          </button>
        </div>
      )}

      {status === "delivered" && (
        <p className={styles.sectionDesc} style={{ margin: 0 }}>
          배송이 완료된 주문입니다.
        </p>
      )}

      {canIssueTax && (
        <div className={styles.orderActionRow}>
          <button
            className={styles.button}
            disabled={busy}
            onClick={() => run("issue_tax_invoice")}
          >
            세금계산서 발행완료 처리
          </button>
          <span className={styles.sectionDesc} style={{ margin: 0 }}>
            국세청 발행 후 완료로 표시합니다.
          </span>
        </div>
      )}
    </div>
  );
}
