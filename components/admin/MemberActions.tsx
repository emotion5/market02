"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/admin/admin.module.css";

// 승인/반려 버튼 (client). 처리 후 목록을 새로고침.
export default function MemberActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(kind: "approve" | "reject") {
    let reason = "";
    if (kind === "reject") {
      reason = window.prompt("반려 사유를 입력하세요 (선택):") ?? "";
    } else if (!window.confirm("이 사업자를 승인하시겠습니까?")) {
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/admin/members/${id}/${kind}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else alert("처리에 실패했습니다.");
  }

  return (
    <div className={styles.actions}>
      <button
        className={`${styles.button} ${styles.buttonPrimary}`}
        disabled={busy}
        onClick={() => act("approve")}
      >
        승인
      </button>
      <button
        className={`${styles.button} ${styles.buttonDanger}`}
        disabled={busy}
        onClick={() => act("reject")}
      >
        반려
      </button>
    </div>
  );
}
