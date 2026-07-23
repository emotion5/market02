"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { hierarchicalOptions } from "@/components/admin/categoryOptions";
import styles from "@/app/admin/admin.module.css";

// 상품 관리 목록. '저장' 버튼은 상품명·카테고리 + (단일 옵션 상품이면) 소비자가·회원도매가를
// 한 번에 반영한다(서버 트랜잭션). 옵션이 여러 개면 가격칸은 읽기전용(옵션 수정에서).
// 상태(활성)·홈 노출은 저장과 무관하게 즉시 토글된다.
interface Row {
  id: string;
  name: string;
  categorySlug: string;
  price: number; // 옵션 최저 소비자가(파생, 옵션 상품 표시용)
  isActive: boolean;
  variantCount: number;
  image: string;
  isFeatured: boolean;
  single: { consumerPrice: number; wholesalePrice: number | null } | null;
}
interface Cat {
  slug: string;
  name: string;
  parentSlug?: string | null;
}
// '저장'이 관장하는 필드. 가격(소비자가·도매가)은 단일 옵션 상품일 때만 의미가 있다.
type Draft = {
  name: string;
  categorySlug: string;
  consumerPrice: string;
  wholesale: string;
};

const toDraft = (p: Row): Draft => ({
  name: p.name,
  categorySlug: p.categorySlug,
  consumerPrice: p.single ? String(p.single.consumerPrice) : "",
  wholesale:
    p.single && p.single.wholesalePrice != null
      ? String(p.single.wholesalePrice)
      : "",
});

export default function ProductRowsEditor({
  products,
  categories,
}: {
  products: Row[];
  categories: Cat[];
}) {
  const router = useRouter();
  const options = hierarchicalOptions(categories);
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(products.map((p) => [p.id, toDraft(p)])),
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<{ id: string; msg: string } | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  // 상태·홈 노출은 draft-저장과 별개로 즉시 반영(낙관적 업데이트).
  const [active, setActive] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(products.map((p) => [p.id, p.isActive])),
  );
  const [featured, setFeatured] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(products.map((p) => [p.id, p.isFeatured])),
  );
  const [toggleBusyId, setToggleBusyId] = useState<string | null>(null);

  const draftOf = (p: Row): Draft => drafts[p.id] ?? toDraft(p);
  const isDirty = (p: Row) => {
    const d = draftOf(p);
    const o = toDraft(p);
    return (
      d.name !== o.name ||
      d.categorySlug !== o.categorySlug ||
      (!!p.single &&
        (d.consumerPrice !== o.consumerPrice || d.wholesale !== o.wholesale))
    );
  };

  const patchDraft = (p: Row, patch: Partial<Draft>) => {
    setSavedId(null);
    setDrafts((prev) => ({ ...prev, [p.id]: { ...draftOf(p), ...patch } }));
  };

  async function save(p: Row) {
    const d = draftOf(p);
    if (!d.name.trim()) {
      setError({ id: p.id, msg: "상품명을 입력하세요." });
      return;
    }
    // 단일 옵션 상품이면 가격도 함께 검증·전송 (서버 트랜잭션으로 원자 저장)
    let priceFields: { price?: number; wholesalePrice?: number | null } = {};
    if (p.single) {
      const price = Number(d.consumerPrice);
      if (!Number.isInteger(price) || price < 0) {
        setError({ id: p.id, msg: "소비자가는 0 이상 정수여야 합니다." });
        return;
      }
      const wholesale =
        d.wholesale.trim() === "" ? null : Number(d.wholesale);
      if (
        wholesale !== null &&
        (!Number.isInteger(wholesale) || wholesale < 0)
      ) {
        setError({ id: p.id, msg: "회원도매가는 0 이상 정수여야 합니다." });
        return;
      }
      priceFields = { price, wholesalePrice: wholesale };
    }
    setError(null);
    setSavedId(null);
    setSavingId(p.id);
    try {
      const res = await fetch(`/api/admin/products/${p.id}/basics`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: d.name.trim(),
          categorySlug: d.categorySlug,
          ...priceFields,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError({ id: p.id, msg: data.error ?? "저장에 실패했습니다." });
        return;
      }
      // 정규화된 값(트림·숫자화)으로 드래프트를 맞춰 dirty 해제
      setDrafts((prev) => ({
        ...prev,
        [p.id]: {
          name: d.name.trim(),
          categorySlug: d.categorySlug,
          consumerPrice: p.single ? String(priceFields.price) : "",
          wholesale:
            p.single && priceFields.wholesalePrice != null
              ? String(priceFields.wholesalePrice)
              : "",
        },
      }));
      setSavedId(p.id);
      router.refresh();
    } catch {
      setError({ id: p.id, msg: "네트워크 오류가 발생했습니다." });
    } finally {
      setSavingId(null);
    }
  }

  // 상태(활성)·홈 노출 즉시 토글 공용 — 낙관적 업데이트 후 실패 시 되돌림.
  async function toggle(p: Row, kind: "active" | "featured") {
    const stateMap = kind === "active" ? active : featured;
    const setMap = kind === "active" ? setActive : setFeatured;
    const fallback = kind === "active" ? p.isActive : p.isFeatured;
    const next = !(stateMap[p.id] ?? fallback);
    setMap((m) => ({ ...m, [p.id]: next })); // 낙관적
    setError((e) => (e?.id === p.id ? null : e));
    setToggleBusyId(p.id);
    try {
      const res = await fetch(`/api/admin/products/${p.id}/${kind}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ [kind]: next }),
      });
      if (!res.ok) {
        setMap((m) => ({ ...m, [p.id]: !next })); // 되돌림
        const data = await res.json().catch(() => ({}));
        setError({
          id: p.id,
          msg:
            data.error ??
            (kind === "active"
              ? "상태 변경에 실패했습니다."
              : "홈 노출 변경에 실패했습니다."),
        });
        return;
      }
      router.refresh();
    } catch {
      setMap((m) => ({ ...m, [p.id]: !next }));
      setError({ id: p.id, msg: "네트워크 오류가 발생했습니다." });
    } finally {
      setToggleBusyId(null);
    }
  }

  return (
    <div className={styles.tableScroll}>
    <table className={`${styles.table} ${styles.tableNowrap}`}>
      <thead>
        <tr>
          <th></th>
          <th>상품명</th>
          <th>카테고리</th>
          <th>소비자가</th>
          <th>회원도매가</th>
          <th></th>
          <th>옵션</th>
          <th>상태</th>
          <th>홈 노출</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {products.map((p) => {
          const d = draftOf(p);
          const dirty = isDirty(p);
          const busy = savingId === p.id;
          const isActive = active[p.id] ?? p.isActive;
          const isFeat = featured[p.id] ?? p.isFeatured;
          const tBusy = toggleBusyId === p.id;
          return (
            <tr key={p.id}>
              <td>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className={styles.thumb} src={p.image} alt="" />
              </td>
              <td>
                <input
                  className={styles.smallInput}
                  value={d.name}
                  onChange={(e) => patchDraft(p, { name: e.target.value })}
                  aria-label={`${p.id} 상품명`}
                  style={{ minWidth: 190 }}
                />
                <div className={styles.pId}>{p.id}</div>
              </td>
              <td>
                <select
                  className={styles.smallInput}
                  value={d.categorySlug}
                  onChange={(e) =>
                    patchDraft(p, { categorySlug: e.target.value })
                  }
                  aria-label={`${p.id} 카테고리`}
                  style={{ minWidth: 140 }}
                >
                  {options.map((o) => (
                    <option key={o.slug} value={o.slug}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                {p.single ? (
                  <input
                    className={styles.smallInput}
                    type="number"
                    min={0}
                    value={d.consumerPrice}
                    onChange={(e) =>
                      patchDraft(p, { consumerPrice: e.target.value })
                    }
                    aria-label={`${p.id} 소비자가`}
                    style={{ width: 100 }}
                  />
                ) : (
                  <span className={styles.mono} title="옵션별 가격은 옵션 수정에서">
                    {p.price.toLocaleString("ko-KR")}원~
                  </span>
                )}
              </td>
              <td>
                {p.single ? (
                  <input
                    className={styles.smallInput}
                    type="number"
                    min={0}
                    value={d.wholesale}
                    onChange={(e) =>
                      patchDraft(p, { wholesale: e.target.value })
                    }
                    placeholder="비우면 소비자가"
                    aria-label={`${p.id} 회원도매가`}
                    style={{ width: 100 }}
                  />
                ) : (
                  <span className={styles.mono} title="옵션별 가격은 옵션 수정에서">
                    옵션별
                  </span>
                )}
              </td>
              <td style={{ whiteSpace: "nowrap" }}>
                <button
                  type="button"
                  className={`${styles.button} ${styles.buttonPrimary}`}
                  onClick={() => save(p)}
                  disabled={!dirty || busy}
                >
                  {busy ? "저장 중…" : "저장"}
                </button>
                {error?.id === p.id && (
                  <div className={styles.errorText}>{error.msg}</div>
                )}
                {savedId === p.id && !dirty && (
                  <div className={styles.savedText}>저장됨</div>
                )}
              </td>
              <td className={styles.mono}>
                <Link href={`/admin/products/${p.id}/edit#options`}>
                  {p.variantCount <= 1 ? "단일" : `${p.variantCount}개`}
                </Link>
              </td>
              <td>
                <button
                  type="button"
                  className={isActive ? styles.badgeOn : styles.badgeOff}
                  onClick={() => toggle(p, "active")}
                  disabled={tBusy}
                  aria-pressed={isActive}
                  aria-label={`${p.id} 상태 전환`}
                  title={
                    isActive
                      ? "쇼핑몰에 노출 중 — 클릭하면 비활성"
                      : "클릭하면 활성(쇼핑몰 노출)"
                  }
                  style={{ cursor: "pointer", border: "none" }}
                >
                  {isActive ? "활성" : "비활성"}
                </button>
              </td>
              <td>
                <button
                  type="button"
                  className={isFeat ? styles.featOn : styles.featOff}
                  onClick={() => toggle(p, "featured")}
                  disabled={tBusy}
                  aria-pressed={isFeat}
                  aria-label={`${p.id} 홈 노출 전환`}
                  title={
                    isFeat
                      ? "홈에 노출 중 — 클릭하면 내림 (순서는 홈 노출 편성에서)"
                      : "클릭하면 홈에 노출"
                  }
                >
                  {isFeat ? "노출" : "비노출"}
                </button>
              </td>
              <td style={{ whiteSpace: "nowrap" }}>
                <Link
                  href={`/admin/products/${p.id}/edit`}
                  className={styles.button}
                >
                  상품 수정
                </Link>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
    </div>
  );
}
