import Link from "next/link";
import { notFound } from "next/navigation";
import { isWholesaleViewer } from "@/lib/data";
import { getProduct, getCategories } from "@/server/catalog/service";
import { getSiteSettings } from "@/lib/settings";
import ProductDetail from "@/components/product/ProductDetail";
import styles from "./page.module.css";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // wholesale 은 한 번만 조회하고 상품·카테고리·설정은 병렬로 가져온다(직렬 DB 왕복 방지).
  const wholesale = await isWholesaleViewer();
  const [product, categories, settings] = await Promise.all([
    getProduct(id, { wholesale }),
    getCategories(),
    getSiteSettings(),
  ]);
  if (!product) notFound();

  const category = categories.find((c) => c.slug === product.category);

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

      <ProductDetail
        product={product}
        categoryName={category?.name}
        wholesale={wholesale}
        settings={settings}
      />
    </div>
  );
}
