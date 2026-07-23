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
              {product.colors.map((c) => (
                <li
                  key={c.hex}
                  className={styles.swatch}
                  style={{ backgroundColor: c.hex }}
                  title={c.name || c.hex}
                />
              ))}
            </ul>
          )}
        </div>

        <p className={styles.price}>
          {formatPrice(product.price)}
          {product.variants.length > 1 && "~"}
        </p>
      </Link>
    </li>
  );
}
