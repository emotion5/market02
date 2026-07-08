"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Truck, Package } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import {
  getOrders,
  deriveStatus,
  trackingNumber,
  COURIER,
  STATUS_FLOW,
  STATUS_LABEL,
  type Order,
  type OrderStatus,
} from "@/lib/orders";
import styles from "./page.module.css";

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(
    d.getHours(),
  )}:${p(d.getMinutes())}`;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [openTracking, setOpenTracking] = useState<string | null>(null);

  // localStorage는 클라이언트에서만 접근 → mount 이후 로드
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrders(getOrders());
  }, []);

  if (orders === null) {
    return <p className={styles.loading}>불러오는 중…</p>;
  }

  if (orders.length === 0) {
    return (
      <div className={styles.empty}>
        <Package size={40} strokeWidth={1.5} />
        <p>주문 내역이 없습니다.</p>
        <Link href="/products" className={styles.emptyLink}>
          상품 보러 가기
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.head}>
        <h2 className={styles.heading}>결제내역</h2>
        <p className={styles.subnote}>견적서 단위로 주문이 표시됩니다.</p>
      </div>

      <ul className={styles.orderList}>
        {orders.map((order) => {
          const status = deriveStatus(order.createdAt);
          const stepIndex = STATUS_FLOW.indexOf(status);
          const shipped = stepIndex >= STATUS_FLOW.indexOf("shipping");
          const open = openTracking === order.orderNo;

          return (
            <li key={order.orderNo} className={styles.card}>
              <div className={styles.cardHead}>
                <div>
                  <span className={styles.orderNo}>주문번호 {order.orderNo}</span>
                  <span className={styles.date}>
                    {formatDateTime(order.createdAt)}
                  </span>
                </div>
                <span className={`${styles.badge} ${styles[`s_${status}`]}`}>
                  {STATUS_LABEL[status]}
                </span>
              </div>

              <ul className={styles.items}>
                {order.items.map((item) => (
                  <li
                    key={`${item.productId}-${item.variantId}`}
                    className={styles.item}
                  >
                    <Link href={`/products/${item.productId}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image}
                        alt={item.productName}
                        className={styles.thumb}
                      />
                    </Link>
                    <div className={styles.itemInfo}>
                      <Link
                        href={`/products/${item.productId}`}
                        className={styles.itemName}
                      >
                        {item.productName}
                      </Link>
                      <span className={styles.itemVariant}>
                        {item.variantName} / 수량 {item.quantity}개
                      </span>
                    </div>
                    <span className={styles.itemPrice}>
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className={styles.cardFoot}>
                <span className={styles.total}>
                  결제금액 <strong>{formatPrice(order.total)}</strong>
                </span>
                <button
                  type="button"
                  className={styles.trackButton}
                  onClick={() => setOpenTracking(open ? null : order.orderNo)}
                  aria-expanded={open}
                >
                  <Truck size={16} strokeWidth={1.75} />
                  배송조회
                </button>
              </div>

              {open && (
                <div className={styles.tracking}>
                  <div className={styles.trackingMeta}>
                    <span>택배사 {COURIER}</span>
                    <span>
                      운송장번호{" "}
                      {shipped ? trackingNumber(order.orderNo) : "배송 준비 중"}
                    </span>
                  </div>
                  <ol className={styles.timeline}>
                    {STATUS_FLOW.map((s, i) => (
                      <li
                        key={s}
                        className={`${styles.step} ${
                          i <= stepIndex ? styles.done : ""
                        } ${i === stepIndex ? styles.current : ""}`}
                      >
                        <span className={styles.dot} aria-hidden />
                        <span className={styles.stepLabel}>
                          {STATUS_LABEL[s as OrderStatus]}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <p className={styles.mockNote}>
        ※ 각 주문 금액은 주문 당시 가격 기준으로 저장되며, 이후 상품 가격이
        변경되어도 바뀌지 않습니다.
        <br />※ 배송상태는 데모용으로 주문 후 경과 시간에 따라 자동으로
        진행됩니다.
      </p>
    </div>
  );
}
