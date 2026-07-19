import Link from "next/link";
import { listQuotesForAdmin } from "@/lib/admin";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

const STATUS_FILTERS = [
  { value: "", label: "전체" },
  { value: "valid", label: "유효" },
  { value: "expired", label: "만료" },
];

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(
    d.getHours(),
  )}:${p(d.getMinutes())}`;
}
function formatDate(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

export default async function AdminQuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const status = sp.status ?? "";
  const page = Number(sp.page) > 0 ? Number(sp.page) : 1;

  const { rows, total, pageSize } = await listQuotesForAdmin({ q, status, page });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const hrefWith = (patch: { status?: string; page?: number }) => {
    const merged = { q, status, page: 1, ...patch };
    const params = new URLSearchParams();
    if (merged.q) params.set("q", merged.q);
    if (merged.status) params.set("status", merged.status);
    if (merged.page > 1) params.set("page", String(merged.page));
    const s = params.toString();
    return s ? `/admin/quotes?${s}` : "/admin/quotes";
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>견적서 관리</h1>
      <p className={styles.pageDesc}>발행된 견적서를 조회합니다.</p>

      <div className={styles.filterRows}>
        <div className={styles.filterLine}>
          <span className={styles.filterLabel}>상태</span>
          <div className={styles.filterChips}>
            {STATUS_FILTERS.map((f) => (
              <Link
                key={f.value}
                href={hrefWith({ status: f.value })}
                className={`${styles.chip} ${
                  status === f.value ? styles.chipActive : ""
                }`}
              >
                {f.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.toolbar}>
        <form className={styles.search} action="/admin/quotes" method="get">
          {status && <input type="hidden" name="status" value={status} />}
          <input
            className={styles.searchInput}
            type="search"
            name="q"
            defaultValue={q}
            placeholder="견적번호 · 상호 · 담당자 검색"
          />
          <button type="submit" className={styles.button}>
            검색
          </button>
        </form>
        <p className={styles.count}>총 {total}건</p>
      </div>

      <div className={styles.card}>
        {rows.length === 0 ? (
          <div className={styles.empty}>조건에 맞는 견적서가 없습니다.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>견적번호</th>
                <th>발행일</th>
                <th>공급받는 자</th>
                <th>품목</th>
                <th>합계</th>
                <th>유효기간</th>
                <th>상태</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((qt) => (
                <tr key={qt.number}>
                  <td>
                    <Link
                      href={`/admin/quotes/${qt.number}`}
                      className={styles.pName}
                    >
                      {qt.number}
                    </Link>
                  </td>
                  <td className={styles.mono}>{formatDateTime(qt.issuedAt)}</td>
                  <td>
                    <div>{qt.customerCompany || "—"}</div>
                    <div className={styles.pId}>{qt.userEmail}</div>
                  </td>
                  <td className={styles.mono}>{qt.itemCount}</td>
                  <td className={styles.mono}>
                    {qt.total.toLocaleString("ko-KR")}원
                  </td>
                  <td className={styles.mono}>{formatDate(qt.validUntil)}</td>
                  <td>
                    <span className={qt.expired ? styles.badgeOff : styles.badgeOn}>
                      {qt.expired ? "만료" : "유효"}
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/admin/quotes/${qt.number}`}
                      className={styles.button}
                    >
                      상세
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          {page > 1 ? (
            <Link href={hrefWith({ page: page - 1 })} className={styles.button}>
              ← 이전
            </Link>
          ) : (
            <span
              className={styles.button}
              style={{ opacity: 0.5, cursor: "default" }}
              aria-disabled
            >
              ← 이전
            </span>
          )}
          <span className={styles.count}>
            {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={hrefWith({ page: page + 1 })} className={styles.button}>
              다음 →
            </Link>
          ) : (
            <span
              className={styles.button}
              style={{ opacity: 0.5, cursor: "default" }}
              aria-disabled
            >
              다음 →
            </span>
          )}
        </div>
      )}
    </div>
  );
}
