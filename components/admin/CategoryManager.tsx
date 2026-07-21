"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminCategoryRow } from "@/lib/admin";
import styles from "@/app/admin/admin.module.css";

// 카테고리 추가 / 표시명 수정 / 순서 변경(▲▼) / 삭제.
// slug 는 생성 후 불변(상품ID·URL·이미지 폴더 키).
export default function CategoryManager({
  categories,
}: {
  categories: AdminCategoryRow[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  // 추가 폼
  const [slug, setSlug] = useState("");
  const [nameKo, setNameKo] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [addError, setAddError] = useState("");

  // 순서(로컬) + 행별 이름 편집
  const [rows, setRows] = useState<AdminCategoryRow[]>(categories);
  const [edits, setEdits] = useState<Record<string, { ko: string; en: string }>>(
    () =>
      Object.fromEntries(
        categories.map((c) => [c.slug, { ko: c.name, en: c.nameEn }]),
      ),
  );
  const [rowError, setRowError] = useState("");
  const [orderSaved, setOrderSaved] = useState(false);
  // 카테고리 추가/삭제 시엔 부모가 key(=slug 집합)로 이 컴포넌트를 재마운트해
  // rows/edits 초기값을 새 목록으로 다시 잡는다(순서·이름 변경은 로컬 상태 유지).

  const slugValid = /^[a-z][a-z0-9]*$/.test(slug);
  const canAdd = slugValid && nameKo.trim() && nameEn.trim() && !busy;
  const orderDirty = rows.some((r, i) => r.slug !== categories[i]?.slug);

  async function add() {
    setAddError("");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, nameKo, nameEn }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAddError(data.error ?? "추가에 실패했습니다.");
        return;
      }
      setSlug("");
      setNameKo("");
      setNameEn("");
      router.refresh();
    } catch {
      setAddError("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= rows.length) return;
    setOrderSaved(false);
    setRows((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function saveOrder() {
    setRowError("");
    setOrderSaved(false);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/categories/order", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slugs: rows.map((r) => r.slug) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRowError(data.error ?? "순서 저장에 실패했습니다.");
        return;
      }
      setOrderSaved(true);
      router.refresh();
    } catch {
      setRowError("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function saveRow(row: AdminCategoryRow) {
    setRowError("");
    const edit = edits[row.slug];
    if (!edit) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/admin/categories/${encodeURIComponent(row.slug)}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ nameKo: edit.ko, nameEn: edit.en }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRowError(data.error ?? "저장에 실패했습니다.");
        return;
      }
      router.refresh();
    } catch {
      setRowError("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function removeRow(row: AdminCategoryRow) {
    setRowError("");
    if (
      !confirm(
        `카테고리 "${row.name}"(${row.slug})을(를) 삭제할까요? 소속 상품이 있으면 삭제되지 않습니다.`,
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(
        `/api/admin/categories/${encodeURIComponent(row.slug)}`,
        { method: "DELETE" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRowError(data.error ?? "삭제에 실패했습니다.");
        return;
      }
      router.refresh();
    } catch {
      setRowError("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  const setEdit = (slugKey: string, key: "ko" | "en", value: string) =>
    setEdits((prev) => ({
      ...prev,
      [slugKey]: { ...prev[slugKey], [key]: value },
    }));

  return (
    <div className={styles.card} style={{ padding: 24, marginBottom: 20 }}>
      <h2 className={styles.sectionTitle}>카테고리 추가 · 편집</h2>
      <p className={styles.sectionDesc}>
        slug은 상품 ID·URL·이미지 폴더의 키라 <b>생성 후 변경할 수 없습니다</b>. 표시명(한글·영문)과 순서만 수정할 수 있어요. 소속 상품이 있는 카테고리는 삭제되지 않습니다.
      </p>

      {/* 추가 폼 */}
      <div className={styles.trackForm} style={{ marginBottom: 16 }}>
        <input
          className={styles.smallInput}
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase())}
          placeholder="slug (예: lighting)"
          aria-invalid={slug.length > 0 && !slugValid}
        />
        <input
          className={styles.smallInput}
          value={nameKo}
          onChange={(e) => setNameKo(e.target.value)}
          placeholder="한글명 (예: 조명)"
        />
        <input
          className={styles.smallInput}
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
          placeholder="영문명 (예: Lighting)"
        />
        <button
          type="button"
          className={`${styles.button} ${styles.buttonPrimary}`}
          onClick={add}
          disabled={!canAdd}
        >
          추가
        </button>
      </div>
      {slug.length > 0 && !slugValid && (
        <p className={styles.errorText}>
          slug은 영문 소문자로 시작하고 영소문자·숫자만 쓸 수 있습니다.
        </p>
      )}
      {addError && <p className={styles.errorText}>{addError}</p>}

      {/* 목록 편집 */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th>순서</th>
            <th style={{ textAlign: "left" }}>slug</th>
            <th style={{ textAlign: "left" }}>한글명</th>
            <th style={{ textAlign: "left" }}>영문명</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c, i) => (
            <tr key={c.slug}>
              <td style={{ whiteSpace: "nowrap", textAlign: "center" }}>
                <button
                  type="button"
                  className={styles.button}
                  onClick={() => move(i, -1)}
                  disabled={busy || i === 0}
                  aria-label={`${c.name} 위로`}
                >
                  ▲
                </button>{" "}
                <button
                  type="button"
                  className={styles.button}
                  onClick={() => move(i, 1)}
                  disabled={busy || i === rows.length - 1}
                  aria-label={`${c.name} 아래로`}
                >
                  ▼
                </button>
              </td>
              <td>
                <span className={styles.pId}>{c.slug}</span>
              </td>
              <td>
                <input
                  className={styles.smallInput}
                  value={edits[c.slug]?.ko ?? ""}
                  onChange={(e) => setEdit(c.slug, "ko", e.target.value)}
                  aria-label={`${c.name} 한글명`}
                />
              </td>
              <td>
                <input
                  className={styles.smallInput}
                  value={edits[c.slug]?.en ?? ""}
                  onChange={(e) => setEdit(c.slug, "en", e.target.value)}
                  aria-label={`${c.name} 영문명`}
                />
              </td>
              <td style={{ whiteSpace: "nowrap" }}>
                <button
                  type="button"
                  className={styles.button}
                  onClick={() => saveRow(c)}
                  disabled={busy}
                >
                  저장
                </button>{" "}
                <button
                  type="button"
                  className={styles.button}
                  onClick={() => removeRow(c)}
                  disabled={busy}
                >
                  삭제
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.formActions}>
        {rowError && <span className={styles.errorText}>{rowError}</span>}
        {orderSaved && !orderDirty && (
          <span className={styles.savedText}>순서를 저장했습니다.</span>
        )}
        <button
          type="button"
          className={`${styles.button} ${styles.buttonPrimary}`}
          onClick={saveOrder}
          disabled={busy || !orderDirty}
        >
          순서 저장
        </button>
      </div>
    </div>
  );
}
