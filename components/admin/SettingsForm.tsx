"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SiteSettings } from "@/lib/types";
import styles from "@/app/admin/admin.module.css";

// 문자열 필드 키(= quoteValidDays 제외 전부)
type StrKey = Exclude<keyof SiteSettings, "quoteValidDays">;

export default function SettingsForm({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  const [form, setForm] = useState<SiteSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const set = (key: StrKey, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "저장에 실패했습니다.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  const field = (key: StrKey, label: string, placeholder?: string) => (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <input
        className={styles.input}
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.card} style={{ padding: 24, marginBottom: 20 }}>
        <h2 className={styles.sectionTitle}>공급자 정보</h2>
        <p className={styles.sectionDesc}>견적서·체크아웃에 표시됩니다.</p>
        {field("supplierName", "상호")}
        {field("supplierOwner", "대표자")}
        {field("supplierBizNo", "사업자등록번호", "000-00-00000")}
        {field("supplierAddress", "주소")}
        {field("supplierCategory", "업태 / 종목")}
        {field("supplierTel", "전화번호")}
      </div>

      <div className={styles.card} style={{ padding: 24, marginBottom: 20 }}>
        <h2 className={styles.sectionTitle}>무통장입금 계좌</h2>
        <p className={styles.sectionDesc}>체크아웃 무통장입금 안내에 표시됩니다.</p>
        {field("bankName", "은행")}
        {field("bankAccountNumber", "계좌번호")}
        {field("bankAccountHolder", "예금주")}
      </div>

      <div className={styles.card} style={{ padding: 24, marginBottom: 20 }}>
        <h2 className={styles.sectionTitle}>견적서</h2>
        <div className={styles.field}>
          <label className={styles.label}>유효기간 (발행일로부터 일수)</label>
          <input
            className={styles.input}
            type="number"
            min={1}
            max={365}
            value={form.quoteValidDays}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                quoteValidDays: Number(e.target.value),
              }))
            }
          />
        </div>
      </div>

      <div className={styles.card} style={{ padding: 24, marginBottom: 20 }}>
        <h2 className={styles.sectionTitle}>고객센터</h2>
        <p className={styles.sectionDesc}>계정찾기 등 안내 화면에 표시됩니다.</p>
        {field("csEmail", "이메일")}
        {field("csTel", "전화번호")}
      </div>

      <div className={styles.formActions}>
        {error && <span className={styles.errorText}>{error}</span>}
        {saved && <span className={styles.savedText}>저장되었습니다.</span>}
        <button
          type="submit"
          className={`${styles.button} ${styles.buttonPrimary}`}
          disabled={saving}
        >
          {saving ? "저장 중…" : "설정 저장"}
        </button>
      </div>
    </form>
  );
}
