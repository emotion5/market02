import { searchProducts } from "@/lib/data";
import ProductGrid from "@/components/product/ProductGrid";
import styles from "../listing.module.css";

export const metadata = { title: "검색 | MMM MARKET" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const products = query ? await searchProducts(query) : [];

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>검색 결과</h1>
      <p className={styles.count}>
        {query
          ? `‘${query}’에 대한 ${products.length}개 상품`
          : "검색어를 입력해주세요."}
      </p>
      {query && <ProductGrid products={products} />}
    </div>
  );
}
