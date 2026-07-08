import { notFound } from "next/navigation";
import { getCategory, CATEGORIES } from "@/lib/constants";
import { getProductsByCategory } from "@/lib/data";
import ProductListing from "@/components/product/ProductListing";
import styles from "../../listing.module.css";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

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
