import Link from "next/link";
import { CATEGORIES, getCategory } from "@/lib/constants";
import { listProductsForAdmin } from "@/lib/admin";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;
  const products = await listProductsForAdmin({ category, q });

  return (
    <div className={styles.page}>
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
          {CATEGORIES.map((c) => (
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
          <Link href="/admin/products/featured" className={styles.button}>
            홈 노출 편성
          </Link>
          <Link
            href="/admin/products/new"
            className={`${styles.button} ${styles.buttonPrimary}`}
          >
            + 상품 등록
          </Link>
        </div>
      </div>

      <p className={styles.count}>{products.length}개 상품</p>

      <div className={styles.card}>
        {products.length === 0 ? (
          <div className={styles.empty}>상품이 없습니다.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th></th>
                <th>상품명</th>
                <th>카테고리</th>
                <th>대표가</th>
                <th>옵션</th>
                <th>상태</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className={styles.thumb} src={p.image} alt="" />
                  </td>
                  <td>
                    <div className={styles.pName}>{p.name}</div>
                    <div className={styles.pId}>{p.id}</div>
                  </td>
                  <td>{getCategory(p.categorySlug)?.name ?? p.categorySlug}</td>
                  <td className={styles.mono}>
                    {p.price.toLocaleString("ko-KR")}원
                  </td>
                  <td className={styles.mono}>{p.variantCount}</td>
                  <td>
                    <span className={p.isActive ? styles.badgeOn : styles.badgeOff}>
                      {p.isActive ? "활성" : "비활성"}
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className={styles.button}
                    >
                      수정
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
