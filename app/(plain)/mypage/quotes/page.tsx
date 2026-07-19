"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useSiteSettings } from "@/components/SiteSettingsProvider";
import {
  getQuotes,
  isQuoteExpired,
  quoteValidUntil,
  type SavedQuote,
} from "@/lib/quotes";
import styles from "./page.module.css";

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(
    d.getHours(),
  )}:${p(d.getMinutes())}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<SavedQuote[] | null>(null);
  const settings = useSiteSettings();

  // localStorage는 클라이언트에서만 접근 → mount 이후 로드
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuotes(getQuotes());
  }, []);

  if (quotes === null) {
    return <p className={styles.loading}>불러오는 중…</p>;
  }

  if (quotes.length === 0) {
    return (
      <div className={styles.empty}>
        <FileText size={40} strokeWidth={1.5} />
        <p>발행한 견적서가 없습니다.</p>
        <Link href="/quote" className={styles.emptyLink}>
          견적서 작성하기
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.head}>
        <h2 className={styles.heading}>견적서 내역</h2>
        <p className={styles.subnote}>
          발행한 견적서가 최신순으로 표시됩니다. 발행 시점의 내용 그대로 보관됩니다.
        </p>
      </div>

      <ul className={styles.quoteList}>
        {quotes.map((quote) => {
          const expired = isQuoteExpired(quote.issuedAt, settings.quoteValidDays);
          const [first, ...rest] = quote.items;

          return (
            <li key={quote.number} className={styles.card}>
              <div className={styles.cardHead}>
                <div>
                  <span className={styles.quoteNo}>견적번호 {quote.number}</span>
                  <span className={styles.date}>
                    {formatDateTime(quote.issuedAt)}
                  </span>
                </div>
                <span
                  className={`${styles.badge} ${expired ? styles.expired : ""}`}
                >
                  {expired ? "유효기간 만료" : "유효"}
                </span>
              </div>

              <div className={styles.body}>
                {first && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={first.image}
                    alt={first.productName}
                    className={styles.thumb}
                  />
                )}
                <div className={styles.summary}>
                  <p className={styles.itemNames}>
                    {first?.productName}
                    {rest.length > 0 && ` 외 ${rest.length}건`}
                  </p>
                  <p className={styles.customer}>
                    {quote.customer.company || "상호 미입력"}
                    {" · "}
                    유효기간{" "}
                    {formatDate(
                      quoteValidUntil(
                        quote.issuedAt,
                        settings.quoteValidDays,
                      ).toISOString(),
                    )}
                  </p>
                </div>
              </div>

              <div className={styles.cardFoot}>
                <span className={styles.total}>
                  합계금액 <strong>{formatPrice(quote.total)}</strong>
                </span>
                <Link
                  href={`/quotes/${quote.number}`}
                  className={styles.viewButton}
                >
                  견적서 보기
                </Link>
              </div>
            </li>
          );
        })}
      </ul>

      <p className={styles.mockNote}>
        ※ 견적서는 발행 당시의 가격·품목으로 저장되며, 이후 상품 가격이 변경되어도
        바뀌지 않습니다.
      </p>
    </div>
  );
}
