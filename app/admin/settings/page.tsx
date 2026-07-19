import { getSiteSettings } from "@/lib/admin";
import SettingsForm from "@/components/admin/SettingsForm";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>사이트 설정</h1>
      <p className={styles.pageDesc}>
        견적서·체크아웃·고객센터 안내에 노출되는 공급자 정보와 입금계좌, 견적
        유효기간을 관리합니다.
      </p>

      <SettingsForm settings={settings} />
    </div>
  );
}
