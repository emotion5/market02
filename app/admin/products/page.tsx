import Link from "next/link";
import { listProductsForAdmin, getCategoriesForAdmin } from "@/lib/admin";
import ProductRowsEditor from "@/components/admin/ProductRowsEditor";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;
  const [products, categories] = await Promise.all([
    listProductsForAdmin({ category, q }),
    getCategoriesForAdmin(),
  ]);

  return (
    <div className={`${styles.page} ${styles.pageWide}`}>
      <h1 className={styles.pageTitle}>상품 관리</h1>
      <p className={styles.pageDesc}>
        상품을 등록·수정하고 옵션·가격·이미지를 관리합니다.
      </p>

      <div className={styles.toolbar}>
        <div className={styles.filterChips}>
          <Link
            href="/admin/products"
            className={`${styles.chip} ${!category ? styles.chipActive : ""}`}
          >
            전체
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/admin/products?category=${c.slug}`}
              className={`${styles.chip} ${
                category === c.slug ? styles.chipActive : ""
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
        <div className={styles.search}>
          <form className={styles.search} action="/admin/products" method="get">
            {category && (
              <input type="hidden" name="category" value={category} />
            )}
            <input
              className={styles.searchInput}
              type="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder="상품명 · ID 검색"
            />
            <button type="submit" className={styles.button}>
              검색
            </button>
          </form>
          <Link
            href="/admin/products/new"
            className={`${styles.button} ${styles.buttonPrimary}`}
          >
            + 상품 등록
          </Link>
        </div>
      </div>

      <p className={styles.count}>{products.length}개 상품</p>

      <p className={styles.pageDesc}>
        상품명·카테고리·대표가·상태는 아래 목록에서 바로 고쳐 저장할 수 있어요.
        옵션·설명·이미지 등은 <b>상세</b>에서 편집합니다.
      </p>

      <div className={styles.card}>
        {products.length === 0 ? (
          <div className={styles.empty}>상품이 없습니다.</div>
        ) : (
          <ProductRowsEditor products={products} categories={categories} />
        )}
      </div>
    </div>
  );
}
