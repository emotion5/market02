"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProductNoticeFields, {
  type NoticeValues,
} from "@/components/admin/ProductNoticeFields";
import styles from "@/app/admin/admin.module.css";

interface Product {
  id: string;
  name: string;
  categorySlug: string;
  summary: string | null;
  description: string;
  price: number;
  isActive: boolean;
  modelName: string | null;
  origin: string | null;
  maker: string | null;
  dimensions: string | null;
  material: string | null;
  colorInfo: string | null;
  composition: string | null;
  certInfo: string | null;
}

export default function ProductEditForm({
  product,
  categories,
}: {
  product: Product;
  categories: { slug: string; name: string }[];
}) {
  const router = useRouter();
  const [name, setName] = useState(product.name);
  const [categorySlug, setCategorySlug] = useState(product.categorySlug);
  const [summary, setSummary] = useState(product.summary ?? "");
  const [description, setDescription] = useState(product.description);
  const [price, setPrice] = useState(String(product.price));
  const [isActive, setIsActive] = useState(product.isActive);
  const [notice, setNotice] = useState<NoticeValues>({
    modelName: product.modelName ?? "",
    origin: product.origin ?? "",
    maker: product.maker ?? "",
    dimensions: product.dimensions ?? "",
    material: product.material ?? "",
    colorInfo: product.colorInfo ?? "",
    composition: product.composition ?? "",
    certInfo: product.certInfo ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          categorySlug,
          summary: summary || undefined,
          description,
          price: Number(price),
          isActive,
          ...notice,
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
    <form className={styles.form} onSubmit={handleSubmit}>
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
          placeholder="목록 카드용 요약"
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
          <span>활성 (쇼핑몰에 노출)</span>
        </label>
      </div>

      <h2 className={styles.sectionTitle}>상품정보제공고시</h2>
      <ProductNoticeFields value={notice} onChange={setNotice} />

      <div className={styles.formActions}>
        {error && <span className={styles.errorText}>{error}</span>}
        {saved && <span className={styles.savedText}>저장되었습니다.</span>}
        <button
          type="submit"
          className={`${styles.button} ${styles.buttonPrimary}`}
          disabled={saving}
        >
          {saving ? "저장 중…" : "변경 사항 저장"}
        </button>
        <button
          type="button"
          className={styles.button}
          onClick={() => router.push("/admin/products")}
        >
          목록으로
        </button>
      </div>
    </form>
  );
}
