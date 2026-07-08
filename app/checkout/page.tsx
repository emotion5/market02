"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";
import { SUPPLIER, BANK_ACCOUNT } from "@/lib/constants";
import styles from "./page.module.css";

// 사업자등록번호 10자리를 000-00-00000 형태로 표시
function formatBizNo(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  const parts = [digits.slice(0, 3), digits.slice(3, 5), digits.slice(5, 10)];
  return parts.filter(Boolean).join("-");
}

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();

  // 주문자 / 배송 정보
  const [ordererName, setOrdererName] = useState("");
  const [ordererTel, setOrdererTel] = useState("");
  const [address, setAddress] = useState("");
  const [memo, setMemo] = useState("");

  // 무통장입금 정보
  const [depositor, setDepositor] = useState("");

  // 세금계산서 (사업자 정보)
  const [taxInvoice, setTaxInvoice] = useState(true);
  const [bizNo, setBizNo] = useState("");
  const [company, setCompany] = useState("");

  // 주문 완료 상태
  const [orderNo, setOrderNo] = useState<string | null>(null);

  const supply = Math.round(totalPrice / 1.1);
  const vat = totalPrice - supply;

  // 주문번호는 하이드레이션 불일치를 피하려 완료 시점(클라이언트)에서 생성
  const placeOrder = () => {
    const now = new Date();
    const no = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(
      2,
      "0",
    )}${String(now.getDate()).padStart(2, "0")}-${String(
      now.getHours(),
    ).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(
      now.getSeconds(),
    ).padStart(2, "0")}`;
    setOrderNo(no);
  };

  const canOrder =
    items.length > 0 &&
    ordererName.trim() &&
    ordererTel.trim() &&
    address.trim() &&
    depositor.trim() &&
    (!taxInvoice || bizNo.replace(/\D/g, "").length === 10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canOrder) return;
    // TODO: 백엔드 연동 (주문 저장·입금 대기 처리·세금계산서 발행) — 현재는 UI만 구성
    placeOrder();
  };

  // 완료 후 스크롤 상단으로
  useEffect(() => {
    if (orderNo) window.scrollTo(0, 0);
  }, [orderNo]);

  // ── 주문 완료 화면 ───────────────────────────────
  if (orderNo) {
    return (
      <div className={styles.page}>
        <div className={styles.doneCard}>
          <p className={styles.doneBadge}>주문 접수 완료</p>
          <h1 className={styles.doneTitle}>입금을 기다리고 있습니다</h1>
          <p className={styles.doneText}>
            주문번호 <strong>{orderNo}</strong>
            <br />
            아래 계좌로 입금해주시면 확인 후 처리해드립니다.
          </p>

          <dl className={styles.depositBox}>
            <div>
              <dt>입금 은행</dt>
              <dd>{BANK_ACCOUNT.bank}</dd>
            </div>
            <div>
              <dt>계좌번호</dt>
              <dd>{BANK_ACCOUNT.number}</dd>
            </div>
            <div>
              <dt>예금주</dt>
              <dd>{BANK_ACCOUNT.holder}</dd>
            </div>
            <div className={styles.depositAmount}>
              <dt>입금 금액</dt>
              <dd>{formatPrice(totalPrice)}</dd>
            </div>
          </dl>

          <p className={styles.doneNotice}>
            입금자명이 <strong>{depositor}</strong> 와(과) 다를 경우 확인이
            지연될 수 있습니다.
            {taxInvoice && (
              <>
                <br />
                세금계산서는 입금 확인 후 사업자등록번호{" "}
                <strong>{bizNo}</strong> 로 발행됩니다.
              </>
            )}
          </p>

          <div className={styles.doneActions}>
            <button
              type="button"
              className={styles.primaryAction}
              onClick={() => {
                clearCart();
                window.location.href = "/";
              }}
            >
              확인 (견적서 비우기)
            </button>
            <Link href="/quote" className={styles.secondaryAction}>
              견적서 다시 보기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── 빈 견적서 ────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <p>주문할 상품이 없습니다.</p>
        <Link href="/products" className={styles.emptyLink}>
          상품 보러 가기
        </Link>
      </div>
    );
  }

  // ── 주문/결제 화면 ───────────────────────────────
  return (
    <form className={styles.page} onSubmit={handleSubmit}>
      <h1 className={styles.title}>주문 / 결제</h1>

      <div className={styles.layout}>
        <div className={styles.main}>
          {/* 주문자 / 배송 정보 */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>주문자 · 배송 정보</h2>
            <div className={styles.field}>
              <label className={styles.label}>받는 분</label>
              <input
                className={styles.input}
                value={ordererName}
                onChange={(e) => setOrdererName(e.target.value)}
                placeholder="이름 또는 상호"
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>연락처</label>
              <input
                className={styles.input}
                value={ordererTel}
                onChange={(e) => setOrdererTel(e.target.value)}
                placeholder="연락처"
                inputMode="tel"
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>배송지</label>
              <input
                className={styles.input}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="배송받을 주소를 입력하세요"
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>배송 메모</label>
              <input
                className={styles.input}
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="예: 부재 시 경비실에 맡겨주세요 (선택)"
              />
            </div>
          </section>

          {/* 주문 상품 */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>주문 상품 {items.length}건</h2>
            <ul className={styles.orderItems}>
              {items.map((item) => (
                <li
                  key={`${item.productId}-${item.variantId}`}
                  className={styles.orderItem}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.productName}
                    className={styles.thumb}
                  />
                  <div className={styles.orderItemInfo}>
                    <p className={styles.orderItemName}>{item.productName}</p>
                    <p className={styles.orderItemVariant}>
                      {item.variantName} / 수량 {item.quantity}개
                    </p>
                  </div>
                  <span className={styles.orderItemPrice}>
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <p className={styles.shippingNote}>
              ※ 배송비는 품목·수량·지역에 따라 별도이며 입금 전 안내드립니다.
            </p>
          </section>

          {/* 결제수단: 무통장입금 */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>결제수단</h2>
            <div className={styles.payMethod}>
              <span className={styles.radioOn} aria-hidden />
              무통장입금 (사업자 거래)
            </div>

            <dl className={styles.accountBox}>
              <div>
                <dt>입금 은행</dt>
                <dd>{BANK_ACCOUNT.bank}</dd>
              </div>
              <div>
                <dt>계좌번호</dt>
                <dd>{BANK_ACCOUNT.number}</dd>
              </div>
              <div>
                <dt>예금주</dt>
                <dd>{BANK_ACCOUNT.holder}</dd>
              </div>
              <div>
                <dt>공급자 사업자등록번호</dt>
                <dd>{SUPPLIER.bizNo}</dd>
              </div>
            </dl>

            <div className={styles.field}>
              <label className={styles.label}>입금자명</label>
              <input
                className={styles.input}
                value={depositor}
                onChange={(e) => setDepositor(e.target.value)}
                placeholder="입금하실 분의 성함 / 상호"
                required
              />
            </div>
          </section>

          {/* 세금계산서 (사업자 정보) */}
          <section className={styles.section}>
            <div className={styles.sectionTitleRow}>
              <h2 className={styles.sectionTitle}>세금계산서</h2>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={taxInvoice}
                  onChange={(e) => setTaxInvoice(e.target.checked)}
                />
                전자세금계산서 발행
              </label>
            </div>

            {taxInvoice && (
              <>
                <div className={styles.field}>
                  <label className={styles.label}>사업자등록번호</label>
                  <input
                    className={styles.input}
                    value={bizNo}
                    onChange={(e) => setBizNo(formatBizNo(e.target.value))}
                    placeholder="000-00-00000"
                    inputMode="numeric"
                    required={taxInvoice}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>상호</label>
                  <input
                    className={styles.input}
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="사업자 상호 (선택)"
                  />
                </div>
                <p className={styles.taxNote}>
                  세금계산서는 입금 확인 후 입력하신 사업자등록번호로 발행됩니다.
                </p>
              </>
            )}
          </section>
        </div>

        {/* 결제 요약 */}
        <aside className={styles.summary}>
          <h2 className={styles.summaryTitle}>결제 금액</h2>
          <dl className={styles.summaryRows}>
            <div className={styles.summaryRow}>
              <dt>공급가액</dt>
              <dd>{formatPrice(supply)}</dd>
            </div>
            <div className={styles.summaryRow}>
              <dt>부가세 (10%)</dt>
              <dd>{formatPrice(vat)}</dd>
            </div>
            <div className={styles.summaryRow}>
              <dt>배송비</dt>
              <dd className={styles.muted}>별도 안내</dd>
            </div>
            <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
              <dt>합계</dt>
              <dd>{formatPrice(totalPrice)}</dd>
            </div>
          </dl>

          <button
            type="submit"
            className={styles.orderButton}
            disabled={!canOrder}
          >
            {formatPrice(totalPrice)} 주문하기
          </button>
          <p className={styles.agree}>
            주문 내용을 확인하였으며 무통장입금 결제에 동의합니다.
          </p>
        </aside>
      </div>
    </form>
  );
}
