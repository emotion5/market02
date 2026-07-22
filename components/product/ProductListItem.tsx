import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import ProductThumb from "./ProductThumb";
import styles from "./ProductListItem.module.css";

export default function ProductListItem({ product }: { product: Product }) {
  return (
    <li className={styles.item}>
      <Link href={`/products/${product.id}`} className={styles.link}>
        <ProductThumb
          src={product.image}
          alt={product.name}
          className={styles.image}
        />

        <div className={styles.info}>
          <p className={styles.name}>{product.name}</p>
          <p className={styles.description}>{product.description}</p>
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
        </div>

        <p className={styles.price}>{formatPrice(product.price)}</p>
      </Link>
    </li>
  );
}
