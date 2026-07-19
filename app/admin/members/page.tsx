import Link from "next/link";
import { listMembersForAdmin } from "@/lib/admin";
import StatusPill from "@/components/admin/StatusPill";
import MemberActions from "@/components/admin/MemberActions";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

const TYPE_FILTERS = [
  { value: "", label: "전체" },
  { value: "PERSONAL", label: "개인" },
  { value: "BUSINESS", label: "사업자" },
];
const STATUS_FILTERS = [
  { value: "", label: "전체" },
  { value: "ACTIVE", label: "활성" },
  { value: "PENDING", label: "승인대기" },
  { value: "REJECTED", label: "반려" },
  { value: "WITHDRAWN", label: "탈퇴" },
];

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    type?: string;
    status?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const type = sp.type ?? "";
  const status = sp.status ?? "";
  const page = Number(sp.page) > 0 ? Number(sp.page) : 1;

  const { rows, total, pageSize } = await listMembersForAdmin({
    q,
    type,
    status,
    page,
  });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // 현재 필터를 보존하며 일부만 바꾼 URL 생성
  const hrefWith = (patch: {
    q?: string;
    type?: string;
    status?: string;
    page?: number;
  }) => {
    const merged = { q, type, status, page: 1, ...patch };
    const params = new URLSearchParams();
    if (merged.q) params.set("q", merged.q);
    if (merged.type) params.set("type", merged.type);
    if (merged.status) params.set("status", merged.status);
    if (merged.page > 1) params.set("page", String(merged.page));
    const s = params.toString();
    return s ? `/admin/members?${s}` : "/admin/members";
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>회원 관리</h1>
      <p className={styles.pageDesc}>
        전체 회원을 조회·검색하고, 사업자 가입 신청을 승인/반려합니다.
      </p>

      <div className={styles.filterRows}>
        <div className={styles.filterLine}>
          <span className={styles.filterLabel}>유형</span>
          <div className={styles.filterChips}>
            {TYPE_FILTERS.map((f) => (
              <Link
                key={f.value}
                href={hrefWith({ type: f.value })}
                className={`${styles.chip} ${
                  type === f.value ? styles.chipActive : ""
                }`}
              >
                {f.label}
              </Link>
            ))}
          </div>
        </div>
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
        <form className={styles.search} action="/admin/members" method="get">
          {type && <input type="hidden" name="type" value={type} />}
          {status && <input type="hidden" name="status" value={status} />}
          <input
            className={styles.searchInput}
            type="search"
            name="q"
            defaultValue={q}
            placeholder="이메일 · 상호 · 사업자번호 검색"
          />
          <button type="submit" className={styles.button}>
            검색
          </button>
        </form>
        <p className={styles.count}>총 {total}명</p>
      </div>

      <div className={styles.card}>
        {rows.length === 0 ? (
          <div className={styles.empty}>조건에 맞는 회원이 없습니다.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>이메일</th>
                <th>유형</th>
                <th>상호 / 사업자번호</th>
                <th>상태</th>
                <th>가입일</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id}>
                  <td>
                    <Link href={`/admin/members/${m.id}`} className={styles.pName}>
                      {m.email}
                    </Link>
                  </td>
                  <td>{m.type === "BUSINESS" ? "사업자" : "개인"}</td>
                  <td>
                    {m.type === "BUSINESS" ? (
                      <>
                        <div>{m.company ?? "—"}</div>
                        <div className={styles.pId}>{m.bizNo ?? "—"}</div>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <StatusPill status={m.status} />
                  </td>
                  <td className={styles.mono}>
                    {new Date(m.createdAt).toLocaleDateString("ko-KR")}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      {m.type === "BUSINESS" && m.status === "PENDING" && (
                        <MemberActions id={m.id} />
                      )}
                      <Link
                        href={`/admin/members/${m.id}`}
                        className={styles.button}
                      >
                        상세
                      </Link>
                    </div>
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
            <Link
              href={hrefWith({ page: page - 1 })}
              className={styles.button}
            >
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
            <Link
              href={hrefWith({ page: page + 1 })}
              className={styles.button}
            >
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
