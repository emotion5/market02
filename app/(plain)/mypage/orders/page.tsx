"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Truck, Package, FileText } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import ProductThumb from "@/components/product/ProductThumb";
import {
  DEFAULT_COURIER,
  STATUS_FLOW,
  STATUS_LABEL,
  orderStatusLabel,
  type Order,
  type OrderStatus,
} from "@/lib/orders";
import type { TrackingResult } from "@/lib/tracking";
import styles from "./page.module.css";

// 배송조회 API 응답 (실시간 결과 없으면 tracking:null + reason)
type TrackState = { tracking: TrackingResult | null; reason?: string };

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
  const [canceling, setCanceling] = useState<string | null>(null);
  // 주문별 배송조회 결과 캐시(undefined=미조회) + 조회 중 표시
  const [track, setTrack] = useState<Record<string, TrackState>>({});
  const [trackLoading, setTrackLoading] = useState<string | null>(null);

  // 배송조회 펼치기/접기. 펼칠 때 아직 조회 전이면 실시간 배송정보를 한 번 불러온다.
  const toggleTracking = async (orderNo: string) => {
    const opening = openTracking !== orderNo;
    setOpenTracking(opening ? orderNo : null);
    // 송장이 등록된 주문만 실시간 배송조회를 호출한다(없으면 조회 대상 자체가 없음).
    const hasTracking = !!orders?.find((o) => o.orderNo === orderNo)
      ?.trackingNumber;
    if (!opening || !hasTracking || track[orderNo] !== undefined) return;
    setTrackLoading(orderNo);
    try {
      const res = await fetch(
        `/api/orders/${encodeURIComponent(orderNo)}/tracking`,
      );
      const data = res.ok
        ? await res.json()
        : { tracking: null, reason: "배송정보를 불러오지 못했습니다." };
      setTrack((m) => ({
        ...m,
        [orderNo]: { tracking: data.tracking ?? null, reason: data.reason },
      }));
      // 서버가 배송완료로 자동 승격했으면 목록 뱃지·진행단계도 즉시 맞춘다.
      if (data.delivered) {
        setOrders((list) =>
          list?.map((o) =>
            o.orderNo === orderNo ? { ...o, status: "delivered" } : o,
          ) ?? list,
        );
      }
    } catch {
      setTrack((m) => ({
        ...m,
        [orderNo]: { tracking: null, reason: "네트워크 오류로 조회하지 못했습니다." },
      }));
    } finally {
      setTrackLoading(null);
    }
  };

  useEffect(() => {
    let alive = true;
    fetch("/api/orders")
      .then((res) => (res.ok ? res.json() : { orders: [] }))
      .then((data) => {
        if (alive) setOrders(data.orders ?? []);
      })
      .catch(() => {
        if (alive) setOrders([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  // 입금 전(입금대기) 주문만 셀프 취소. 입금 후에는 CS 요청 안내(서버에서도 차단).
  const cancelOrder = async (orderNo: string) => {
    if (
      !confirm(
        "입금 전 주문을 취소합니다.\n취소하면 되돌릴 수 없습니다. 계속할까요?",
      )
    ) {
      return;
    }
    setCanceling(orderNo);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderNo)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (res.ok) {
        const data = await fetch("/api/orders")
          .then((r) => (r.ok ? r.json() : { orders: [] }))
          .catch(() => ({ orders: [] }));
        setOrders(data.orders ?? []);
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.error ?? "취소에 실패했습니다.");
      }
    } catch {
      alert("네트워크 오류로 취소하지 못했습니다.");
    } finally {
      setCanceling(null);
    }
  };

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
          const status = order.status;
          const stepIndex = STATUS_FLOW.indexOf(status);
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
                  {orderStatusLabel(order)}
                </span>
              </div>

              <ul className={styles.items}>
                {order.items.map((item) => (
                  <li
                    key={`${item.productId}-${item.variantId}`}
                    className={styles.item}
                  >
                    <Link href={`/products/${item.productId}`}>
                      <ProductThumb
                        src={item.image}
                        alt={item.productName}
                        className={styles.thumb}
                        size="thumb"
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
                <div className={styles.footActions}>
                  {status === "pending" && (
                    <button
                      type="button"
                      className={styles.cancelButton}
                      onClick={() => cancelOrder(order.orderNo)}
                      disabled={canceling === order.orderNo}
                    >
                      {canceling === order.orderNo ? "취소 중…" : "주문 취소"}
                    </button>
                  )}
                  {status !== "cancelled" && (
                    <button
                      type="button"
                      className={styles.trackButton}
                      onClick={() => toggleTracking(order.orderNo)}
                      aria-expanded={open}
                    >
                      <Truck size={16} strokeWidth={1.75} />
                      {order.trackingNumber ? "배송조회" : "주문 진행상태"}
                    </button>
                  )}
                  {/* 거래명세표 — 결제완료(입금확인) 이후 주문만 */}
                  {status !== "pending" && status !== "cancelled" && (
                    <Link
                      href={`/orders/${encodeURIComponent(order.orderNo)}/statement`}
                      target="_blank"
                      className={styles.trackButton}
                    >
                      <FileText size={16} strokeWidth={1.75} />
                      거래명세표
                    </Link>
                  )}
                </div>
              </div>

              {status === "cancelled" && (
                <div className={styles.cancelInfo}>
                  {orderStatusLabel(order)}
                  {order.cancelReason ? ` · ${order.cancelReason}` : ""}
                  {order.canceledAt
                    ? ` · ${formatDateTime(order.canceledAt)}`
                    : ""}
                </div>
              )}

              {open && status !== "cancelled" && (
                <div className={styles.tracking}>
                  {/* 택배사·운송장은 관리자가 송장을 등록한 뒤에만 노출.
                      등록 전에는 아래 진행 단계만 보여준다. */}
                  {order.trackingNumber ? (
                    <div className={styles.trackingMeta}>
                      <span>택배사 {order.courier ?? DEFAULT_COURIER}</span>
                      <span>운송장번호 {order.trackingNumber}</span>
                    </div>
                  ) : (
                    <p className={styles.trackMsg}>아직 송장이 등록되지 않았습니다.</p>
                  )}

                  {/* 진행 단계 다이어그램 — 항상 표시(주문의 전체 진행 상태) */}
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

                  {/* 택배사 실시간 배송 이력 — 조회되면 단계 그림 아래에 덧붙임 */}
                  {(trackLoading === order.orderNo || track[order.orderNo]) && (
                    <div className={styles.trackDetail}>
                      {trackLoading === order.orderNo ? (
                        <p className={styles.trackMsg}>배송 정보를 불러오는 중…</p>
                      ) : track[order.orderNo]?.tracking ? (
                        <ol className={styles.trackEvents}>
                          {track[order.orderNo].tracking!.events.map((ev, i) => (
                            <li key={i} className={styles.trackEvent}>
                              <span className={styles.evTime}>
                                {ev.time ? formatDateTime(ev.time) : "—"}
                              </span>
                              <span className={styles.evStatus}>{ev.status}</span>
                              <span className={styles.evLoc}>{ev.location}</span>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className={styles.trackMsg}>
                          {track[order.orderNo]?.reason}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <p className={styles.mockNote}>
        ※ 각 주문 금액은 주문 당시 가격 기준으로 저장되며, 이후 상품 가격이
        변경되어도 바뀌지 않습니다.
      </p>
    </div>
  );
}
