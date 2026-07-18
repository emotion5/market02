"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/admin/admin.module.css";

interface VariantIn {
  id?: string;
  name: string;
  price: number;
  wholesalePrice: number | null;
}

// 폼 내부는 입력 편의를 위해 문자열로 다룬다.
interface VForm {
  id?: string;
  name: string;
  price: string;
  wholesalePrice: string;
}

interface Props {
  productId: string;
  variants: VariantIn[];
  colors: string[];
}

export default function ProductOptionsForm({
  productId,
  variants: initVariants,
  colors: initColors,
}: Props) {
  const router = useRouter();
  const [variants, setVariants] = useState<VForm[]>(
    initVariants.map((v) => ({
      id: v.id,
      name: v.name,
      price: String(v.price),
      wholesalePrice: v.wholesalePrice == null ? "" : String(v.wholesalePrice),
    })),
  );
  const [colors, setColors] = useState<string[]>(initColors);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const patchV = (i: number, patch: Partial<VForm>) =>
    setVariants((vs) => vs.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  const addV = () =>
    setVariants((vs) => [...vs, { name: "", price: "0", wholesalePrice: "" }]);
  const removeV = (i: number) =>
    setVariants((vs) => vs.filter((_, idx) => idx !== i));

  const addColor = () => setColors((cs) => [...cs, "#cccccc"]);
  const setColor = (i: number, hex: string) =>
    setColors((cs) => cs.map((c, idx) => (idx === i ? hex : c)));
  const removeColor = (i: number) =>
    setColors((cs) => cs.filter((_, idx) => idx !== i));

  async function save() {
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const payload = {
        variants: variants.map((v) => ({
          id: v.id,
          name: v.name.trim(),
          price: Number(v.price) || 0,
          wholesalePrice:
            v.wholesalePrice.trim() === "" ? null : Number(v.wholesalePrice),
        })),
        colors,
      };
      const res = await fetch(`/api/admin/products/${productId}/options`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
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
    <div>
      <h2 className={styles.sectionTitle}>옵션</h2>
      <p className={styles.sectionDesc}>
        옵션별 소비자가와 회원도매가(비우면 소비자가 적용)를 설정합니다. 최소 1개
        필요.
      </p>

      <div className={styles.optHeader}>
        <span>옵션명</span>
        <span>소비자가</span>
        <span>회원도매가</span>
        <span></span>
      </div>
      {variants.map((v, i) => (
        <div key={v.id ?? `new-${i}`} className={styles.optRow}>
          <input
            className={styles.smallInput}
            value={v.name}
            onChange={(e) => patchV(i, { name: e.target.value })}
            placeholder="예: 기본, 무광 블랙"
          />
          <input
            className={styles.smallInput}
            type="number"
            min={0}
            value={v.price}
            onChange={(e) => patchV(i, { price: e.target.value })}
          />
          <input
            className={styles.smallInput}
            type="number"
            min={0}
            value={v.wholesalePrice}
            onChange={(e) => patchV(i, { wholesalePrice: e.target.value })}
            placeholder="(비우면 소비자가)"
          />
          <button
            type="button"
            className={styles.linkBtn}
            onClick={() => removeV(i)}
            disabled={variants.length <= 1}
            title={variants.length <= 1 ? "옵션은 최소 1개 필요" : "삭제"}
          >
            삭제
          </button>
        </div>
      ))}
      <button type="button" className={styles.addBtn} onClick={addV}>
        + 옵션 추가
      </button>

      <h2 className={styles.sectionTitle} style={{ marginTop: 28 }}>
        색상
      </h2>
      <p className={styles.sectionDesc}>상세 페이지 색상 스와치 (선택).</p>
      <div className={styles.swatchRow}>
        {colors.map((hex, i) => (
          <div key={i} className={styles.swatchItem}>
            <input
              type="color"
              className={styles.swatchColor}
              value={hex}
              onChange={(e) => setColor(i, e.target.value)}
            />
            <span className={styles.swatchHex}>{hex}</span>
            <button
              type="button"
              className={styles.linkBtn}
              onClick={() => removeColor(i)}
            >
              ×
            </button>
          </div>
        ))}
        <button type="button" className={styles.addBtn} onClick={addColor}>
          + 색상 추가
        </button>
      </div>

      <div className={styles.formActions}>
        {error && <span className={styles.errorText}>{error}</span>}
        {saved && <span className={styles.savedText}>저장되었습니다.</span>}
        <button
          type="button"
          className={`${styles.button} ${styles.buttonPrimary}`}
          onClick={save}
          disabled={saving}
        >
          {saving ? "저장 중…" : "옵션·색상 저장"}
        </button>
      </div>
    </div>
  );
}
