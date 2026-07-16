"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CartItem } from "@/lib/types";
import ordersSeed from "@/data/seed/orders.json";
import addressesSeed from "@/data/seed/addresses.json";
import profileSeed from "@/data/seed/profile.json";
import products from "@/data/mock-products.json";
import styles from "./page.module.css";

// 시드 JSON의 주문 한 건 형태 (createdAt 대신 ageMinutes로 저장)
// 이미지는 상품 데이터에서 productId로 끌어온다 — 시드에 경로를 복제해두면
// 상품 이미지 파일이 바뀔 때 시드만 옛 경로에 남아 깨진다(실제로 그랬다).
interface SeedOrder {
  orderNo: string;
  ageMinutes: number;
  orderer: { name: string; tel: string; address: string; memo?: string };
  depositor: string;
  taxInvoice: { requested: boolean; bizNo?: string; company?: string };
  items: Omit<CartItem, "image">[];
}

const PRODUCT_IMAGES = new Map(
  (products as { id: string; image: string }[]).map((p) => [p.id, p.image]),
);

const KEYS = {
  cart: "market02-cart",
  orders: "market02-orders",
  addresses: "market02-addresses",
  profile: "market02-profile",
};

// ageMinutes → 실제 주문 시각으로 변환하고 total/supply/vat 계산
function buildOrders() {
  return (ordersSeed as SeedOrder[]).map((o) => {
    const total = o.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const supply = Math.round(total / 1.1);
    const items: CartItem[] = o.items.map((i) => ({
      ...i,
      image: PRODUCT_IMAGES.get(i.productId) ?? "",
    }));
    return {
      orderNo: o.orderNo,
      createdAt: new Date(Date.now() - o.ageMinutes * 60000).toISOString(),
      items,
      total,
      supply,
      vat: total - supply,
      orderer: o.orderer,
      depositor: o.depositor,
      taxInvoice: o.taxInvoice,
    };
  });
}

export default function DevSeedPage() {
  const [message, setMessage] = useState("");
  const [counts, setCounts] = useState<Record<string, number>>({});

  const refresh = () => {
    const read = (k: string) => {
      try {
        const raw = localStorage.getItem(k);
        if (!raw) return 0;
        const v = JSON.parse(raw);
        return Array.isArray(v) ? v.length : 1;
      } catch {
        return 0;
      }
    };
    setCounts({
      orders: read(KEYS.orders),
      addresses: read(KEYS.addresses),
      profile: read(KEYS.profile),
      cart: read(KEYS.cart),
    });
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, []);

  const seed = () => {
    localStorage.setItem(KEYS.orders, JSON.stringify(buildOrders()));
    localStorage.setItem(KEYS.addresses, JSON.stringify(addressesSeed));
    localStorage.setItem(KEYS.profile, JSON.stringify(profileSeed));
    refresh();
    setMessage("✅ 목업 데이터를 주입했습니다. 마이페이지에서 확인하세요.");
  };

  const reset = () => {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
    refresh();
    setMessage("🧹 모든 목업 데이터를 초기화했습니다.");
  };

  return (
    <div className={styles.page}>
      <p className={styles.badge}>개발용 · DEV ONLY</p>
      <h1 className={styles.title}>목업 데이터 시드</h1>
      <p className={styles.desc}>
        <code>data/seed/*.json</code> 의 샘플 데이터를 브라우저 localStorage에
        주입해 로그인 사용자·주문내역·배송지·회원정보를 테스트합니다.
      </p>

      <dl className={styles.counts}>
        <div>
          <dt>주문내역</dt>
          <dd>{counts.orders ?? 0}건</dd>
        </div>
        <div>
          <dt>배송지</dt>
          <dd>{counts.addresses ?? 0}건</dd>
        </div>
        <div>
          <dt>회원정보</dt>
          <dd>{counts.profile ? "있음" : "없음"}</dd>
        </div>
        <div>
          <dt>견적 스택</dt>
          <dd>{counts.cart ?? 0}건</dd>
        </div>
      </dl>

      <div className={styles.actions}>
        <button type="button" className={styles.seedButton} onClick={seed}>
          목업 데이터 심기
        </button>
        <button type="button" className={styles.resetButton} onClick={reset}>
          전체 초기화
        </button>
      </div>

      {message && <p className={styles.message}>{message}</p>}

      <div className={styles.links}>
        <Link href="/mypage/orders">결제내역 보기 →</Link>
        <Link href="/mypage/addresses">배송지 관리 →</Link>
        <Link href="/mypage/profile">회원정보 →</Link>
      </div>

      <p className={styles.note}>
        ※ 주문의 배송상태는 시간 기반이라, 방금 심은 “배송중” 주문도 몇 분 뒤
        자동으로 “배송완료”로 넘어갑니다. 다시 보려면 초기화 후 재주입하세요.
      </p>
    </div>
  );
}
