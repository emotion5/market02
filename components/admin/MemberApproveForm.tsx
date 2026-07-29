"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/admin/admin.module.css";

// 사업자 승인 폼 (PENDING 사업자 전용).
// 관리자가 사업자등록증을 보면서 세금계산서 필수적기재사항(상호·대표자)과
// 문서 표기용 상세(주소·업태·종목·담당자·수신이메일)를 확정한 뒤 승인한다.
export interface MemberApproveInitial {
  company: string;
  owner: string;
  address: string;
  bizType: string;
  bizItem: string;
  managerName: string;
  managerTel: string;
  taxEmail: string;
  accountEmail: string; // taxEmail 미입력 시 기본값 안내용
}

export default function MemberApproveForm({
  id,
  initial,
}: {
  id: string;
  initial: MemberApproveInitial;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    company: initial.company,
    owner: initial.owner,
    address: initial.address,
    bizType: initial.bizType,
    bizItem: initial.bizItem,
    managerName: initial.managerName,
    managerTel: initial.managerTel,
    taxEmail: initial.taxEmail,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const canApprove = form.company.trim() !== "" && form.owner.trim() !== "";

  async function approve() {
    if (!canApprove) {
      setError("상호와 대표자는 세금계산서 발행에 필요합니다.");
      return;
    }
    if (!window.confirm("입력한 사업자 정보로 승인하시겠습니까?")) return;
    setError("");
    setBusy(true);
    const res = await fetch(`/api/admin/members/${id}/approve`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "승인에 실패했습니다.");
    }
  }

  async function reject() {
    const reason = window.prompt("반려 사유를 입력하세요 (선택):") ?? "";
    setError("");
    setBusy(true);
    const res = await fetch(`/api/admin/members/${id}/reject`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else setError("반려 처리에 실패했습니다.");
  }

  const field = (
    key: keyof typeof form,
    label: string,
    opts: { placeholder?: string; required?: boolean } = {},
  ) => (
    <div className={styles.field}>
      <label className={styles.label}>
        {label}
        {opts.required && " *"}
      </label>
      <input
        className={styles.input}
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
        placeholder={opts.placeholder}
      />
    </div>
  );

  return (
    <div>
      <p className={styles.sectionDesc}>
        사업자등록증을 확인하고 아래 정보를 채운 뒤 승인하세요. 상호·대표자는
        세금계산서 발행에 필요합니다.
      </p>
      {field("company", "상호", { required: true })}
      {field("owner", "대표자", { required: true })}
      {field("address", "사업장 주소")}
      {field("bizType", "업태")}
      {field("bizItem", "종목")}
      {field("managerName", "담당자명")}
      {field("managerTel", "담당자 연락처")}
      {field("taxEmail", "세금계산서 수신 이메일", {
        placeholder: `미입력 시 계정 이메일(${initial.accountEmail}) 사용`,
      })}

      {error && (
        <p className={styles.errorText} role="alert">
          {error}
        </p>
      )}

      <div className={styles.actions} style={{ marginTop: 12 }}>
        <button
          className={`${styles.button} ${styles.buttonPrimary}`}
          disabled={busy || !canApprove}
          onClick={approve}
        >
          승인
        </button>
        <button
          className={`${styles.button} ${styles.buttonDanger}`}
          disabled={busy}
          onClick={reject}
        >
          반려
        </button>
      </div>
    </div>
  );
}
