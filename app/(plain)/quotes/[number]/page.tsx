"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Printer, ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";
import QuoteSheet from "@/components/quote/QuoteSheet";
import { useSiteSettings } from "@/components/SiteSettingsProvider";
import {
  getQuote,
  isQuoteExpired,
  quoteValidUntil,
  type SavedQuote,
} from "@/lib/quotes";
import styles from "./page.module.css";

function formatDate(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

// 발행된 견적서 열람. 발행 시점에 굳은 문서라 읽기 전용이다 —
// 내용을 바꾸려면 상품을 다시 담아 새로 발행해야 한다.
export default function SavedQuotePage() {
  const params = useParams<{ number: string }>();
  const number = decodeURIComponent(params.number);
  const router = useRouter();
  const { items: cartItems, addItem, clearCart } = useCart();
  const settings = useSiteSettings();

  // localStorage는 클라이언트에서만 접근 → mount 이후 로드
  // (undefined = 로딩 중, null = 없는 견적번호)
  const [quote, setQuote] = useState<SavedQuote | null | undefined>(undefined);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuote(getQuote(number) ?? null);
  }, [number]);

  if (quote === undefined) {
    return <p className={styles.loading}>불러오는 중…</p>;
  }

  if (quote === null) {
    return (
      <div className={styles.empty}>
        <p>견적서 {number} 를 찾을 수 없습니다.</p>
        <Link href="/mypage/quotes" className={styles.emptyLink}>
          견적서 내역으로
        </Link>
      </div>
    );
  }

  const expired = isQuoteExpired(quote.issuedAt, settings.quoteValidDays);

  // 발행본의 품목으로 견적서(장바구니)를 채운 뒤 결제로 보낸다.
  // 담아둔 게 있으면 덮어쓰게 되므로 먼저 확인을 받는다.
  const orderThis = () => {
    if (
      cartItems.length > 0 &&
      !window.confirm(
        "현재 견적서에 담긴 상품이 이 발행본의 내용으로 대체됩니다. 계속할까요?",
      )
    ) {
      return;
    }
    clearCart();
    quote.items.forEach(({ quantity, ...item }) => addItem(item, quantity));
    router.push("/checkout");
  };

  return (
    <div className={styles.screen}>
      {/* 화면 전용 툴바 (인쇄 시 숨김) */}
      <div className={styles.toolbar}>
        <Link href="/mypage/quotes" className={styles.backLink}>
          ← 견적서 내역
        </Link>
        <button
          type="button"
          className={styles.printButton}
          onClick={() => window.print()}
        >
          <Printer size={16} strokeWidth={1.75} />
          인쇄 / PDF 저장
        </button>
      </div>

      <div className={styles.statusBar}>
        <span className={styles.issued}>
          {formatDate(quote.issuedAt)} 발행 · 유효기간{" "}
          {formatDate(
            quoteValidUntil(quote.issuedAt, settings.quoteValidDays).toISOString(),
          )}
        </span>
        <span className={`${styles.badge} ${expired ? styles.expired : ""}`}>
          {expired ? "유효기간 만료" : "유효"}
        </span>
      </div>

      <QuoteSheet
        number={quote.number}
        issuedAt={new Date(quote.issuedAt)}
        items={quote.items}
        customer={quote.customer}
      />

      {/* 화면 전용 하단 바 (인쇄 시 숨김) */}
      <div className={styles.footerBar}>
        <div className={styles.footerTotal}>
          <span>합계금액</span>
          <strong>{formatPrice(quote.total)}</strong>
        </div>
        <button
          type="button"
          className={styles.orderButton}
          onClick={orderThis}
        >
          <ShoppingCart size={16} strokeWidth={1.75} />이 견적으로 주문하기
        </button>
      </div>

      <p className={styles.note}>
        ※ 발행된 견적서는 수정할 수 없습니다. 내용을 바꾸려면 상품을 다시 담아
        새로 발행해주세요.
        {expired && (
          <>
            <br />※ 유효기간이 지난 견적서입니다. 가격이 달라졌을 수 있으니 새로
            발행해 확인해주세요.
          </>
        )}
      </p>
    </div>
  );
}
