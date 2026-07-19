import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, isWholesaleViewer } from "@/lib/data";
import { getCategory } from "@/lib/constants";
import ProductDetail from "@/components/product/ProductDetail";
import styles from "./page.module.css";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, wholesale] = await Promise.all([
    getProduct(id),
    isWholesaleViewer(),
  ]);
  if (!product) notFound();

  const category = getCategory(product.category);

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="위치">
        <Link href="/products">전체 상품</Link>
        {category && (
          <>
            <span className={styles.separator} aria-hidden>
              ›
            </span>
            <Link href={`/category/${category.slug}`}>{category.name}</Link>
          </>
        )}
        <span className={styles.separator} aria-hidden>
          ›
        </span>
        <span className={styles.current}>{product.name}</span>
      </nav>

      <ProductDetail product={product} wholesale={wholesale} />
    </div>
  );
}
