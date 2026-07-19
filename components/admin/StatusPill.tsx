import styles from "./StatusPill.module.css";

// 회원 상태 뱃지 (어드민 공유 컴포넌트)
const MAP: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: "활성", cls: styles.active },
  PENDING: { label: "승인대기", cls: styles.pending },
  REJECTED: { label: "반려", cls: styles.rejected },
  SUSPENDED: { label: "정지", cls: styles.suspended },
  WITHDRAWN: { label: "탈퇴", cls: styles.withdrawn },
};

export default function StatusPill({ status }: { status: string }) {
  const s = MAP[status] ?? { label: status, cls: styles.withdrawn };
  return <span className={`${styles.pill} ${s.cls}`}>{s.label}</span>;
}
