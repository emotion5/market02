import Link from "next/link";
import styles from "./BrandLogo.module.css";

// 사이트 로고. 셸 페이지에서는 좌측 견적서 컬럼 위, 그 외 페이지에서는 헤더 바 왼쪽에 놓인다.
export default function BrandLogo() {
  return (
    <Link href="/" className={styles.logo} aria-label="MMM MARKET">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/brand/logo_main.png"
        alt="MMM MARKET"
        className={styles.img}
      />
    </Link>
  );
}
