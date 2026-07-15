import BrandLogo from "./BrandLogo";
import HeaderNav from "./HeaderNav";
import styles from "./Header.module.css";

// 견적서 셸(app/(with-quote)) 밖의 페이지용 헤더 바.
// 셸 페이지에서는 이 바 대신 BrandLogo/HeaderNav를 컬럼에 직접 배치한다.
export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <BrandLogo />
        <HeaderNav />
      </div>
    </header>
  );
}
