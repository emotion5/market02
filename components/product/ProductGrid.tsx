import type { Product } from "@/lib/types";
import ProductCard from "./ProductCard";
import styles from "./ProductGrid.module.css";

export default function ProductGrid({
  products,
  minColWidth,
}: {
  products: Product[];
  // 열 자동 계산의 최소 카드 폭(px). 좁은 영역에서 열 수를 늘리고 싶을 때 낮춘다.
  minColWidth?: number;
}) {
  if (products.length === 0) {
    return <p className={styles.empty}>등록된 상품이 없습니다.</p>;
  }

  const style = minColWidth
    ? ({ "--min-col": `${minColWidth}px` } as React.CSSProperties)
    : undefined;

  return (
    <div className={styles.grid} style={style}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
