"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CartItem } from "@/lib/types";
import { makeQuoteNumber, quoteTotals, type SavedQuote } from "@/lib/quotes";
import ordersSeed from "@/data/seed/orders.json";
import addressesSeed from "@/data/seed/addresses.json";
import profileSeed from "@/data/seed/profile.json";
import quotesSeed from "@/data/seed/quotes.json";
import products from "@/data/mock-products.json";
import styles from "./page.module.css";

// 시드 품목은 productId만 신뢰하고 상품명·이미지는 상품 데이터에서 끌어온다 —
// 시드에 이름/경로를 복제해두면 상품이 바뀔 때 시드만 옛 값으로 남아 깨진다
// (이미지도 상품명도 실제로 그렇게 어긋났다).
type SeedItem = Omit<CartItem, "image" | "productName">;

// 시드 JSON의 주문 한 건 형태 (createdAt 대신 ageMinutes로 저장)
interface SeedOrder {
  orderNo: string;
  ageMinutes: number;
  orderer: { name: string; tel: string; address: string; memo?: string };
  depositor: string;
  taxInvoice: { requested: boolean; bizNo?: string; company?: string };
  items: SeedItem[];
}

// 시드 JSON의 견적서 한 건 형태 (번호·발행시각은 ageMinutes에서 파생)
interface SeedQuote {
  ageMinutes: number;
  customer: SavedQuote["customer"];
  items: SeedItem[];
}

const PRODUCTS = new Map(
  (products as { id: string; name: string; image: string }[]).map((p) => [
    p.id,
    p,
  ]),
);

// 시드 품목 → CartItem: 상품명·이미지를 상품 데이터에서 채운다.
function hydrateItems(items: SeedItem[]): CartItem[] {
  return items.map((i) => {
    const p = PRODUCTS.get(i.productId);
    return {
      ...i,
      productName: p?.name ?? i.productId,
      image: p?.image ?? "",
    };
  });
}

const KEYS = {
  cart: "market02-cart",
  orders: "market02-orders",
  addresses: "market02-addresses",
  profile: "market02-profile",
  quotes: "market02-quotes",
  auth: "market02-auth",
};

// ageMinutes → 실제 주문 시각으로 변환하고 total/supply/vat 계산
function buildOrders() {
  return (ordersSeed as SeedOrder[]).map((o) => {
    const items = hydrateItems(o.items);
    const { total, supply, vat } = quoteTotals(items);
    return {
      orderNo: o.orderNo,
      createdAt: new Date(Date.now() - o.ageMinutes * 60000).toISOString(),
      items,
      total,
      supply,
      vat,
      orderer: o.orderer,
      depositor: o.depositor,
      taxInvoice: o.taxInvoice,
    };
  });
}

// ageMinutes → 발행 시각, 그 시각으로 견적번호까지 파생. 최신순으로 보관.
function buildQuotes(): SavedQuote[] {
  return (quotesSeed as SeedQuote[])
    .map((q) => {
      const issuedAt = new Date(Date.now() - q.ageMinutes * 60000);
      const items = hydrateItems(q.items);
      return {
        number: makeQuoteNumber(issuedAt),
        issuedAt: issuedAt.toISOString(),
        items,
        customer: q.customer,
        ...quoteTotals(items),
      };
    })
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
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
      quotes: read(KEYS.quotes),
      cart: read(KEYS.cart),
    });
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, []);

  const seed = () => {
    localStorage.setItem(KEYS.orders, JSON.stringify(buildOrders()));
    localStorage.setItem(KEYS.quotes, JSON.stringify(buildQuotes()));
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
          <dt>견적서</dt>
          <dd>{counts.quotes ?? 0}건</dd>
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
        <Link href="/mypage/quotes">견적서 내역 →</Link>
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
