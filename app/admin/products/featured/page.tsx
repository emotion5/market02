import Link from "next/link";
import { getFeaturedForAdmin } from "@/lib/admin";
import FeaturedForm from "@/components/admin/FeaturedForm";
import styles from "../../admin.module.css";

export const dynamic = "force-dynamic";

export default async function FeaturedPage() {
  const categories = await getFeaturedForAdmin();

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>홈 노출 편성</h1>
      <p className={styles.pageDesc}>
        <Link href="/admin/products" className={styles.backToShop}>
          ← 상품 목록
        </Link>{" "}
        · 메인 화면 카테고리별 진열대에 노출할 상품과 순서를 편성합니다.
      </p>

      <FeaturedForm categories={categories} />
    </div>
  );
}
