import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import styles from "./ProductCard.module.css";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.id}`} className={styles.card}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={product.image} alt={product.name} className={styles.image} />
      <p className={styles.name}>{product.name}</p>
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
  );
}
