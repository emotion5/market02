import Link from "next/link";
import { listTaxInvoicesForAdmin, type TaxRowState } from "@/lib/admin";
import TaxIssueButton from "@/components/admin/TaxIssueButton";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

const TABS = [
  { value: "pending", label: "발행대기" },
  { value: "issued", label: "발행완료" },
];

const PILL: Record<TaxRowState, { label: string; color: string; bg: string }> = {
  issuable: { label: "발행가능", color: "#0a7b58", bg: "#e6f7f1" },
  waiting: { label: "입금대기", color: "#777", bg: "#eee" },
  issued: { label: "발행완료", color: "#2563eb", bg: "#e8efff" },
};

function StatePill({ state }: { state: TaxRowState }) {
  const p = PILL[state];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        color: p.color,
        background: p.bg,
        whiteSpace: "nowrap",
      }}
    >
      {p.label}
    </span>
  );
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}
const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

export default async function AdminTaxInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const tab = sp.tab === "issued" ? "issued" : "pending";
  const q = sp.q ?? "";
  const page = Number(sp.page) > 0 ? Number(sp.page) : 1;

  const { rows, total, pageSize, counts } = await listTaxInvoicesForAdmin({
    tab,
    q,
    page,
  });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const hrefWith = (patch: { tab?: string; page?: number }) => {
    const merged = { tab, q, page: 1, ...patch };
    const params = new URLSearchParams();
    if (merged.tab !== "pending") params.set("tab", merged.tab);
    if (merged.q) params.set("q", merged.q);
    if (merged.page > 1) params.set("page", String(merged.page));
    const s = params.toString();
    return s ? `/admin/tax-invoices?${s}` : "/admin/tax-invoices";
  };

  const isIssued = tab === "issued";

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>세금계산서</h1>
      <p className={styles.pageDesc}>
        입금확인된 신청 건을 발행하고, 발행완료 내역(국세청승인번호)을 확인합니다.
        발행가능 {counts.issuable}건 · 입금대기 {counts.waiting}건 · 발행완료{" "}
        {counts.issued}건
      </p>

      <div className={styles.filterRows}>
        <div className={styles.filterLine}>
          <div className={styles.filterChips}>
            {TABS.map((t) => (
              <Link
                key={t.value}
                href={hrefWith({ tab: t.value })}
                className={`${styles.chip} ${
                  tab === t.value ? styles.chipActive : ""
                }`}
              >
                {t.label}
                {t.value === "pending"
                  ? ` ${counts.issuable + counts.waiting}`
                  : ` ${counts.issued}`}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.toolbar}>
        <form className={styles.search} action="/admin/tax-invoices" method="get">
          {tab !== "pending" && <input type="hidden" name="tab" value={tab} />}
          <input
            className={styles.searchInput}
            type="search"
            name="q"
            defaultValue={q}
            placeholder="주문번호 · 상호 · 사업자번호 검색"
          />
          <button type="submit" className={styles.button}>
            검색
          </button>
        </form>
        <p className={styles.count}>총 {total}건</p>
      </div>

      <div className={styles.card}>
        {rows.length === 0 ? (
          <div className={styles.empty}>
            {isIssued
              ? "발행완료된 세금계산서가 없습니다."
              : "발행대기 중인 세금계산서가 없습니다."}
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{isIssued ? "발행일" : "신청일"}</th>
                <th>주문번호</th>
                <th>상호</th>
                <th>사업자등록번호</th>
                <th>공급가액</th>
                <th>세액</th>
                <th>합계</th>
                {isIssued ? <th>국세청승인번호</th> : <th>상태</th>}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.orderNo}>
                  <td className={styles.mono}>
                    {isIssued
                      ? r.issuedAt
                        ? fmtDate(r.issuedAt)
                        : "—"
                      : fmtDate(r.createdAt)}
                  </td>
                  <td>
                    <Link
                      href={`/admin/orders/${r.orderNo}`}
                      className={styles.pName}
                    >
                      {r.orderNo}
                    </Link>
                  </td>
                  <td>{r.company || "—"}</td>
                  <td className={styles.mono}>{r.bizNo ?? "—"}</td>
                  <td className={styles.mono}>{won(r.supply)}</td>
                  <td className={styles.mono}>{won(r.vat)}</td>
                  <td className={styles.mono}>{won(r.total)}</td>
                  {isIssued ? (
                    <td className={styles.mono}>{r.ntsApprovalNo ?? "—"}</td>
                  ) : (
                    <td>
                      <StatePill state={r.state} />
                    </td>
                  )}
                  <td>
                    {r.state === "issuable" ? (
                      <TaxIssueButton orderNo={r.orderNo} />
                    ) : (
                      <Link
                        href={`/admin/orders/${r.orderNo}`}
                        className={styles.button}
                      >
                        상세
                      </Link>
                    )}
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
