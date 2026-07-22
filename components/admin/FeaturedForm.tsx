"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminFeaturedCategory, AdminFeaturedItem } from "@/lib/admin";
import styles from "@/app/admin/admin.module.css";

export default function FeaturedForm({
  categories,
}: {
  categories: AdminFeaturedCategory[];
}) {
  return (
    <div>
      {categories.map((cat) => (
        <CategoryBlock key={cat.slug} cat={cat} />
      ))}
    </div>
  );
}

function CategoryBlock({ cat }: { cat: AdminFeaturedCategory }) {
  const router = useRouter();
  const byId = new Map<string, AdminFeaturedItem>(
    cat.products.map((p) => [p.id, p]),
  );
  // 편성된 상품 중 실제 존재하는 것만(안전장치)
  const [ids, setIds] = useState<string[]>(
    cat.featuredIds.filter((id) => byId.has(id)),
  );
  const [pick, setPick] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const available = cat.products.filter(
    (p) => p.isActive && !ids.includes(p.id),
  );

  const move = (i: number, dir: -1 | 1) =>
    setIds((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const remove = (id: string) =>
    setIds((prev) => prev.filter((x) => x !== id));
  const add = () => {
    if (!pick || ids.includes(pick)) return;
    setIds((prev) => [...prev, pick]);
    setPick("");
  };

  async function save() {
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/featured", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ categorySlug: cat.slug, productIds: ids }),
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
    <div className={styles.card} style={{ padding: 24, marginBottom: 20 }}>
      <h2 className={styles.sectionTitle}>{cat.name}</h2>
      <p className={styles.sectionDesc}>
        홈에 노출할 상품과 순서. 위에 있을수록 앞에 진열됩니다. (개수 제한 없음)
      </p>

      {ids.length === 0 ? (
        <div className={styles.featEmpty}>
          편성된 상품이 없습니다. 이 카테고리는 홈에 노출되지 않습니다.
        </div>
      ) : (
        <div className={styles.featList}>
          {ids.map((id, i) => {
            const p = byId.get(id);
            if (!p) return null;
            return (
              <div key={id} className={styles.featRow}>
                <span className={styles.featOrder}>{i + 1}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className={styles.thumb} src={p.image} alt="" />
                <div className={styles.featName}>
                  <div className={styles.pName}>
                    {p.name}
                    {!p.isActive && (
                      <span className={styles.badgeOff} style={{ marginLeft: 8 }}>
                        비활성
                      </span>
                    )}
                  </div>
                  <div className={styles.pId}>{p.id}</div>
                </div>
                <div className={styles.featControls}>
                  <button
                    type="button"
                    className={styles.button}
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    title="위로"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className={styles.button}
                    onClick={() => move(i, 1)}
                    disabled={i === ids.length - 1}
                    title="아래로"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className={styles.linkBtn}
                    onClick={() => remove(id)}
                  >
                    삭제
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.featAdd}>
        <select
          className={styles.select}
          style={{ maxWidth: 320 }}
          value={pick}
          onChange={(e) => setPick(e.target.value)}
          disabled={available.length === 0}
        >
          <option value="">
            {available.length === 0
              ? "추가할 상품 없음"
              : "상품 선택…"}
          </option>
          {available.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.id})
            </option>
          ))}
        </select>
        <button
          type="button"
          className={styles.addBtn}
          onClick={add}
          disabled={!pick}
        >
          + 추가
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
          {saving ? "저장 중…" : "편성 저장"}
        </button>
      </div>
    </div>
  );
}
