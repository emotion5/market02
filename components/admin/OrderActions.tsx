"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@/lib/orders";
import type { TaxInvoiceState } from "@/lib/admin";
import { COURIERS } from "@/lib/couriers";
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
  const [reason, setReason] = useState("");

  async function run(
    action: string,
    extra?: { courier?: string; trackingNumber?: string; reason?: string },
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
  const taxIssued = tax === "issued";

  // 배송 나간 뒤(배송중·배송완료)면 반품, 그 전이면 취소로 표기.
  const isReturn = status === "shipping" || status === "delivered";
  const cancelLabel = isReturn ? "반품·환불 처리" : "취소·환불 처리";

  async function cancelOrder() {
    const confirmMsg = isReturn
      ? "이 주문을 반품·환불 처리합니다. 환불 이체를 완료한 뒤 진행하세요. 계속할까요?"
      : "이 주문을 취소·환불 처리합니다. 입금된 건이면 환불 이체를 완료한 뒤 진행하세요. 계속할까요?";
    if (!window.confirm(confirmMsg)) return;
    await run("cancel", { reason: reason.trim() || undefined });
  }

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
          {/* 택배사는 배송조회 코드 매핑을 위해 목록에서 선택한다(자유 입력 금지). */}
          <select
            className={styles.smallInput}
            value={courier}
            onChange={(e) => setCourier(e.target.value)}
          >
            <option value="">택배사 선택</option>
            {COURIERS.map((c) => (
              <option key={c.code} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
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
            세금계산서 발행
          </button>
          <span className={styles.sectionDesc} style={{ margin: 0 }}>
            지금 전자세금계산서를 발행합니다.
          </span>
        </div>
      )}

      {status === "cancelled" && (
        <p className={styles.sectionDesc} style={{ margin: 0 }}>
          취소·환불 처리된 주문입니다.
        </p>
      )}

      {/* 취소·환불은 입금완료 이후부터. 입금대기는 고객 셀프취소·입금기한
          자동취소로 해소되므로, 여기 버튼을 두지 않아 오취소를 막는다. */}
      {status !== "pending" && status !== "cancelled" && (
        <div className={styles.trackForm}>
          <input
            className={styles.smallInput}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="취소·환불 사유 (선택)"
          />
          <button
            className={styles.button}
            disabled={busy}
            onClick={cancelOrder}
          >
            {cancelLabel}
          </button>
          <span className={styles.sectionDesc} style={{ margin: 0 }}>
            실제 환불 이체를 완료한 뒤 눌러 취소로 기록합니다.
            {taxIssued && " 세금계산서 발행 건은 수정세금계산서가 필요합니다."}
          </span>
        </div>
      )}
    </div>
  );
}
