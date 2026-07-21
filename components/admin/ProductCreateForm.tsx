"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/admin/admin.module.css";

export default function ProductCreateForm({
  categories,
}: {
  categories: { slug: string; name: string }[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [categorySlug, setCategorySlug] = useState(categories[0]?.slug ?? "");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [isActive, setIsActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          categorySlug,
          summary: summary || undefined,
          description,
          price: Number(price),
          isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "등록에 실패했습니다.");
        return;
      }
      // 생성 후 편집 페이지로 (옵션·색상·이미지 다듬기)
      router.push(`/admin/products/${data.id}/edit`);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <p className={styles.sectionDesc}>
        상품 ID는 <b>카테고리-순번</b>으로 자동 부여됩니다. 기본 옵션 1개가 함께
        생성되며, 저장 후 편집 화면에서 옵션·색상·이미지를 추가하세요.
      </p>

      <div className={styles.field}>
        <label className={styles.label}>상품명</label>
        <input
          className={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>카테고리</label>
        <select
          className={styles.select}
          value={categorySlug}
          onChange={(e) => setCategorySlug(e.target.value)}
        >
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>한 줄 요약 (선택)</label>
        <input
          className={styles.input}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>설명</label>
        <textarea
          className={styles.textarea}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>대표가 (원)</label>
        <input
          className={styles.input}
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.checkRow}>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <span>활성 (쇼핑몰에 노출) — 이미지 등록 후 켜는 것을 권장</span>
        </label>
      </div>

      <div className={styles.formActions}>
        {error && <span className={styles.errorText}>{error}</span>}
        <button
          type="submit"
          className={`${styles.button} ${styles.buttonPrimary}`}
          disabled={saving}
        >
          {saving ? "등록 중…" : "등록하고 옵션·이미지 편집"}
        </button>
      </div>
    </form>
  );
}
