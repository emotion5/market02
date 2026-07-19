import Link from "next/link";
import { getDashboardStats } from "@/lib/admin";
import styles from "./admin.module.css";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const s = await getDashboardStats();

  // 처리 대기 지표(0이 아니면 주목) + 참고 지표
  const cards = [
    {
      label: "사업자 승인 대기",
      value: s.pendingBusiness,
      href: "/admin/members?type=BUSINESS&status=PENDING",
      cta: "승인 처리",
      alert: s.pendingBusiness > 0,
    },
    {
      label: "입금 대기",
      value: s.pendingDeposit,
      href: "/admin/orders?status=pending",
      cta: "입금 확인",
      alert: s.pendingDeposit > 0,
    },
    {
      label: "배송 처리 대기",
      value: s.toShip,
      href: "/admin/orders?status=paid",
      cta: "배송 처리",
      alert: s.toShip > 0,
    },
    {
      label: "세금계산서 발행 대기",
      value: s.taxPending,
      href: "/admin/orders",
      cta: "발행 처리",
      alert: s.taxPending > 0,
    },
    {
      label: "신규 가입 (7일)",
      value: s.newMembers7d,
      href: "/admin/members",
      cta: "회원 보기",
      alert: false,
    },
    {
      label: "유효 견적서",
      value: s.validQuotes,
      href: "/admin/quotes?status=valid",
      cta: "견적 보기",
      alert: false,
    },
  ];

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>대시보드</h1>
      <p className={styles.pageDesc}>처리 대기 현황을 한눈에 확인합니다.</p>

      <div className={styles.statGrid}>
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className={`${styles.statCard} ${c.alert ? styles.statAlert : ""}`}
          >
            <span className={styles.statLabel}>{c.label}</span>
            <span className={styles.statValue}>
              {c.value.toLocaleString("ko-KR")}
            </span>
            <span className={styles.statCta}>{c.cta} →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
