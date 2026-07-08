import type { Product } from "@/lib/types";
import ProductCard from "./ProductCard";
import styles from "./ProductGrid.module.css";

export default function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return <p className={styles.empty}>등록된 상품이 없습니다.</p>;
  }

  return (
    <div className={styles.grid}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
