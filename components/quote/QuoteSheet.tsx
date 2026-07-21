"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { CartItem } from "@/lib/types";
import type { QuoteCustomer } from "@/lib/quotes";
import { quoteTotals } from "@/lib/quotes";
import { formatPrice, thumbUrl } from "@/lib/utils";
import { useSiteSettings } from "@/components/SiteSettingsProvider";
import styles from "./QuoteSheet.module.css";

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

interface QuoteSheetProps {
  number: string | null; // 아직 정해지지 않았으면 null → "—"
  issuedAt: Date | null;
  // 발행본은 발행 당시 유효기한을 그대로 넘긴다(스냅샷). 작성 중 미리보기는
  // 생략하면 현재 설정(유효기간 일수)으로 계산한다.
  validUntil?: Date | null;
  items: CartItem[];
  customer: QuoteCustomer;
  /* 작성 중일 때만 true — 공급받는 자 입력, 수량 조절, 품목 삭제가 열린다.
     발행본은 굳은 문서이므로 읽기 전용으로 렌더된다. */
  editable?: boolean;
  onCustomerChange?: (customer: QuoteCustomer) => void;
  onQuantityChange?: (
    productId: string,
    variantId: string,
    quantity: number,
  ) => void;
  onRemove?: (productId: string, variantId: string) => void;
}

// A4 견적서 용지. 작성 중(/quote)과 발행본(/quotes/[number])이 같은 문서로
// 보여야 하므로 양쪽이 이 컴포넌트를 공유한다.
export default function QuoteSheet({
  number,
  issuedAt,
  validUntil: validUntilProp,
  items,
  customer,
  editable = false,
  onCustomerChange,
  onQuantityChange,
  onRemove,
}: QuoteSheetProps) {
  const settings = useSiteSettings();
  const { total, supply, vat } = quoteTotals(items);

  // 발행본은 넘어온 유효기한을 그대로, 미리보기는 현재 설정으로 계산
  const validUntil =
    validUntilProp ??
    (issuedAt
      ? new Date(issuedAt.getTime() + settings.quoteValidDays * 86400000)
      : null);

  // A4 용지를 재배치(reflow)하지 않고 화면 폭에 맞게 통째로 축소한다.
  // (PDF 뷰어의 "페이지 폭 맞춤"과 동일 — 데스크톱/모바일이 같은 모양)
  const A4_WIDTH = 794; // 210mm @ 96dpi
  const fitRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [fitHeight, setFitHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const fit = fitRef.current;
    const sheet = sheetRef.current;
    if (!fit || !sheet) return;
    const recompute = () => {
      const s = Math.min(1, fit.clientWidth / A4_WIDTH);
      setScale(s);
      setFitHeight(sheet.offsetHeight * s);
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(fit);
    ro.observe(sheet);
    return () => ro.disconnect();
  }, [items, customer, issuedAt]);

  const patch = (part: Partial<QuoteCustomer>) =>
    onCustomerChange?.({ ...customer, ...part });

  return (
    <div ref={fitRef} className={styles.sheetFit} style={{ height: fitHeight }}>
      <div
        ref={sheetRef}
        className={styles.sheet}
        style={{ transform: `scale(${scale})` }}
      >
        <h1 className={styles.docTitle}>견 적 서</h1>

        <div className={styles.metaRow}>
          <dl className={styles.meta}>
            <div>
              <dt>견적번호</dt>
              <dd>{number ?? "—"}</dd>
            </div>
            <div>
              <dt>견적일자</dt>
              <dd>{issuedAt ? formatDate(issuedAt) : "—"}</dd>
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
              {editable ? (
                <input
                  className={styles.input}
                  value={customer.company}
                  onChange={(e) => patch({ company: e.target.value })}
                  placeholder="회사명을 입력하세요"
                />
              ) : (
                <span className={styles.value}>{customer.company || "—"}</span>
              )}
            </div>
            <div className={styles.field}>
              <label>담당자</label>
              {editable ? (
                <input
                  className={styles.input}
                  value={customer.contactName}
                  onChange={(e) => patch({ contactName: e.target.value })}
                  placeholder="담당자명"
                />
              ) : (
                <span className={styles.value}>
                  {customer.contactName || "—"}
                </span>
              )}
            </div>
            <div className={styles.field}>
              <label>연락처</label>
              {editable ? (
                <input
                  className={styles.input}
                  value={customer.contactTel}
                  onChange={(e) => patch({ contactTel: e.target.value })}
                  placeholder="연락처"
                />
              ) : (
                <span className={styles.value}>
                  {customer.contactTel || "—"}
                </span>
              )}
            </div>
          </section>

          <section className={styles.party}>
            <h2 className={styles.partyTitle}>공급자</h2>
            <div className={styles.field}>
              <label>상호</label>
              <span className={styles.value}>{settings.supplierName}</span>
            </div>
            <div className={styles.field}>
              <label>대표자</label>
              <span className={styles.value}>{settings.supplierOwner}</span>
            </div>
            <div className={styles.field}>
              <label>사업자번호</label>
              <span className={styles.value}>{settings.supplierBizNo}</span>
            </div>
            <div className={styles.field}>
              <label>주소</label>
              <span className={styles.value}>{settings.supplierAddress}</span>
            </div>
            <div className={styles.field}>
              <label>연락처</label>
              <span className={styles.value}>{settings.supplierTel}</span>
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
            일금 {numberToKorean(total)}원정 (₩{total.toLocaleString("ko-KR")})
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
                <td className={styles.colName}>
                  <div className={styles.itemName}>
                    {item.image && (
                      // 경량 파생 썸네일(.thumb.webp)을 우선 로드하고, 없으면
                      // onError 로 원본 이미지로 폴백한다.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumbUrl(item.image)}
                        alt=""
                        className={styles.thumb}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          const img = e.currentTarget;
                          if (img.dataset.fallback) return;
                          img.dataset.fallback = "1";
                          img.src = item.image;
                        }}
                      />
                    )}
                    <span className={styles.itemNameText}>
                      {item.productName}
                      {editable && (
                        /* 화면 전용 삭제 버튼 (인쇄 시 숨김) */
                        <button
                          type="button"
                          className={styles.removeItem}
                          onClick={() =>
                            onRemove?.(item.productId, item.variantId)
                          }
                          aria-label={`${item.productName} 삭제`}
                        >
                          <X size={14} strokeWidth={2} />
                        </button>
                      )}
                    </span>
                  </div>
                </td>
                <td className={styles.colSpec}>{item.variantName}</td>
                <td className={styles.colQty}>
                  {editable ? (
                    <>
                      {/* 화면: 수량 조절 / 인쇄: 숫자만 */}
                      <span className={styles.qtyEdit}>
                        <button
                          type="button"
                          onClick={() =>
                            onQuantityChange?.(
                              item.productId,
                              item.variantId,
                              item.quantity - 1,
                            )
                          }
                          aria-label="수량 줄이기"
                        >
                          −
                        </button>
                        <span className={styles.qtyValue}>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() =>
                            onQuantityChange?.(
                              item.productId,
                              item.variantId,
                              item.quantity + 1,
                            )
                          }
                          aria-label="수량 늘리기"
                        >
                          +
                        </button>
                      </span>
                      <span className={styles.qtyPrint}>{item.quantity}</span>
                    </>
                  ) : (
                    item.quantity
                  )}
                </td>
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
              <td className={styles.colAmount}>{formatPrice(total)}</td>
            </tr>
          </tfoot>
        </table>

        <p className={styles.note}>
          ※ 상기 단가 및 금액은 부가가치세가 포함된 금액입니다.
          <br />※ 본 견적서의 유효기간은 발행일로부터 {settings.quoteValidDays}
          일입니다.
        </p>
      </div>
    </div>
  );
}
