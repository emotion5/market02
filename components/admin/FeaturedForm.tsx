"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
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

// 드래그로 순서를 바꾸는 편성 행. 손잡이(⠿)를 잡아 끌면 재정렬된다.
function SortableFeatRow({
  id,
  index,
  product,
  onRemove,
}: {
  id: string;
  index: number;
  product: AdminFeaturedItem;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    // 드래그 중인 행을 위로 띄워 다른 행 위에 겹쳐 보이게
    zIndex: isDragging ? 2 : undefined,
    position: "relative",
  };
  return (
    <div ref={setNodeRef} style={style} className={styles.featRow}>
      <button
        type="button"
        className={styles.dragHandle}
        aria-label={`${product.name} 순서 변경 (드래그 또는 스페이스 후 방향키)`}
        title="드래그로 순서 변경"
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
      <span className={styles.featOrder}>{index + 1}</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={styles.thumb} src={product.image} alt="" />
      <div className={styles.featName}>
        <div className={styles.pName}>
          {product.name}
          {!product.isActive && (
            <span className={styles.badgeOff} style={{ marginLeft: 8 }}>
              비활성
            </span>
          )}
        </div>
        <div className={styles.pId}>{product.id}</div>
      </div>
      <div className={styles.featControls}>
        <button
          type="button"
          className={styles.button}
          onClick={onRemove}
          title="이 카테고리 홈 편성에서만 제외합니다 (상품은 삭제되지 않아요)"
        >
          홈노출 제외
        </button>
      </div>
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

  const sensors = useSensors(
    // 살짝(4px) 움직여야 드래그 시작 — 삭제 버튼 클릭 등과 충돌 방지
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const available = cat.products.filter(
    (p) => p.isActive && !ids.includes(p.id),
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setIds((prev) => {
      const oldIndex = prev.indexOf(String(active.id));
      const newIndex = prev.indexOf(String(over.id));
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
    setSaved(false);
  }

  const remove = (id: string) => {
    setIds((prev) => prev.filter((x) => x !== id));
    setSaved(false);
  };
  const add = () => {
    if (!pick || ids.includes(pick)) return;
    setIds((prev) => [...prev, pick]);
    setPick("");
    setSaved(false);
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
        홈에 노출할 상품과 순서. 위에 있을수록 앞에 진열됩니다. 왼쪽 손잡이(⠿)를
        끌어 순서를 바꾸세요. (개수 제한 없음)
      </p>

      {ids.length === 0 ? (
        <div className={styles.featEmpty}>
          편성된 상품이 없습니다. 이 카테고리는 홈에 노출되지 않습니다.
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <div className={styles.featList}>
              {ids.map((id, i) => {
                const p = byId.get(id);
                if (!p) return null;
                return (
                  <SortableFeatRow
                    key={id}
                    id={id}
                    index={i}
                    product={p}
                    onRemove={() => remove(id)}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
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
            {available.length === 0 ? "추가할 상품 없음" : "상품 선택…"}
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
