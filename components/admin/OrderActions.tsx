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
  cash,
}: {
  orderNo: string;
  status: OrderStatus;
  tax: TaxInvoiceState;
  cash: "none" | "pending" | "issued";
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
  const canIssueCash = cash === "pending" && status !== "pending";
  const evidenceIssued = tax === "issued" || cash === "issued";
  // A안: 증빙은 배송완료 후 발행이 원칙(공급시기 = 인도). 그 전 발행은 "선발행"으로 경고.
  const delivered = status === "delivered";

  // 증빙 발행. 배송완료 전이면 선발행 경고 후 진행(취소 시 되돌림이 필요할 수 있음).
  function issueEvidence(kind: "tax" | "cash") {
    if (!delivered) {
      const label = kind === "tax" ? "세금계산서" : "현금영수증";
      const reverse = kind === "tax" ? "수정세금계산서 발행" : "현금영수증 취소";
      if (
        !window.confirm(
          `배송완료 전 ${label} 선발행입니다.\n주문이 취소되면 ${reverse}를 따로 처리해야 할 수 있어요. 진행할까요?`,
        )
      ) {
        return;
      }
    }
    run(kind === "tax" ? "issue_tax_invoice" : "issue_cash_receipt");
  }

  // 배송 나간 뒤(배송중·배송완료)면 반품, 그 전이면 취소로 표기.
  const isReturn = status === "shipping" || status === "delivered";
  const cancelLabel = isReturn ? "반품·환불 처리" : "취소·환불 처리";

  async function cancelOrder() {
    let confirmMsg = isReturn
      ? "이 주문을 반품·환불 처리합니다. 환불 이체를 완료한 뒤 진행하세요. 계속할까요?"
      : "이 주문을 취소·환불 처리합니다. 입금된 건이면 환불 이체를 완료한 뒤 진행하세요. 계속할까요?";
    // ① 최소 안내: 이미 발행된 증빙이 있으면 취소만으로 끝나지 않음을 분명히 알린다.
    if (evidenceIssued) {
      confirmMsg +=
        "\n\n⚠ 이미 발행된 증빙이 있습니다. 취소 후 수정세금계산서 발행 / 현금영수증 취소를 국세청·발급대행에서 별도로 처리해야 합니다.";
    }
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
            onClick={() => issueEvidence("tax")}
          >
            {delivered ? "세금계산서 발행" : "세금계산서 선발행"}
          </button>
          <span className={styles.sectionDesc} style={{ margin: 0 }}>
            {delivered
              ? "지금 전자세금계산서를 발행합니다."
              : "배송완료 후 발행을 권장합니다(취소 시 수정세금계산서 방지). 지금은 선발행."}
          </span>
        </div>
      )}

      {canIssueCash && (
        <div className={styles.orderActionRow}>
          <button
            className={styles.button}
            disabled={busy}
            onClick={() => issueEvidence("cash")}
          >
            {delivered ? "현금영수증 발행" : "현금영수증 선발행"}
          </button>
          <span className={styles.sectionDesc} style={{ margin: 0 }}>
            {delivered
              ? "지금 소득공제용 현금영수증을 발행합니다."
              : "배송완료 후 발행을 권장합니다(취소 시 취소 처리 방지). 지금은 선발행."}
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
            {tax === "issued" &&
              " 세금계산서 발행 건은 수정세금계산서가 필요합니다."}
            {cash === "issued" &&
              " 현금영수증 발행 건은 발급 취소가 필요합니다."}
          </span>
        </div>
      )}
    </div>
  );
}
