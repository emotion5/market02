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

interface ColorIn {
  hex: string;
  name: string;
}

interface Props {
  productId: string;
  variants: VariantIn[];
  colors: ColorIn[];
}

// 옵션이 없는 단일 상품의 숨은 기본 옵션명. (소비자 화면은 옵션이 1개면
// 옵션 선택 UI 자체를 숨기므로 이 이름은 관리자에게 노출하지 않는다.)
const DEFAULT_VARIANT_NAME = "기본";

export default function ProductOptionsForm({
  productId,
  variants: initVariants,
  colors: initColors,
}: Props) {
  const router = useRouter();
  const [variants, setVariants] = useState<VForm[]>(() => {
    const mapped = initVariants.map((v) => ({
      id: v.id,
      name: v.name,
      price: String(v.price),
      wholesalePrice: v.wholesalePrice == null ? "" : String(v.wholesalePrice),
    }));
    return mapped.length
      ? mapped
      : [{ name: DEFAULT_VARIANT_NAME, price: "0", wholesalePrice: "" }];
  });
  // variant 가 1개면 '단일(옵션 없음)', 여러 개면 '옵션 상품'. 소비자 화면과 동일한 규칙.
  const [mode, setMode] = useState<"single" | "multi">(
    variants.length <= 1 ? "single" : "multi",
  );
  const [colors, setColors] = useState<ColorIn[]>(initColors);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const dirty = () => setSaved(false);

  const patchV = (i: number, patch: Partial<VForm>) => {
    dirty();
    setVariants((vs) => vs.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  };
  const addV = () => {
    dirty();
    setVariants((vs) => [...vs, { name: "", price: "0", wholesalePrice: "" }]);
  };
  const removeV = (i: number) => {
    dirty();
    setVariants((vs) => vs.filter((_, idx) => idx !== i));
  };

  // 옵션 없음(단일) ↔ 옵션으로 판매 전환
  const toSingle = () => {
    if (
      variants.length > 1 &&
      !confirm(
        "옵션이 여러 개입니다. '옵션 없음'으로 바꾸면 맨 위 옵션의 가격만 남고 나머지는 삭제됩니다. 계속할까요?",
      )
    ) {
      return;
    }
    dirty();
    setVariants((vs) => [{ ...vs[0], name: DEFAULT_VARIANT_NAME }]);
    setMode("single");
  };
  const toMulti = () => {
    dirty();
    setMode("multi");
  };

  const addColor = () =>
    setColors((cs) => [...cs, { hex: "#cccccc", name: "" }]);
  const patchColor = (i: number, patch: Partial<ColorIn>) =>
    setColors((cs) => cs.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const removeColor = (i: number) =>
    setColors((cs) => cs.filter((_, idx) => idx !== i));

  async function save() {
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      // 단일 모드는 첫 옵션 하나만, 이름은 기존값 유지(없으면 '기본').
      const source = mode === "single" ? variants.slice(0, 1) : variants;
      const payload = {
        variants: source.map((v) => ({
          id: v.id,
          name:
            mode === "single"
              ? v.name.trim() || DEFAULT_VARIANT_NAME
              : v.name.trim(),
          price: Number(v.price) || 0,
          wholesalePrice:
            v.wholesalePrice.trim() === "" ? null : Number(v.wholesalePrice),
        })),
        colors: colors.map((c) => ({ hex: c.hex, name: c.name.trim() })),
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

  const single = variants[0] ?? { name: DEFAULT_VARIANT_NAME, price: "0", wholesalePrice: "" };

  return (
    <div>
      <h2 className={styles.sectionTitle}>옵션</h2>

      {/* 옵션 없음(단일) / 옵션으로 판매 전환 */}
      <div className={styles.optModeToggle}>
        <label className={styles.optModeItem}>
          <input
            type="radio"
            name="optMode"
            checked={mode === "single"}
            onChange={toSingle}
          />
          <span>옵션 없음 (단일 가격)</span>
        </label>
        <label className={styles.optModeItem}>
          <input
            type="radio"
            name="optMode"
            checked={mode === "multi"}
            onChange={toMulti}
          />
          <span>옵션으로 판매</span>
        </label>
      </div>

      {mode === "single" ? (
        <>
          <p className={styles.sectionDesc}>
            옵션이 없는 단일 상품입니다. 판매가만 입력하세요. (소비자 화면엔 옵션
            선택 없이 수량만 표시됩니다.)
          </p>
          <div className={styles.singlePrice}>
            <div className={styles.field}>
              <label className={styles.label}>소비자가 (원)</label>
              <input
                className={styles.smallInput}
                type="number"
                min={0}
                value={single.price}
                onChange={(e) => patchV(0, { price: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>회원도매가 (원)</label>
              <input
                className={styles.smallInput}
                type="number"
                min={0}
                value={single.wholesalePrice}
                onChange={(e) => patchV(0, { wholesalePrice: e.target.value })}
                placeholder="비우면 소비자가 적용"
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <p className={styles.sectionDesc}>
            옵션별 소비자가와 회원도매가(비우면 소비자가 적용)를 설정합니다. 최소
            1개 필요.
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
                placeholder="예: 무광 블랙, 폭 1.8m"
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
        </>
      )}

      <h2 className={styles.sectionTitle} style={{ marginTop: 28 }}>
        색상
      </h2>
      <p className={styles.sectionDesc}>
        상세 페이지 색상 스와치 (선택). 색과 함께 <b>이름</b>(예: 블랙, 아이보리)을
        적으면 손님에게 이름이 표시됩니다. 이름을 비우면 색 동그라미만 나옵니다.
      </p>
      <div className={styles.swatchRow}>
        {colors.map((c, i) => (
          <div key={i} className={styles.swatchItem}>
            <input
              type="color"
              className={styles.swatchColor}
              value={c.hex}
              onChange={(e) => patchColor(i, { hex: e.target.value })}
              aria-label={`색상 ${i + 1}`}
            />
            <input
              className={styles.smallInput}
              style={{ width: 110 }}
              value={c.name}
              onChange={(e) => patchColor(i, { name: e.target.value })}
              placeholder="이름 (예: 블랙)"
              aria-label={`색상 ${i + 1} 이름`}
            />
            <button
              type="button"
              className={styles.linkBtn}
              onClick={() => removeColor(i)}
              aria-label={`색상 ${i + 1} 삭제`}
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
