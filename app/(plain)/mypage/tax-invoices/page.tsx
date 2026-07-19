"use client";

import { useEffect, useState } from "react";
import { Receipt } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { type Order } from "@/lib/orders";
import styles from "./page.module.css";

function formatDate(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

export default function TaxInvoicesPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);

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

  if (orders === null) {
    return <p className={styles.loading}>불러오는 중…</p>;
  }

  const invoices = orders.filter((o) => o.taxInvoice.requested);

  if (invoices.length === 0) {
    return (
      <div className={styles.empty}>
        <Receipt size={40} strokeWidth={1.5} />
        <p>세금계산서 발급 내역이 없습니다.</p>
        <span className={styles.emptyHint}>
          주문/결제 시 전자세금계산서 발행을 신청하면 여기에 표시됩니다.
        </span>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.head}>
        <h2 className={styles.heading}>세금계산서 내역</h2>
        <p className={styles.subnote}>
          입금 확인(입금확인 단계) 후 전자세금계산서가 발행됩니다.
        </p>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>발행일</th>
              <th>주문번호</th>
              <th>사업자등록번호</th>
              <th>상호</th>
              <th className={styles.right}>공급가액</th>
              <th className={styles.right}>세액</th>
              <th className={styles.right}>합계</th>
              <th className={styles.center}>상태</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((o) => {
              const issued = o.taxInvoice.issued;
              return (
                <tr key={o.orderNo}>
                  <td>{formatDate(o.createdAt)}</td>
                  <td>{o.orderNo}</td>
                  <td>{o.taxInvoice.bizNo ?? "—"}</td>
                  <td>{o.taxInvoice.company || "—"}</td>
                  <td className={styles.right}>{formatPrice(o.supply)}</td>
                  <td className={styles.right}>{formatPrice(o.vat)}</td>
                  <td className={styles.right}>{formatPrice(o.total)}</td>
                  <td className={styles.center}>
                    <span
                      className={`${styles.status} ${
                        issued ? styles.issued : styles.waiting
                      }`}
                    >
                      {issued ? "발행완료" : "발행대기"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
