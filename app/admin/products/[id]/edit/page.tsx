import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductForAdmin } from "@/lib/admin";
import ProductEditForm from "@/components/admin/ProductEditForm";
import styles from "../../../admin.module.css";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductForAdmin(id);
  if (!product) notFound();

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>상품 수정</h1>
      <p className={styles.pageDesc}>
        <Link href="/admin/products" className={styles.backToShop}>
          ← 상품 목록
        </Link>{" "}
        · {product.id}
      </p>
      <div className={styles.card} style={{ padding: 24 }}>
        <ProductEditForm product={product} />
      </div>
    </div>
  );
}
