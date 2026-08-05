"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";
import { useCart } from "@/hooks/useCart";
import { useCartReconcile } from "@/hooks/useCartReconcile";
import { useQuoteMatch } from "@/hooks/useQuoteMatch";
import { formatPrice, formatPhone } from "@/lib/utils";
import CartReconcileNotice from "@/components/cart/CartReconcileNotice";
import QuoteMatchNotice from "@/components/cart/QuoteMatchNotice";
import AddressSearch from "@/components/AddressSearch";
import ProductThumb from "@/components/product/ProductThumb";
import { useSiteSettings } from "@/components/SiteSettingsProvider";
import { type Order } from "@/lib/orders";
import styles from "./page.module.css";

// 사업자등록번호 10자리를 000-00-00000 형태로 표시
function formatBizNo(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  const parts = [digits.slice(0, 3), digits.slice(3, 5), digits.slice(5, 10)];
  return parts.filter(Boolean).join("-");
}

// 저장된 배송지(마이페이지) — 불러오기용
interface SavedAddress {
  id: string;
  label: string;
  recipient: string;
  tel: string;
  address: string;
  isDefault: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice } = useCart();
  const settings = useSiteSettings();
  // 진입 시 담긴 상품을 현재 DB와 대조 — 사라진 항목 제외·가격 갱신 후 안내
  const reconcileNotice = useCartReconcile();
  // 견적서에서 넘어온 주문(?from=견적번호)이면 견적 내용과 대조해 안내(안전판)
  const quoteMatch = useQuoteMatch();

  // 주문자 / 배송 정보
  const [ordererName, setOrdererName] = useState("");
  const [ordererTel, setOrdererTel] = useState("");
  // 가상계좌 발급 안내(토스 알림톡/문자·이메일) 수신처. 회원 이메일로 프리필하며 화면엔 노출하지 않는다.
  const [ordererEmail, setOrdererEmail] = useState("");
  const [address, setAddress] = useState(""); // 우편번호 검색으로 합쳐진 최종 배송지
  // AddressSearch 초기값. 저장된 배송지를 고르면 value 교체 + key 증가로 remount(강제 반영).
  const [addrSeed, setAddrSeed] = useState<{ value: string; key: number }>({
    value: "",
    key: 0,
  });
  const [memo, setMemo] = useState("");

  // 마이페이지에 저장된 배송지 목록(불러오기용) + 현재 선택 표시
  const [savedAddrs, setSavedAddrs] = useState<SavedAddress[]>([]);
  const [selectedAddrId, setSelectedAddrId] = useState<string | null>(null);
  const [saveAddr, setSaveAddr] = useState(false); // 직접 입력한 배송지를 목록에 저장

  // 무통장입금 정보
  const [depositor, setDepositor] = useState("");

  // 증빙(택1): 세금계산서(사업자) / 현금영수증(개인) / 안 받음
  const [evidence, setEvidence] = useState<
    "tax_invoice" | "cash_receipt" | "none"
  >("tax_invoice");
  const [bizNo, setBizNo] = useState(""); // 세금계산서용 사업자번호
  const [company, setCompany] = useState(""); // 세금계산서용 상호
  const [cashPhone, setCashPhone] = useState(""); // 현금영수증용(소득공제) 휴대폰

  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);

  // 로그인 회원 정보로 입력값을 프리필한다(모두 편집 가능 — 기본값일 뿐).
  // 빈 칸만 채워 사용자가 이미 입력한 값은 덮어쓰지 않는다.
  useEffect(() => {
    let alive = true;
    fetch("/api/me/profile", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const p = data?.profile;
        if (!alive || !p) return;
        const fill = (set: (v: (v: string) => string) => void, val?: string | null) => {
          if (val) set((v) => v || val);
        };
        // 이메일은 회원 유형과 무관하게 계정 이메일을 쓴다(가상계좌 안내 이메일 수신처).
        fill(setOrdererEmail, p.email);
        if (p.type === "BUSINESS") {
          fill(setOrdererName, p.managerName || p.company);
          fill(setOrdererTel, p.managerTel ? formatPhone(p.managerTel) : undefined);
          // 배송지는 우편번호 검색 위젯의 기본값으로만 넘긴다(사업장 주소 = 배송지가 아닐 수 있음).
          // 단, 저장된 기본 배송지가 있으면 그쪽이 우선하므로 비어 있을 때만 채운다.
          if (p.address) {
            setAddrSeed((s) => (s.value ? s : { value: p.address, key: s.key }));
          }
          fill(setDepositor, p.company);
          if (p.bizNo) setBizNo((v) => v || formatBizNo(p.bizNo));
          fill(setCompany, p.company);
        } else {
          // 개인회원: 이름·연락처만(있을 때)
          fill(setOrdererName, p.name);
          fill(setOrdererTel, p.tel);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // 저장된 배송지를 폼에 적용(받는분·연락처·배송지 교체). 저장지 우선키를 올려 위젯 remount.
  const applyAddress = (a: SavedAddress) => {
    setOrdererName(a.recipient || "");
    setOrdererTel(formatPhone(a.tel || ""));
    setAddrSeed((s) => ({ value: a.address, key: s.key + 1 }));
    setSelectedAddrId(a.id);
  };

  // 저장된 배송지 목록을 불러오고, 기본 배송지가 있으면 자동 적용(사업장 주소보다 우선).
  useEffect(() => {
    let alive = true;
    fetch("/api/me/addresses", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!alive || !data?.addresses?.length) return;
        setSavedAddrs(data.addresses);
        const def = data.addresses.find((a: SavedAddress) => a.isDefault);
        if (def) applyAddress(def);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const supply = Math.round(totalPrice / 1.1);
  const vat = totalPrice - supply;

  // 주문은 로그인 사용자에 귀속되며, 가격·주문번호는 서버가 확정한다.
  // 흐름: ① 주문 생성 → ② 토스 가상계좌 결제창(리다이렉트) → successUrl(/checkout/complete)
  //       에서 서버 승인·계좌 표시. 입금 확인은 웹훅으로 자동 처리된다.
  const placeOrder = async () => {
    setError("");
    setPlacing(true);
    try {
      // ① 주문 생성 (가격·주문번호는 서버가 확정)
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orderer: {
            name: ordererName,
            tel: ordererTel,
            address,
            memo: memo || undefined,
          },
          depositor,
          evidence:
            evidence === "tax_invoice"
              ? { type: "tax_invoice", bizNo, company: company || undefined }
              : evidence === "cash_receipt"
                ? { type: "cash_receipt", phone: cashPhone }
                : { type: "none" },
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
            color: i.color,
          })),
        }),
      });
      if (res.status === 401) {
        setError("주문은 로그인이 필요합니다.");
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "주문에 실패했습니다.");
        return;
      }
      const order = data.order as Order;

      // 직접 입력한 배송지를 목록에 저장(선택). 결제 흐름을 막지 않도록 fire-and-forget.
      if (saveAddr && !savedAddrs.some((a) => a.address === address.trim())) {
        fetch("/api/me/addresses", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            label: "새 배송지",
            recipient: ordererName.trim(),
            tel: ordererTel.trim(),
            address: address.trim(),
          }),
        }).catch(() => {});
      }

      // ② 토스 가상계좌 결제창 (orderId = 주문번호). 성공 시 successUrl 로 리다이렉트된다.
      const orderName =
        items.length === 1
          ? items[0].productName
          : `${items[0].productName} 외 ${items.length - 1}건`;
      const tossPayments = await loadTossPayments(
        process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!,
      );
      const payment = tossPayments.payment({ customerKey: ANONYMOUS });
      await payment.requestPayment({
        method: "VIRTUAL_ACCOUNT",
        amount: { currency: "KRW", value: order.total },
        orderId: order.orderNo,
        orderName,
        successUrl: `${window.location.origin}/checkout/complete`,
        failUrl: `${window.location.origin}/checkout?failed=1`,
        customerName: ordererName,
        // 가상계좌 발급 안내(알림톡→문자 대체, 이메일)를 토스가 자동 발송하는 수신처.
        // customerMobilePhone 은 하이픈 제거한 숫자만 전달. 이메일은 있을 때만.
        customerMobilePhone: ordererTel.replace(/\D/g, ""),
        ...(ordererEmail ? { customerEmail: ordererEmail } : {}),
        virtualAccount: { validHours: 24 }, // 입금기한 24시간
      });
      // 성공 시 위에서 successUrl 로 이동하므로 이 아래는 실행되지 않는다.
    } catch (e) {
      // 사용자가 결제창을 닫는 등 → 주문은 입금대기로 남고, 주문내역에서 재시도 가능.
      const message =
        e instanceof Error && e.message
          ? e.message
          : "결제가 중단되었습니다. 주문내역에서 다시 시도할 수 있습니다.";
      setError(message);
    } finally {
      setPlacing(false);
    }
  };

  // 현재 배송지가 이미 저장돼 있으면(카드 그대로 선택) 저장 체크박스는 숨긴다.
  const addressIsSaved =
    !!address.trim() && savedAddrs.some((a) => a.address === address.trim());

  const canOrder =
    items.length > 0 &&
    ordererName.trim() &&
    ordererTel.trim() &&
    address.trim() &&
    depositor.trim() &&
    (evidence !== "tax_invoice" || bizNo.replace(/\D/g, "").length === 10) &&
    (evidence !== "cash_receipt" || cashPhone.replace(/\D/g, "").length >= 10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canOrder || placing) return;
    placeOrder();
  };

  // ── 빈 견적서 ────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        {/* 담긴 항목이 모두 제외된 경우에도 이유를 볼 수 있게 안내를 남긴다 */}
        <CartReconcileNotice notice={reconcileNotice} />
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

      <CartReconcileNotice notice={reconcileNotice} />
      <QuoteMatchNotice match={quoteMatch} />

      <div className={styles.layout}>
        <div className={styles.main}>
          {/* 주문자 / 배송 정보 */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>주문자 · 배송 정보</h2>
            {savedAddrs.length > 0 && (
              <div className={styles.field} style={{ alignItems: "flex-start" }}>
                <label className={styles.label}>저장된 배송지</label>
                <div className={styles.addrChoices}>
                  {savedAddrs.map((a) => (
                    <button
                      type="button"
                      key={a.id}
                      className={`${styles.addrChoice} ${
                        selectedAddrId === a.id ? styles.addrChoiceOn : ""
                      }`}
                      onClick={() => applyAddress(a)}
                      aria-pressed={selectedAddrId === a.id}
                    >
                      <span className={styles.addrChoiceHead}>
                        {a.label}
                        {a.isDefault && (
                          <span className={styles.addrChoiceDefault}>기본</span>
                        )}
                        <span className={styles.addrChoiceWho}>
                          {a.recipient}
                          {a.tel ? ` · ${a.tel}` : ""}
                        </span>
                      </span>
                      <span className={styles.addrChoiceText}>{a.address}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
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
                onChange={(e) => setOrdererTel(formatPhone(e.target.value))}
                placeholder="010-0000-0000"
                inputMode="numeric"
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>배송지</label>
              <AddressSearch
                key={addrSeed.key}
                initialAddress={addrSeed.value}
                inputClassName={styles.input}
                onChange={setAddress}
              />
              <p className={styles.fieldNote}>
                ※ 실제 배송받을 주소가 맞는지 꼭 확인해주세요. 사업장(등록) 주소와
                다를 수 있습니다.
              </p>
            </div>

            {/* 직접 입력한(저장되지 않은) 배송지면 목록에 저장할지 물어본다 */}
            {address.trim() && !addressIsSaved && (
              <div className={styles.field}>
                <span className={styles.label} aria-hidden />
                <label className={styles.saveAddrCheck}>
                  <input
                    type="checkbox"
                    checked={saveAddr}
                    onChange={(e) => setSaveAddr(e.target.checked)}
                  />
                  이 배송지를 내 배송지 목록에 저장
                </label>
              </div>
            )}
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
                  <ProductThumb
                    src={item.image}
                    alt={item.productName}
                    className={styles.thumb}
                    size="thumb"
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
              무통장입금 (가상계좌)
            </div>

            <dl className={styles.accountBox}>
              <div>
                <dt>입금 방법</dt>
                <dd>주문 시 전용 가상계좌가 발급됩니다</dd>
              </div>
              <div>
                <dt>입금 확인</dt>
                <dd>입금하시면 자동으로 확인됩니다</dd>
              </div>
              <div>
                <dt>공급자 사업자등록번호</dt>
                <dd>{settings.supplierBizNo}</dd>
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

          {/* 증빙 (택1) — 세금계산서 / 현금영수증 / 안 받음. 둘이 중복 발급되지 않는다. */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>증빙</h2>
            <p className={styles.taxNote} style={{ marginTop: 0 }}>
              증빙은 하나만 선택할 수 있습니다. 세금계산서와 현금영수증은 함께
              발급되지 않습니다.
            </p>
            <div className={styles.evidenceChoices}>
              {(
                [
                  { key: "tax_invoice", label: "세금계산서 (사업자)" },
                  { key: "cash_receipt", label: "현금영수증 (개인·소득공제)" },
                  { key: "none", label: "받지 않음" },
                ] as const
              ).map((opt) => (
                <label key={opt.key} className={styles.evidenceChoice}>
                  <input
                    type="radio"
                    name="evidence"
                    checked={evidence === opt.key}
                    onChange={() => setEvidence(opt.key)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>

            {evidence === "tax_invoice" && (
              <>
                <div className={styles.field}>
                  <label className={styles.label}>사업자등록번호</label>
                  <input
                    className={styles.input}
                    value={bizNo}
                    onChange={(e) => setBizNo(formatBizNo(e.target.value))}
                    placeholder="000-00-00000"
                    inputMode="numeric"
                    required
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

            {evidence === "cash_receipt" && (
              <>
                <div className={styles.field}>
                  <label className={styles.label}>휴대폰번호</label>
                  <input
                    className={styles.input}
                    value={cashPhone}
                    onChange={(e) => setCashPhone(formatPhone(e.target.value))}
                    placeholder="010-0000-0000"
                    inputMode="numeric"
                    required
                  />
                </div>
                <p className={styles.taxNote}>
                  소득공제용 현금영수증이 입금 확인 후 발급됩니다.
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
            disabled={!canOrder || placing}
          >
            {placing ? "주문 처리 중…" : `${formatPrice(totalPrice)} 주문하기`}
          </button>
          {error && <p className={styles.error}>{error}</p>}
          <p className={styles.agree}>
            주문 내용을 확인하였으며 무통장입금 결제에 동의합니다.
          </p>
        </aside>
      </div>
    </form>
  );
}
