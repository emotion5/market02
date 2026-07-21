import Link from "next/link";
import { getCategoriesForAdmin } from "@/lib/admin";
import CategoryManager from "@/components/admin/CategoryManager";
import CategoryVisibilityForm from "@/components/admin/CategoryVisibilityForm";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await getCategoriesForAdmin();

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>카테고리 관리</h1>
      <p className={styles.pageDesc}>
        <Link href="/admin/products" className={styles.backToShop}>
          ← 상품 관리
        </Link>{" "}
        · 카테고리를 추가·편집하고, 상단 내비게이션과 메인(홈) 진열대에 노출할지 선택합니다.
      </p>

      <CategoryManager
        key={categories.map((c) => c.slug).sort().join("|")}
        categories={categories}
      />
      <CategoryVisibilityForm categories={categories} />
    </div>
  );
}
