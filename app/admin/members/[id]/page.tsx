import { notFound } from "next/navigation";
import Link from "next/link";
import { getMemberForAdmin } from "@/lib/admin";
import { signedPrivateUrl } from "@/server/storage";
import StatusPill from "@/components/admin/StatusPill";
import MemberActions from "@/components/admin/MemberActions";
import MemberControls from "@/components/admin/MemberControls";
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
  const canManage = m.status === "ACTIVE" || m.status === "SUSPENDED";

  // 사업자등록증은 비공개 버킷에 저장된 "키"다. 열람은 만료되는 서명 URL 로만(공개 URL 아님).
  // 이 페이지는 관리자 가드 뒤에서만 렌더되므로, 서명 URL 도 관리자 요청에서만 발급된다.
  const licenseHref = m.business?.licenseFileUrl
    ? m.business.licenseFileUrl.startsWith("http")
      ? m.business.licenseFileUrl // 레거시: 값이 이미 전체 URL 인 경우 그대로 사용
      : await signedPrivateUrl(m.business.licenseFileUrl)
    : null;

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
              <th>등급</th>
              <td>
                <span className={styles.gradeBadge}>
                  {m.grade === "WHOLESALE" ? "회원도매가" : "일반(소비자가)"}
                </span>
              </td>
            </tr>
            <tr>
              <th>가입일</th>
              <td className={styles.mono}>{fmt(m.createdAt)}</td>
            </tr>
            {m.status === "SUSPENDED" && m.suspendedAt && (
              <tr>
                <th>정지일</th>
                <td className={styles.mono}>{fmt(m.suspendedAt)}</td>
              </tr>
            )}
            {m.status === "SUSPENDED" && m.suspendReason && (
              <tr>
                <th>정지 사유</th>
                <td>{m.suspendReason}</td>
              </tr>
            )}
            {m.withdrawnAt && (
              <tr>
                <th>탈퇴일</th>
                <td className={styles.mono}>{fmt(m.withdrawnAt)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {canManage && (
        <div className={styles.card} style={{ padding: 24, marginBottom: 20 }}>
          <h2 className={styles.sectionTitle}>회원 관리</h2>
          <p className={styles.sectionDesc}>
            회원도매가 자격을 부여/회수하거나 계정을 정지·해제합니다.
          </p>
          <MemberControls id={m.id} status={m.status} grade={m.grade} />
        </div>
      )}

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
                  {licenseHref ? (
                    <a
                      href={licenseHref}
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
