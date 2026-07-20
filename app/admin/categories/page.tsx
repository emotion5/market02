import Link from "next/link";
import { getCategoriesForAdmin } from "@/lib/admin";
import CategoryVisibilityForm from "@/components/admin/CategoryVisibilityForm";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await getCategoriesForAdmin();

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>카테고리 노출</h1>
      <p className={styles.pageDesc}>
        <Link href="/admin/products" className={styles.backToShop}>
          ← 상품 관리
        </Link>{" "}
        · 각 카테고리를 상단 내비게이션과 메인(홈) 진열대에 노출할지 선택합니다. 예: 내비는 끄고 홈에만 노출.
      </p>

      <CategoryVisibilityForm categories={categories} />
    </div>
  );
}
