import { getProducts } from "@/lib/data";
import ProductGrid from "@/components/product/ProductGrid";
import styles from "./listing.module.css";

export default async function HomePage() {
  const products = await getProducts();

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>전체 상품</h1>
      <p className={styles.count}>{products.length}개 상품</p>
      <ProductGrid products={products} />
    </div>
  );
}
