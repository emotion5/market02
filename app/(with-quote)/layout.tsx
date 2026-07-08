import QuotePanel from "@/components/cart/QuotePanel";
import CategoryNav from "@/components/layout/CategoryNav";
import styles from "./layout.module.css";

// 상품 리스트/상세 페이지 공용 셸: 좌측에 견적서 패널이 항상 따라다닌다.
export default function WithQuoteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
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
    </div>
  );
}
