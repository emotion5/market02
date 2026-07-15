import QuotePanel from "@/components/cart/QuotePanel";
import MobileQuoteBar from "@/components/cart/MobileQuoteBar";
import CategoryNav from "@/components/layout/CategoryNav";
import BrandLogo from "@/components/layout/BrandLogo";
import HeaderNav from "@/components/layout/HeaderNav";
import styles from "./layout.module.css";

// 상품 리스트/상세 페이지 공용 셸: 좌측에 견적서 패널이 항상 따라다닌다.
// 헤더 바 없이 로고(좌측 컬럼 위)와 아이콘(콘텐츠 우측 상단)을 셸 격자에 직접 배치해서
// 흰 컬럼 / 회색 콘텐츠가 화면 맨 위부터 끊김 없이 이어지게 한다.
// modal 슬롯: 목록 위에 상품 상세를 오버랩하는 인터셉트 모달(@modal)
export default function WithQuoteLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <div className={styles.shell}>
      <div className={styles.logoCell}>
        <BrandLogo />
      </div>
      <div className={styles.navCell}>
        <HeaderNav />
      </div>
      <div className={styles.panel}>
        <div className={styles.panelInner}>
          <QuotePanel />
        </div>
      </div>
      <div className={styles.content}>
        <CategoryNav />
        {children}
      </div>
      {/* 아래 둘은 position: fixed라 격자 배치에서 빠진다 */}
      <MobileQuoteBar />
      {modal}
    </div>
  );
}
