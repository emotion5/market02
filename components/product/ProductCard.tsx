import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import QuickAddButton from "./QuickAddButton";
import styles from "./ProductCard.module.css";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <article className={styles.card}>
      <div className={styles.thumb}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image} alt={product.name} className={styles.image} />
        <QuickAddButton product={product} />
      </div>

      {/* 카드 전체를 덮는 링크(스트레치드 링크): 텍스트/이미지 클릭 시 상세로 이동 */}
      <Link href={`/products/${product.id}`} className={styles.body}>
        <p className={styles.name}>{product.name}</p>
        {product.summary && <p className={styles.summary}>{product.summary}</p>}
        <p className={styles.price}>{formatPrice(product.price)}</p>
        {product.colors && product.colors.length > 0 && (
          <ul className={styles.colors} aria-label="색상 옵션">
            {product.colors.map((color) => (
              <li
                key={color}
                className={styles.swatch}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </ul>
        )}
      </Link>
    </article>
  );
}
