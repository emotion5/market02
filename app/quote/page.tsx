"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Printer } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";
import { SUPPLIER, QUOTE_VALID_DAYS as VALID_DAYS } from "@/lib/constants";
import styles from "./page.module.css";

// 숫자를 한글 금액 표기로 변환 (예: 128000 → "일십이만팔천")
function numberToKorean(num: number): string {
  if (num === 0) return "영";
  const digits = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
  const small = ["", "십", "백", "천"];
  const big = ["", "만", "억", "조"];
  let result = "";
  let bigIdx = 0;
  let n = num;
  while (n > 0) {
    const chunk = n % 10000;
    if (chunk > 0) {
      let chunkStr = "";
      let c = chunk;
      let smallIdx = 0;
      while (c > 0) {
        const d = c % 10;
        if (d > 0) chunkStr = digits[d] + small[smallIdx] + chunkStr;
        c = Math.floor(c / 10);
        smallIdx++;
      }
      result = chunkStr + big[bigIdx] + result;
    }
    n = Math.floor(n / 10000);
    bigIdx++;
  }
  return result;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}. ${m}. ${day}`;
}

export default function QuotePage() {
  const { items, totalPrice } = useCart();

  // 상호/담당자/연락처 등 공급받는 자 정보 (입력)
  const [company, setCompany] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactTel, setContactTel] = useState("");

  // 발행일·견적번호는 하이드레이션 불일치를 피하려 mount 이후 생성
  const [issued, setIssued] = useState<{ date: Date; number: string } | null>(
    null,
  );

  useEffect(() => {
    const now = new Date();
    const number = `Q-${now.getFullYear()}${String(now.getMonth() + 1).padStart(
      2,
      "0",
    )}${String(now.getDate()).padStart(2, "0")}-${String(
      now.getHours(),
    ).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIssued({ date: now, number });
  }, []);

  const supply = Math.round(totalPrice / 1.1); // 공급가액
  const vat = totalPrice - supply; // 부가세 (10%)

  const validUntil = issued
    ? new Date(issued.date.getTime() + VALID_DAYS * 86400000)
    : null;

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <p>견적서에 담긴 상품이 없습니다.</p>
        <Link href="/products" className={styles.emptyLink}>
          상품 보러 가기
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      {/* 화면 전용 툴바 (인쇄 시 숨김) */}
      <div className={styles.toolbar}>
        <Link href="/cart" className={styles.editLink}>
          ← 항목 편집
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

      {/* A4 종이 견적서 */}
      <div className={styles.sheet}>
        <h1 className={styles.docTitle}>견 적 서</h1>

        <div className={styles.metaRow}>
          <dl className={styles.meta}>
            <div>
              <dt>견적번호</dt>
              <dd>{issued?.number ?? "—"}</dd>
            </div>
            <div>
              <dt>견적일자</dt>
              <dd>{issued ? formatDate(issued.date) : "—"}</dd>
            </div>
            <div>
              <dt>유효기간</dt>
              <dd>{validUntil ? formatDate(validUntil) : "—"}</dd>
            </div>
          </dl>
        </div>

        {/* 공급받는 자 / 공급자 */}
        <div className={styles.parties}>
          <section className={styles.party}>
            <h2 className={styles.partyTitle}>공급받는 자</h2>
            <div className={styles.field}>
              <label>상호</label>
              <input
                className={styles.input}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="회사명을 입력하세요"
              />
            </div>
            <div className={styles.field}>
              <label>담당자</label>
              <input
                className={styles.input}
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="담당자명"
              />
            </div>
            <div className={styles.field}>
              <label>연락처</label>
              <input
                className={styles.input}
                value={contactTel}
                onChange={(e) => setContactTel(e.target.value)}
                placeholder="연락처"
              />
            </div>
          </section>

          <section className={styles.party}>
            <h2 className={styles.partyTitle}>공급자</h2>
            <div className={styles.field}>
              <label>상호</label>
              <span className={styles.value}>{SUPPLIER.name}</span>
            </div>
            <div className={styles.field}>
              <label>대표자</label>
              <span className={styles.value}>{SUPPLIER.owner}</span>
            </div>
            <div className={styles.field}>
              <label>사업자번호</label>
              <span className={styles.value}>{SUPPLIER.bizNo}</span>
            </div>
            <div className={styles.field}>
              <label>주소</label>
              <span className={styles.value}>{SUPPLIER.address}</span>
            </div>
            <div className={styles.field}>
              <label>연락처</label>
              <span className={styles.value}>{SUPPLIER.tel}</span>
            </div>
            <span className={styles.stamp} aria-hidden>
              인
            </span>
          </section>
        </div>

        {/* 합계 금액 (한글 표기) */}
        <p className={styles.amountLine}>
          합계금액 (부가세 포함)
          <strong>
            일금 {numberToKorean(totalPrice)}원정 (₩
            {totalPrice.toLocaleString("ko-KR")})
          </strong>
        </p>

        {/* 품목 표 */}
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.colNo}>No</th>
              <th className={styles.colName}>품목</th>
              <th className={styles.colSpec}>규격</th>
              <th className={styles.colQty}>수량</th>
              <th className={styles.colPrice}>단가</th>
              <th className={styles.colAmount}>금액</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={`${item.productId}-${item.variantId}`}>
                <td className={styles.colNo}>{i + 1}</td>
                <td className={styles.colName}>{item.productName}</td>
                <td className={styles.colSpec}>{item.variantName}</td>
                <td className={styles.colQty}>{item.quantity}</td>
                <td className={styles.colPrice}>{formatPrice(item.price)}</td>
                <td className={styles.colAmount}>
                  {formatPrice(item.price * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5}>공급가액</td>
              <td className={styles.colAmount}>{formatPrice(supply)}</td>
            </tr>
            <tr>
              <td colSpan={5}>부가세 (10%)</td>
              <td className={styles.colAmount}>{formatPrice(vat)}</td>
            </tr>
            <tr className={styles.grandTotal}>
              <td colSpan={5}>합계금액</td>
              <td className={styles.colAmount}>{formatPrice(totalPrice)}</td>
            </tr>
          </tfoot>
        </table>

        <p className={styles.note}>
          ※ 상기 단가 및 금액은 부가가치세가 포함된 금액입니다.
          <br />※ 본 견적서의 유효기간은 발행일로부터 {VALID_DAYS}일입니다.
        </p>
      </div>

      {/* 화면 전용 하단 주문 바 (인쇄 시 숨김) */}
      <div className={styles.footerBar}>
        <div className={styles.footerTotal}>
          <span>결제 예정 금액</span>
          <strong>{formatPrice(totalPrice)}</strong>
        </div>
        <Link href="/checkout" className={styles.orderButton}>
          주문 / 결제하기
        </Link>
      </div>
    </div>
  );
}
