"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/admin/admin.module.css";

// 회원 상세의 관리 동작: 등급(회원도매가) 부여/회수 + 정지/해제.
// (승인 대기 사업자의 승인/반려는 MemberActions 가 담당)
export default function MemberControls({
  id,
  status,
  grade,
}: {
  id: string;
  status: string;
  grade: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const canManage = status === "ACTIVE" || status === "SUSPENDED";
  const isWholesale = grade === "WHOLESALE";

  async function post(path: string, body?: unknown) {
    setBusy(true);
    const res = await fetch(`/api/admin/members/${id}/${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
    setBusy(false);
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "처리에 실패했습니다.");
    }
  }

  function toggleGrade() {
    const next = isWholesale ? "GENERAL" : "WHOLESALE";
    const msg = isWholesale
      ? "이 회원의 회원도매가 자격을 회수할까요? (소비자가로 전환)"
      : "이 회원에게 회원도매가 자격을 부여할까요?";
    if (!window.confirm(msg)) return;
    post("grade", { grade: next });
  }

  function suspend() {
    const reason = window.prompt("정지 사유를 입력하세요 (선택):") ?? "";
    if (!window.confirm("이 회원을 정지하시겠습니까? 로그인·이용이 차단됩니다.")) {
      return;
    }
    post("suspend", { reason });
  }

  function reactivate() {
    if (!window.confirm("이 회원의 정지를 해제하시겠습니까?")) return;
    post("reactivate");
  }

  if (!canManage) return null;

  return (
    <div className={styles.controlRows}>
      <div className={styles.controlRow}>
        <div className={styles.controlLabel}>
          <span>등급</span>
          <strong>{isWholesale ? "회원도매가" : "일반(소비자가)"}</strong>
        </div>
        <button className={styles.button} disabled={busy} onClick={toggleGrade}>
          {isWholesale ? "회원도매가 회수" : "회원도매가 부여"}
        </button>
      </div>

      <div className={styles.controlRow}>
        <div className={styles.controlLabel}>
          <span>상태</span>
          <strong>{status === "SUSPENDED" ? "정지됨" : "활성"}</strong>
        </div>
        {status === "SUSPENDED" ? (
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            disabled={busy}
            onClick={reactivate}
          >
            정지 해제
          </button>
        ) : (
          <button
            className={`${styles.button} ${styles.buttonDanger}`}
            disabled={busy}
            onClick={suspend}
          >
            정지
          </button>
        )}
      </div>
    </div>
  );
}
