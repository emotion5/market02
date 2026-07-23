"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import styles from "./VariantSelector.module.css";

// 상품 상세의 인터랙션 영역: 옵션(색상 포함) 선택 → 선택 목록에 바로 추가 → 수량 조절
interface Selection {
  variantId: string;
  color: string;
  quantity: number;
}

// 옵션이 하나뿐인 단독 상품: 소비자가는 항상, 회원도매가는 자격자(승인 사업자)만 노출
function SingleVariantSelector({
  product,
  wholesale,
}: {
  product: Product;
  wholesale: boolean;
}) {
  const { addItem } = useCart();
  const hasColors = !!(product.colors && product.colors.length > 0);
  const [color, setColor] = useState(product.colors?.[0]?.hex ?? "");
  // 입력 중 빈 값을 허용하려고 문자열로 두고, 실제 수량은 여기서 파생시킨다
  const [qtyInput, setQtyInput] = useState("1");
  const [added, setAdded] = useState(false);

  const quantity = Math.max(1, parseInt(qtyInput, 10) || 1);
  const setQuantity = (q: number) => setQtyInput(String(Math.max(1, q)));

  const selectedColorName =
    product.colors?.find((c) => c.hex === color)?.name ?? "";
  const variant = product.variants[0];
  const consumerTotal = variant.consumerPrice * quantity;
  const memberTotal = variant.price * quantity;

  const handleAdd = () => {
    addItem(
      {
        productId: product.id,
        variantId: color ? `${variant.id}::${color}` : variant.id,
        productName: product.name,
        variantName: variant.name,
        price: variant.price,
        image: product.image,
        color: color || undefined,
        colorName: selectedColorName || undefined,
      },
      quantity,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className={styles.selector}>
      {hasColors && (
        <div className={styles.field}>
          <span className={styles.label}>
            색상{selectedColorName ? ` · ${selectedColorName}` : ""}
          </span>
          <ul className={styles.colors}>
            {product.colors!.map((c) => (
              <li key={c.hex}>
                <button
                  type="button"
                  className={`${styles.swatch} ${
                    color === c.hex ? styles.swatchSelected : ""
                  }`}
                  style={{ backgroundColor: c.hex }}
                  onClick={() => setColor(c.hex)}
                  aria-label={c.name ? `색상 ${c.name}` : `색상 ${c.hex}`}
                  aria-pressed={color === c.hex}
                  title={c.name || c.hex}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.field}>
        <span className={styles.label}>수량</span>
        <div className={styles.qty}>
          <button
            type="button"
            className={styles.qtyButton}
            onClick={() => setQuantity(quantity - 1)}
            disabled={quantity <= 1}
            aria-label="수량 줄이기"
          >
            <Minus size={18} strokeWidth={1.25} />
          </button>
          <input
            type="text"
            inputMode="numeric"
            className={styles.qtyInput}
            value={qtyInput}
            onChange={(e) => setQtyInput(e.target.value.replace(/[^0-9]/g, ""))}
            onBlur={() => setQtyInput(String(quantity))}
            aria-label="수량"
          />
          <button
            type="button"
            className={styles.qtyButton}
            onClick={() => setQuantity(quantity + 1)}
            aria-label="수량 늘리기"
          >
            <Plus size={18} strokeWidth={1.25} />
          </button>
        </div>
      </div>

      <div className={styles.total}>
        <div className={styles.priceRow}>
          <span className={styles.priceLabel}>소비자가</span>
          <span className={wholesale ? styles.consumerPrice : styles.memberPrice}>
            {formatPrice(consumerTotal)}
          </span>
        </div>
        {wholesale && (
          <div className={styles.priceRow}>
            <span className={styles.priceLabel}>회원도매가</span>
            <strong className={styles.memberPrice}>
              {formatPrice(memberTotal)}
            </strong>
          </div>
        )}
      </div>

      <button type="button" className={styles.addButton} onClick={handleAdd}>
        {added ? "견적서에 추가했습니다" : "견적서에 추가"}
      </button>
    </div>
  );
}

// 옵션 개수에 따라 단독/다중 선택 UI로 분기
export default function VariantSelector({
  product,
  wholesale = false,
}: {
  product: Product;
  wholesale?: boolean;
}) {
  if (product.variants.length === 1) {
    return <SingleVariantSelector product={product} wholesale={wholesale} />;
  }
  return <MultiVariantSelector product={product} wholesale={wholesale} />;
}

function MultiVariantSelector({
  product,
  wholesale,
}: {
  product: Product;
  wholesale: boolean;
}) {
  const { addItem } = useCart();
  const hasColors = !!(product.colors && product.colors.length > 0);
  const [color, setColor] = useState(product.colors?.[0]?.hex ?? "");
  const [selections, setSelections] = useState<Selection[]>([]);
  const [added, setAdded] = useState(false);

  const variantOf = (id: string) =>
    product.variants.find((v) => v.id === id) ?? product.variants[0];
  const colorNameOf = (hex: string) =>
    product.colors?.find((c) => c.hex === hex)?.name ?? "";
  const selectedColorName = colorNameOf(color);

  // 옵션 선택 시 목록에 추가 (같은 옵션+색상이면 수량 +1)
  const addSelection = (variantId: string) => {
    if (!variantId) return;
    setSelections((prev) => {
      const idx = prev.findIndex(
        (s) => s.variantId === variantId && s.color === color,
      );
      if (idx >= 0) {
        return prev.map((s, i) =>
          i === idx ? { ...s, quantity: s.quantity + 1 } : s,
        );
      }
      return [...prev, { variantId, color, quantity: 1 }];
    });
  };

  const changeQty = (index: number, delta: number) => {
    setSelections((prev) =>
      prev.map((s, i) =>
        i === index ? { ...s, quantity: Math.max(1, s.quantity + delta) } : s,
      ),
    );
  };

  const removeSelection = (index: number) => {
    setSelections((prev) => prev.filter((_, i) => i !== index));
  };

  const memberTotal = selections.reduce(
    (sum, s) => sum + variantOf(s.variantId).price * s.quantity,
    0,
  );
  const consumerTotal = selections.reduce(
    (sum, s) => sum + variantOf(s.variantId).consumerPrice * s.quantity,
    0,
  );

  const handleAdd = () => {
    if (selections.length === 0) return;
    selections.forEach((s) => {
      const v = variantOf(s.variantId);
      addItem(
        {
          productId: product.id,
          // 색상이 있으면 색상까지 구분되도록 variantId를 합성
          variantId: s.color ? `${v.id}::${s.color}` : v.id,
          productName: product.name,
          variantName: v.name,
          price: v.price,
          image: product.image,
          color: s.color || undefined,
          colorName: colorNameOf(s.color) || undefined,
        },
        s.quantity,
      );
    });
    setSelections([]);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className={styles.selector}>
      {hasColors && (
        <div className={styles.field}>
          <span className={styles.label}>
            색상{selectedColorName ? ` · ${selectedColorName}` : ""}
          </span>
          <ul className={styles.colors}>
            {product.colors!.map((c) => (
              <li key={c.hex}>
                <button
                  type="button"
                  className={`${styles.swatch} ${
                    color === c.hex ? styles.swatchSelected : ""
                  }`}
                  style={{ backgroundColor: c.hex }}
                  onClick={() => setColor(c.hex)}
                  aria-label={c.name ? `색상 ${c.name}` : `색상 ${c.hex}`}
                  aria-pressed={color === c.hex}
                  title={c.name || c.hex}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.field}>
        <label htmlFor="variant" className={styles.label}>
          옵션
        </label>
        <select
          id="variant"
          className={styles.select}
          value=""
          onChange={(e) => addSelection(e.target.value)}
        >
          <option value="" disabled>
            옵션을 선택하세요
          </option>
          {product.variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} — {formatPrice(v.price)}
            </option>
          ))}
        </select>
      </div>

      {selections.length > 0 && (
        <ul className={styles.selectedList}>
          {selections.map((s, i) => {
            const v = variantOf(s.variantId);
            return (
              <li key={`${s.variantId}-${s.color}`} className={styles.selectedItem}>
                <div className={styles.selectedHead}>
                  {s.color && (
                    <span
                      className={styles.selectedColor}
                      style={{ backgroundColor: s.color }}
                      aria-hidden
                    />
                  )}
                  <span className={styles.selectedName}>
                    {v.name}
                    {colorNameOf(s.color) ? ` / ${colorNameOf(s.color)}` : ""}
                  </span>
                  <button
                    type="button"
                    className={styles.selectedRemove}
                    onClick={() => removeSelection(i)}
                    aria-label="옵션 삭제"
                  >
                    ×
                  </button>
                </div>
                <div className={styles.selectedRow}>
                  <div className={styles.quantity}>
                    <button
                      type="button"
                      className={styles.quantityButton}
                      onClick={() => changeQty(i, -1)}
                      aria-label="수량 줄이기"
                    >
                      −
                    </button>
                    <span className={styles.quantityValue}>{s.quantity}</span>
                    <button
                      type="button"
                      className={styles.quantityButton}
                      onClick={() => changeQty(i, 1)}
                      aria-label="수량 늘리기"
                    >
                      +
                    </button>
                  </div>
                  <span className={styles.selectedPrice}>
                    {formatPrice(v.price * s.quantity)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className={styles.total}>
        <div className={styles.priceRow}>
          <span className={styles.priceLabel}>소비자가</span>
          <span className={wholesale ? styles.consumerPrice : styles.memberPrice}>
            {formatPrice(consumerTotal)}
          </span>
        </div>
        {wholesale && (
          <div className={styles.priceRow}>
            <span className={styles.priceLabel}>회원도매가</span>
            <strong className={styles.memberPrice}>
              {formatPrice(memberTotal)}
            </strong>
          </div>
        )}
      </div>

      <button
        type="button"
        className={styles.addButton}
        onClick={handleAdd}
        disabled={selections.length === 0}
      >
        {added ? "견적서에 추가했습니다" : "견적서에 추가"}
      </button>
    </div>
  );
}
