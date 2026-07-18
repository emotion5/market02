import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductForAdmin, getProductOptions } from "@/lib/admin";
import ProductEditForm from "@/components/admin/ProductEditForm";
import ProductOptionsForm from "@/components/admin/ProductOptionsForm";
import styles from "../../../admin.module.css";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, options] = await Promise.all([
    getProductForAdmin(id),
    getProductOptions(id),
  ]);
  if (!product || !options) notFound();

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
        <ProductEditForm product={product} />
      </div>

      <div className={styles.card} style={{ padding: 24 }}>
        <ProductOptionsForm
          productId={product.id}
          variants={options.variants}
          colors={options.colors}
        />
      </div>
    </div>
  );
}
