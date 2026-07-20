"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminCategoryRow } from "@/lib/admin";
import styles from "@/app/admin/admin.module.css";

export default function CategoryVisibilityForm({
  categories,
}: {
  categories: AdminCategoryRow[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState<AdminCategoryRow[]>(categories);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const toggle = (slug: string, key: "showInNav" | "showOnHome") =>
    setRows((prev) =>
      prev.map((r) => (r.slug === slug ? { ...r, [key]: !r[key] } : r)),
    );

  async function save() {
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          categories: rows.map((r) => ({
            slug: r.slug,
            showInNav: r.showInNav,
            showOnHome: r.showOnHome,
          })),
        }),
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

  return (
    <div className={styles.card} style={{ padding: 24 }}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>카테고리</th>
            <th>내비 노출</th>
            <th>홈 노출</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.slug}>
              <td>
                {r.name} <span className={styles.pId}>{r.slug}</span>
              </td>
              <td style={{ textAlign: "center" }}>
                <input
                  type="checkbox"
                  checked={r.showInNav}
                  onChange={() => toggle(r.slug, "showInNav")}
                  aria-label={`${r.name} 내비 노출`}
                />
              </td>
              <td style={{ textAlign: "center" }}>
                <input
                  type="checkbox"
                  checked={r.showOnHome}
                  onChange={() => toggle(r.slug, "showOnHome")}
                  aria-label={`${r.name} 홈 노출`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.formActions}>
        {error && <span className={styles.errorText}>{error}</span>}
        {saved && <span className={styles.savedText}>저장되었습니다.</span>}
        <button
          type="button"
          className={`${styles.button} ${styles.buttonPrimary}`}
          onClick={save}
          disabled={saving}
        >
          {saving ? "저장 중…" : "노출 설정 저장"}
        </button>
      </div>
    </div>
  );
}
