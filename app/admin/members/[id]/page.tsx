import { notFound } from "next/navigation";
import Link from "next/link";
import { getMemberForAdmin } from "@/lib/admin";
import StatusPill from "@/components/admin/StatusPill";
import MemberActions from "@/components/admin/MemberActions";
import styles from "../../admin.module.css";

export const dynamic = "force-dynamic";

function fmt(iso: string) {
  return new Date(iso).toLocaleString("ko-KR");
}

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const m = await getMemberForAdmin(id);
  if (!m) notFound();

  const isPendingBusiness = m.type === "BUSINESS" && m.status === "PENDING";

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>회원 상세</h1>
      <p className={styles.pageDesc}>
        <Link href="/admin/members" className={styles.backToShop}>
          ← 회원 목록
        </Link>{" "}
        · {m.type === "BUSINESS" ? "사업자" : "개인"} 회원
      </p>

      <div className={styles.card} style={{ padding: 24, marginBottom: 20 }}>
        <div className={styles.detailHead}>
          <div>
            <div className={styles.detailEmail}>{m.email}</div>
            <div className={styles.pId}>{m.id}</div>
          </div>
          <StatusPill status={m.status} />
        </div>

        {isPendingBusiness && (
          <div className={styles.detailActions}>
            <MemberActions id={m.id} />
          </div>
        )}

        <table className={styles.table} style={{ marginTop: 8 }}>
          <tbody>
            <tr>
              <th style={{ width: 160 }}>이름</th>
              <td>{m.name ?? "—"}</td>
            </tr>
            <tr>
              <th>연락처</th>
              <td>{m.tel ?? "—"}</td>
            </tr>
            <tr>
              <th>유형</th>
              <td>{m.type === "BUSINESS" ? "사업자" : "개인"}</td>
            </tr>
            <tr>
              <th>가입일</th>
              <td className={styles.mono}>{fmt(m.createdAt)}</td>
            </tr>
            {m.withdrawnAt && (
              <tr>
                <th>탈퇴일</th>
                <td className={styles.mono}>{fmt(m.withdrawnAt)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {m.business && (
        <div className={styles.card} style={{ padding: 24 }}>
          <h2 className={styles.sectionTitle}>사업자 정보</h2>
          <p className={styles.sectionDesc}>
            사업자등록 정보와 승인 처리 이력입니다.
          </p>
          <table className={styles.table}>
            <tbody>
              <tr>
                <th style={{ width: 160 }}>사업자등록번호</th>
                <td className={styles.mono}>{m.business.bizNo}</td>
              </tr>
              <tr>
                <th>상호</th>
                <td>{m.business.company ?? "—"}</td>
              </tr>
              <tr>
                <th>대표자</th>
                <td>{m.business.owner ?? "—"}</td>
              </tr>
              <tr>
                <th>사업자등록증</th>
                <td>
                  {m.business.licenseFileUrl ? (
                    <a
                      href={m.business.licenseFileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.backToShop}
                    >
                      파일 보기
                    </a>
                  ) : (
                    "미첨부"
                  )}
                </td>
              </tr>
              <tr>
                <th>승인일</th>
                <td className={styles.mono}>
                  {m.business.approvedAt ? fmt(m.business.approvedAt) : "—"}
                </td>
              </tr>
              {m.business.rejectReason && (
                <tr>
                  <th>반려 사유</th>
                  <td>{m.business.rejectReason}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
