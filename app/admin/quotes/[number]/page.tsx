import { notFound } from "next/navigation";
import Link from "next/link";
import { getQuoteForAdmin } from "@/lib/admin";
import ProductThumb from "@/components/product/ProductThumb";
import styles from "../../admin.module.css";

export const dynamic = "force-dynamic";

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;
function fmt(iso: string) {
  return new Date(iso).toLocaleString("ko-KR");
}

export default async function AdminQuoteDetailPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  const qt = await getQuoteForAdmin(decodeURIComponent(number));
  if (!qt) notFound();

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>견적서 상세</h1>
      <p className={styles.pageDesc}>
        <Link href="/admin/quotes" className={styles.backToShop}>
          ← 견적서 목록
        </Link>{" "}
        · {qt.number}
      </p>

      <div className={styles.card} style={{ padding: 24, marginBottom: 20 }}>
        <div className={styles.detailHead}>
          <div>
            <div className={styles.detailEmail}>{qt.number}</div>
            <div className={styles.pId}>
              {fmt(qt.issuedAt)} 발행 · {qt.userEmail}
            </div>
          </div>
          <span className={qt.expired ? styles.badgeOff : styles.badgeOn}>
            {qt.expired ? "유효기간 만료" : "유효"}
          </span>
        </div>

        <table className={styles.table} style={{ marginTop: 8 }}>
          <tbody>
            <tr>
              <th style={{ width: 160 }}>공급받는 자(상호)</th>
              <td>{qt.customer.company || "—"}</td>
            </tr>
            <tr>
              <th>담당자</th>
              <td>{qt.customer.contactName || "—"}</td>
            </tr>
            <tr>
              <th>연락처</th>
              <td>{qt.customer.contactTel || "—"}</td>
            </tr>
            <tr>
              <th>유효기간</th>
              <td className={styles.mono}>{fmt(qt.validUntil)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className={styles.card} style={{ padding: 24 }}>
        <h2 className={styles.sectionTitle}>견적 품목 {qt.items.length}건</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th></th>
              <th>상품 / 옵션</th>
              <th>단가</th>
              <th>수량</th>
              <th>금액</th>
            </tr>
          </thead>
          <tbody>
            {qt.items.map((it, i) => (
              <tr key={i}>
                <td>
                  <ProductThumb
                    className={styles.thumb}
                    src={it.image}
                    alt=""
                    size="thumb"
                  />
                </td>
                <td>
                  <div className={styles.pName}>{it.productName}</div>
                  <div className={styles.pId}>{it.variantName}</div>
                </td>
                <td className={styles.mono}>{won(it.unitPrice)}</td>
                <td className={styles.mono}>{it.quantity}</td>
                <td className={styles.mono}>{won(it.unitPrice * it.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <table className={styles.table} style={{ marginTop: 8 }}>
          <tbody>
            <tr>
              <th style={{ width: 160 }}>공급가액</th>
              <td className={styles.mono}>{won(qt.supply)}</td>
            </tr>
            <tr>
              <th>부가세</th>
              <td className={styles.mono}>{won(qt.vat)}</td>
            </tr>
            <tr>
              <th>합계</th>
              <td className={styles.mono}>
                <strong>{won(qt.total)}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
