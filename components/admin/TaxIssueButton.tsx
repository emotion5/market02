"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/admin/admin.module.css";

// 세금계산서 목록의 인라인 발행 버튼. 주문상세와 동일한 issue API 를 호출한다(로직 단일화).
export default function TaxIssueButton({ orderNo }: { orderNo: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function issue() {
    setBusy(true);
    const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderNo)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "issue_tax_invoice" }),
    });
    setBusy(false);
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "발행에 실패했습니다.");
    }
  }

  return (
    <button
      className={`${styles.button} ${styles.buttonPrimary}`}
      onClick={issue}
      disabled={busy}
    >
      {busy ? "발행 중…" : "발행"}
    </button>
  );
}
