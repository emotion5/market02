import QuotePanel from "@/components/cart/QuotePanel";
import MobileQuoteBar from "@/components/cart/MobileQuoteBar";
import CategoryNav from "@/components/layout/CategoryNav";
import styles from "./layout.module.css";

// 상품 리스트/상세 페이지 공용 셸: 좌측에 견적서 패널이 항상 따라다닌다.
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
      <div className={styles.side}>
        <QuotePanel />
      </div>
      <div className={styles.content}>
        <CategoryNav />
        {children}
      </div>
      <MobileQuoteBar />
      {modal}
    </div>
  );
}
