import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { getMe } from "@/server/auth/service";
import AdminNav from "@/components/admin/AdminNav";
import styles from "./admin.module.css";

// 어드민 전용 레이아웃 (쇼핑몰 헤더/견적패널 없음).
// proxy 는 낙관적 게이트였고, 여기서 서버가 ADMIN 을 최종 확인한다.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionUser();
  if (!session) redirect("/login?redirect=/admin/members");
  const user = await getMe(session.userId);
  if (!user || user.role !== "ADMIN") redirect("/");

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>MMM 관리자</div>
        <AdminNav />
        <div className={styles.sidebarFoot}>
          <span className={styles.adminEmail}>{user.email}</span>
          <Link href="/" className={styles.backToShop}>
            ← 쇼핑몰로
          </Link>
        </div>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
