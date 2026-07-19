import Link from "next/link";
import { listOrdersForAdmin } from "@/lib/admin";
import { STATUS_FLOW, STATUS_LABEL } from "@/lib/orders";
import OrderStatusBadge from "@/components/admin/OrderStatusBadge";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

const STATUS_FILTERS = [
  { value: "", label: "전체" },
  ...STATUS_FLOW.map((s) => ({ value: s, label: STATUS_LABEL[s] })),
];

const TAX_LABEL: Record<string, string> = {
  none: "—",
  pending: "신청",
  issued: "발행완료",
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(
    d.getHours(),
  )}:${p(d.getMinutes())}`;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const status = sp.status ?? "";
  const page = Number(sp.page) > 0 ? Number(sp.page) : 1;

  const { rows, total, pageSize } = await listOrdersForAdmin({ q, status, page });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const hrefWith = (patch: { status?: string; page?: number }) => {
    const merged = { q, status, page: 1, ...patch };
    const params = new URLSearchParams();
    if (merged.q) params.set("q", merged.q);
    if (merged.status) params.set("status", merged.status);
    if (merged.page > 1) params.set("page", String(merged.page));
    const s = params.toString();
    return s ? `/admin/orders?${s}` : "/admin/orders";
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>주문 관리</h1>
      <p className={styles.pageDesc}>
        무통장입금 주문을 확인하고 입금확인·배송 상태를 처리합니다.
      </p>

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
        <form className={styles.search} action="/admin/orders" method="get">
          {status && <input type="hidden" name="status" value={status} />}
          <input
            className={styles.searchInput}
            type="search"
            name="q"
            defaultValue={q}
            placeholder="주문번호 · 주문자 · 입금자 검색"
          />
          <button type="submit" className={styles.button}>
            검색
          </button>
        </form>
        <p className={styles.count}>총 {total}건</p>
      </div>

      <div className={styles.card}>
        {rows.length === 0 ? (
          <div className={styles.empty}>조건에 맞는 주문이 없습니다.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>주문번호</th>
                <th>주문일</th>
                <th>주문자 / 입금자</th>
                <th>상품</th>
                <th>금액</th>
                <th>상태</th>
                <th>세금계산서</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.orderNo}>
                  <td>
                    <Link
                      href={`/admin/orders/${o.orderNo}`}
                      className={styles.pName}
                    >
                      {o.orderNo}
                    </Link>
                  </td>
                  <td className={styles.mono}>{formatDateTime(o.createdAt)}</td>
                  <td>
                    <div>{o.ordererName}</div>
                    <div className={styles.pId}>입금 {o.depositorName}</div>
                  </td>
                  <td>
                    {o.firstItemName ?? "—"}
                    {o.itemCount > 1 && (
                      <span className={styles.pId}> 외 {o.itemCount - 1}건</span>
                    )}
                  </td>
                  <td className={styles.mono}>
                    {o.total.toLocaleString("ko-KR")}원
                  </td>
                  <td>
                    <OrderStatusBadge status={o.status} />
                  </td>
                  <td>{TAX_LABEL[o.tax]}</td>
                  <td>
                    <Link
                      href={`/admin/orders/${o.orderNo}`}
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
