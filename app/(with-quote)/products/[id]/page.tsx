import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct } from "@/lib/data";
import { getCategory } from "@/lib/constants";
import VariantSelector from "@/components/product/VariantSelector";
import styles from "./page.module.css";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
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

      <div className={styles.layout}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image} alt={product.name} className={styles.image} />

        <div className={styles.info}>
          {category && <p className={styles.category}>{category.name}</p>}
          <h1 className={styles.name}>{product.name}</h1>
          <p className={styles.description}>{product.description}</p>
          <VariantSelector product={product} />
        </div>
      </div>
    </div>
  );
}
