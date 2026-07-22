"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminCategoryRow } from "@/lib/admin";
import styles from "@/app/admin/admin.module.css";

// 카테고리 추가(대분류/중분류) / 표시명 수정 / 순서 변경(▲▼) / 삭제.
// slug 는 생성 후 불변(상품ID·URL·이미지 폴더 키). 깊이는 2단계(대→중)까지.
type Group = { top: AdminCategoryRow; children: AdminCategoryRow[] };

// 평면 목록 → [대분류 + 그 하위] 그룹으로. 원본 순서(=sortOrder)를 보존한다.
function toGroups(rows: AdminCategoryRow[]): Group[] {
  return rows
    .filter((r) => !r.parentSlug)
    .map((top) => ({
      top,
      children: rows.filter((r) => r.parentSlug === top.slug),
    }));
}
function flatten(groups: Group[]): AdminCategoryRow[] {
  return groups.flatMap((g) => [g.top, ...g.children]);
}

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
  const [parentSlug, setParentSlug] = useState(""); // "" = 대분류
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

  const groups = toGroups(rows);
  const topOptions = categories.filter((c) => !c.parentSlug); // 상위 후보(대분류만)

  async function add() {
    setAddError("");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug,
          nameKo,
          nameEn,
          ...(parentSlug ? { parentSlug } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAddError(data.error ?? "추가에 실패했습니다.");
        return;
      }
      setSlug("");
      setNameKo("");
      setNameEn("");
      setParentSlug("");
      router.refresh();
    } catch {
      setAddError("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  // 대분류 그룹 통째로 위/아래 이동
  function moveTop(groupIndex: number, dir: -1 | 1) {
    const target = groupIndex + dir;
    if (target < 0 || target >= groups.length) return;
    setOrderSaved(false);
    const next = [...groups];
    [next[groupIndex], next[target]] = [next[target], next[groupIndex]];
    setRows(flatten(next));
  }

  // 같은 부모 안에서 중분류 형제끼리만 이동
  function moveChild(topSlug: string, childIndex: number, dir: -1 | 1) {
    const g = groups.find((x) => x.top.slug === topSlug);
    if (!g) return;
    const target = childIndex + dir;
    if (target < 0 || target >= g.children.length) return;
    setOrderSaved(false);
    const nextChildren = [...g.children];
    [nextChildren[childIndex], nextChildren[target]] = [
      nextChildren[target],
      nextChildren[childIndex],
    ];
    const next = groups.map((x) =>
      x.top.slug === topSlug ? { ...x, children: nextChildren } : x,
    );
    setRows(flatten(next));
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
        `카테고리 "${row.name}"(${row.slug})을(를) 삭제할까요? 소속 상품·하위 카테고리가 있으면 삭제되지 않습니다.`,
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

  // 한 행 렌더 (대분류/중분류 공용). 이동 콜백만 다르게 넘긴다.
  function renderRow(
    c: AdminCategoryRow,
    opts: {
      isChild: boolean;
      onUp: () => void;
      onDown: () => void;
      upDisabled: boolean;
      downDisabled: boolean;
    },
  ) {
    return (
      <tr key={c.slug}>
        <td style={{ whiteSpace: "nowrap", textAlign: "center" }}>
          <button
            type="button"
            className={styles.button}
            onClick={opts.onUp}
            disabled={busy || opts.upDisabled}
            aria-label={`${c.name} 위로`}
          >
            ▲
          </button>{" "}
          <button
            type="button"
            className={styles.button}
            onClick={opts.onDown}
            disabled={busy || opts.downDisabled}
            aria-label={`${c.name} 아래로`}
          >
            ▼
          </button>
        </td>
        <td style={{ paddingLeft: opts.isChild ? 24 : undefined }}>
          <span className={styles.pId}>
            {opts.isChild ? `└ ${c.slug}` : c.slug}
          </span>
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
    );
  }

  return (
    <div className={styles.card} style={{ padding: 24, marginBottom: 20 }}>
      <h2 className={styles.sectionTitle}>카테고리 추가 · 편집</h2>
      <p className={styles.sectionDesc}>
        slug은 상품 ID·URL·이미지 폴더의 키라 <b>생성 후 변경할 수 없습니다</b>. 표시명(한글·영문)과 순서만 수정할 수 있어요. <b>상위 카테고리</b>를 고르면 그 대분류의 하위(중분류)로 생성됩니다(2단계까지). 소속 상품·하위 카테고리가 있으면 삭제되지 않습니다.
      </p>

      {/* 추가 폼 */}
      <div className={styles.trackForm} style={{ marginBottom: 16 }}>
        <select
          className={styles.smallInput}
          value={parentSlug}
          onChange={(e) => setParentSlug(e.target.value)}
          aria-label="상위 카테고리"
        >
          <option value="">대분류 (상위 없음)</option>
          {topOptions.map((c) => (
            <option key={c.slug} value={c.slug}>
              ↳ {c.name} 하위
            </option>
          ))}
        </select>
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

      {/* 목록 편집 (대분류 → 그 하위 순으로 묶어 표시) */}
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
          {groups.map((g, gi) => [
            renderRow(g.top, {
              isChild: false,
              onUp: () => moveTop(gi, -1),
              onDown: () => moveTop(gi, 1),
              upDisabled: gi === 0,
              downDisabled: gi === groups.length - 1,
            }),
            ...g.children.map((child, ci) =>
              renderRow(child, {
                isChild: true,
                onUp: () => moveChild(g.top.slug, ci, -1),
                onDown: () => moveChild(g.top.slug, ci, 1),
                upDisabled: ci === 0,
                downDisabled: ci === g.children.length - 1,
              }),
            ),
          ])}
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
