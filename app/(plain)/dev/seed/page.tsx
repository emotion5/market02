"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import addressesSeed from "@/data/seed/addresses.json";
import profileSeed from "@/data/seed/profile.json";
import styles from "./page.module.css";

// 견적서·주문은 DB로 이관되어(로그인 사용자 귀속) 여기서 시드하지 않는다.
// 실제 발행/주문은 로그인 후 /quote · /checkout 에서 진행한다.
// 이 도구는 아직 localStorage를 쓰는 배송지·회원정보만 주입한다.

const KEYS = {
  cart: "market02-cart",
  orders: "market02-orders", // 레거시 정리용(초기화 시 제거). 주문은 이제 DB.
  addresses: "market02-addresses",
  profile: "market02-profile",
  quotes: "market02-quotes", // 레거시 정리용. 견적도 DB.
  auth: "market02-auth",
};

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
        <code>data/seed/*.json</code> 의 샘플 배송지·회원정보를 브라우저
        localStorage에 주입해 마이페이지를 테스트합니다.
        <br />
        견적서·주문은 이제 DB에 저장되므로 로그인 후 <code>/quote</code> ·{" "}
        <code>/checkout</code> 에서 직접 만들어 확인하세요.
      </p>

      <dl className={styles.counts}>
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
        <Link href="/mypage/quotes">견적서 내역 →</Link>
        <Link href="/mypage/addresses">배송지 관리 →</Link>
        <Link href="/mypage/profile">회원정보 →</Link>
      </div>
    </div>
  );
}
