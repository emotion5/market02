"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Printer, FileCheck } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";
import QuoteSheet from "@/components/quote/QuoteSheet";
import { makeQuoteNumber, type QuoteCustomer } from "@/lib/quotes";
import styles from "./page.module.css";

// 작성 중인 견적서 = 담아둔 상품(장바구니). 화면에 보이는 견적번호·발행일은
// 아직 확정되지 않은 미리보기이며, "견적서 발행"을 눌러야 그 시점 값으로 굳어
// 저장된다 (그 뒤로는 /quotes/[number]에서 그대로 다시 열린다).
export default function QuotePage() {
  const router = useRouter();
  const { items, totalPrice, updateQuantity, removeItem } = useCart();

  const [customer, setCustomer] = useState<QuoteCustomer>({
    company: "",
    contactName: "",
    contactTel: "",
  });
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);

  // 발행일·견적번호 미리보기는 하이드레이션 불일치를 피하려 mount 이후 생성
  const [preview, setPreview] = useState<{ date: Date; number: string } | null>(
    null,
  );

  useEffect(() => {
    const now = new Date();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreview({ date: now, number: makeQuoteNumber(now) });
  }, []);

  const publish = async () => {
    if (!customer.company.trim()) {
      setError("공급받는 자의 상호를 입력해주세요.");
      return;
    }
    setError("");
    setPublishing(true);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customer,
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
            color: i.color,
          })),
        }),
      });
      if (res.status === 401) {
        // 발행은 로그인 사용자에 귀속된다 → 로그인 후 다시 시도(장바구니는 유지됨)
        setError("견적서 발행은 로그인이 필요합니다.");
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "견적서 발행에 실패했습니다.");
        return;
      }
      router.push(`/quotes/${data.number}`);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setPublishing(false);
    }
  };

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
        <Link href="/products" className={styles.editLink}>
          ← 상품 더 담기
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

      <QuoteSheet
        number={preview?.number ?? null}
        issuedAt={preview?.date ?? null}
        items={items}
        customer={customer}
        editable
        onCustomerChange={(c) => {
          setCustomer(c);
          if (error) setError("");
        }}
        onQuantityChange={updateQuantity}
        onRemove={removeItem}
      />

      {/* 화면 전용 하단 바 (인쇄 시 숨김) */}
      <div className={styles.footerBar}>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.footerTotal}>
          <span>결제 예정 금액</span>
          <strong>{formatPrice(totalPrice)}</strong>
        </div>
        <button
          type="button"
          className={styles.publishButton}
          onClick={publish}
          disabled={publishing}
        >
          <FileCheck size={16} strokeWidth={1.75} />
          {publishing ? "발행 중…" : "견적서 발행"}
        </button>
        <Link href="/checkout" className={styles.orderButton}>
          주문 / 결제하기
        </Link>
      </div>

      <p className={styles.publishNote}>
        ※ &lsquo;견적서 발행&rsquo;을 누르면 지금 내용 그대로 견적번호가 확정되어
        저장됩니다. 발행한 견적서는 마이페이지 &gt; 견적서 내역에서 다시 볼 수
        있습니다.
      </p>
    </div>
  );
}
