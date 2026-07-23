import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getProductForAdmin,
  getProductOptions,
  getProductImages,
  getCategoriesForAdmin,
} from "@/lib/admin";
import ProductEditForm from "@/components/admin/ProductEditForm";
import ProductOptionsForm from "@/components/admin/ProductOptionsForm";
import ProductImagesForm from "@/components/admin/ProductImagesForm";
import styles from "../../../admin.module.css";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, options, images, categories] = await Promise.all([
    getProductForAdmin(id),
    getProductOptions(id),
    getProductImages(id),
    getCategoriesForAdmin(),
  ]);
  if (!product || !options || !images) notFound();

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>상품 수정</h1>
      <p className={styles.pageDesc}>
        <Link href="/admin/products" className={styles.backToShop}>
          ← 상품 목록
        </Link>{" "}
        · {product.id}
      </p>

      <div className={styles.card} style={{ padding: 24, marginBottom: 20 }}>
        <ProductEditForm product={product} categories={categories} />
      </div>

      <div
        id="options"
        className={styles.card}
        style={{ padding: 24, marginBottom: 20, scrollMarginTop: 16 }}
      >
        <ProductOptionsForm
          productId={product.id}
          variants={options.variants}
          colors={options.colors}
        />
      </div>

      <div className={styles.card} style={{ padding: 24 }}>
        <ProductImagesForm
          productId={product.id}
          repImage={images.repImage}
          gallery={images.gallery}
        />
      </div>
    </div>
  );
}
