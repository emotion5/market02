import { listPendingBusinesses } from "@/lib/admin";
import StatusPill from "@/components/admin/StatusPill";
import MemberActions from "@/components/admin/MemberActions";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export default async function AdminMembersPage() {
  const pending = await listPendingBusinesses();

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>회원 승인</h1>
      <p className={styles.pageDesc}>
        사업자 회원 가입 신청을 검토하고 승인/반려합니다. 승인하면 회원도매가가
        적용됩니다.
      </p>

      <div className={styles.card}>
        {pending.length === 0 ? (
          <div className={styles.empty}>승인 대기 중인 사업자가 없습니다.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>상호</th>
                <th>사업자등록번호</th>
                <th>이메일</th>
                <th>상태</th>
                <th>신청일</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pending.map((m) => (
                <tr key={m.id}>
                  <td>{m.company ?? "—"}</td>
                  <td className={styles.mono}>{m.bizNo}</td>
                  <td>{m.email}</td>
                  <td>
                    <StatusPill status="PENDING" />
                  </td>
                  <td className={styles.mono}>
                    {new Date(m.createdAt).toLocaleDateString("ko-KR")}
                  </td>
                  <td>
                    <MemberActions id={m.id} />
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
