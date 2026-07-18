import { notFound } from "next/navigation";
import { getCategory } from "@/lib/constants";
import { getProductsByCategory } from "@/lib/data";
import ProductListing from "@/components/product/ProductListing";
import styles from "../../listing.module.css";

// 회원도매가가 사용자별로 달라지므로 정적 생성(SSG)에서 동적 렌더로 전환.

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const products = await getProductsByCategory(slug);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{category.name}</h1>
      <p className={styles.count}>{products.length}개 상품</p>
      <ProductListing products={products} />
    </div>
  );
}
