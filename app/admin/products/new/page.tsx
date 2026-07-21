import Link from "next/link";
import { getCategoriesForAdmin } from "@/lib/admin";
import ProductCreateForm from "@/components/admin/ProductCreateForm";
import styles from "../../admin.module.css";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await getCategoriesForAdmin();
  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>상품 등록</h1>
      <p className={styles.pageDesc}>
        <Link href="/admin/products" className={styles.backToShop}>
          ← 상품 목록
        </Link>
      </p>
      <div className={styles.card} style={{ padding: 24 }}>
        <ProductCreateForm categories={categories} />
      </div>
    </div>
  );
}
