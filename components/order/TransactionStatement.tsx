"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Printer } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import styles from "./TransactionStatement.module.css";

// 거래명세표(참고·현장 확인용 문서). 발행된 세금계산서/현금영수증과 별개로,
// 해당 주문에 무엇을 얼마에 보냈는지 한 장으로 보여준다. 견적서 인쇄 구조를 재사용.

export interface StatementItem {
  date: string; // 거래일 "MM.DD" 표기용 (주문일)
  name: string; // 품목(상품명)
  spec: string; // 규격(옵션/색상)
  qty: number;
  unitPrice: number; // 단가(부가세 포함 표시가)
  supply: number; // 공급가액
  vat: number; // 세액
}

export interface StatementData {
  issueNo: string; // 발급 No. (= 주문번호)
  issuedDate: string; // 발행일(출력일)
  customerName: string; // 거래처(상호 또는 수령자명)
  supplier: {
    name: string;
    owner: string;
    bizNo: string;
    address: string;
    category: string; // 업태/종목
    tel: string;
  };
  recipient: { name: string; tel: string; address: string }; // 수령 정보(현장 확인용)
  items: StatementItem[];
  total: number;
}

export default function TransactionStatement({ data }: { data: StatementData }) {
  // A4(794px)를 화면 폭에 맞춰 통째로 축소 (견적서와 동일 방식)
  const A4_WIDTH = 794;
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
  }, []);

  return (
    <div className={styles.screen}>
      {/* 화면 전용 툴바 (인쇄 시 숨김) */}
      <div className={styles.toolbar}>
        <Link href="/mypage/orders" className={styles.backLink}>
          ← 결제내역
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

      <div ref={fitRef} className={styles.sheetFit} style={{ height: fitHeight }}>
        <div
          ref={sheetRef}
          className={styles.sheet}
          style={{ transform: `scale(${scale})` }}
        >
          <h1 className={styles.docTitle}>거 래 명 세 표</h1>

          {/* 상단: 좌(발급정보) / 우(공급자) */}
          <div className={styles.head}>
            <dl className={styles.issueMeta}>
              <div>
                <dt>발급 No.</dt>
                <dd className={styles.mono}>{data.issueNo}</dd>
              </div>
              <div>
                <dt>발행일</dt>
                <dd>{data.issuedDate}</dd>
              </div>
              <div>
                <dt>거래처</dt>
                <dd>{data.customerName || "—"}</dd>
              </div>
            </dl>

            <table className={styles.supplier}>
              <colgroup>
                <col className={styles.cLabel} />
                <col />
              </colgroup>
              <tbody>
                <tr>
                  <th>등록번호</th>
                  <td className={styles.mono}>{data.supplier.bizNo}</td>
                </tr>
                <tr>
                  <th>상호(법인명)</th>
                  <td>{data.supplier.name}</td>
                </tr>
                <tr>
                  <th>대표자</th>
                  <td>{data.supplier.owner}</td>
                </tr>
                <tr>
                  <th>사업장 주소</th>
                  <td>{data.supplier.address}</td>
                </tr>
                <tr>
                  <th>업태/종목</th>
                  <td>{data.supplier.category}</td>
                </tr>
                <tr>
                  <th>연락처</th>
                  <td>{data.supplier.tel}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 수령 정보(현장 확인용) */}
          <table className={styles.recipient}>
            <colgroup>
              <col className={styles.cLabel} />
              <col />
            </colgroup>
            <tbody>
              <tr>
                <th>수령자</th>
                <td>{data.recipient.name || "—"}</td>
              </tr>
              <tr>
                <th>연락처</th>
                <td>{data.recipient.tel || "—"}</td>
              </tr>
              <tr>
                <th>배송지</th>
                <td>{data.recipient.address || "—"}</td>
              </tr>
            </tbody>
          </table>

          {/* 품목 표 */}
          <table className={styles.items}>
            <thead>
              <tr>
                <th className={styles.colDate}>월</th>
                <th className={styles.colDate}>일</th>
                <th className={styles.colName}>품목</th>
                <th className={styles.colSpec}>규격</th>
                <th className={styles.colQty}>수량</th>
                <th className={styles.colNum}>단가</th>
                <th className={styles.colNum}>공급가액</th>
                <th className={styles.colNum}>세액</th>
                <th className={styles.colMemo}>비고</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((it, i) => {
                const [mm, dd] = it.date.split(".");
                return (
                  <tr key={i}>
                    <td className={styles.colDate}>{mm}</td>
                    <td className={styles.colDate}>{dd}</td>
                    <td className={styles.colName}>{it.name}</td>
                    <td className={styles.colSpec}>{it.spec}</td>
                    <td className={styles.colQty}>{it.qty}</td>
                    <td className={styles.colNum}>{formatPrice(it.unitPrice)}</td>
                    <td className={styles.colNum}>{formatPrice(it.supply)}</td>
                    <td className={styles.colNum}>{formatPrice(it.vat)}</td>
                    <td className={styles.colMemo} />
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className={styles.totalRow}>
                <td colSpan={6}>총 합계금액</td>
                <td colSpan={3} className={styles.colNum}>
                  {formatPrice(data.total)}
                </td>
              </tr>
            </tfoot>
          </table>

          <p className={styles.note}>
            ※ 본 거래명세표는 거래 내역 확인용 문서입니다. 세금계산서·현금영수증
            등 적격증빙은 별도로 발급됩니다.
            <br />※ 세액 = 반올림(단가 × 수량 × 10 / 110), 공급가액 = (단가 ×
            수량) − 세액.
          </p>
        </div>
      </div>
    </div>
  );
}
