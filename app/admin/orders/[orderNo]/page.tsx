import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrderForAdmin } from "@/lib/admin";
import OrderStatusBadge from "@/components/admin/OrderStatusBadge";
import OrderActions from "@/components/admin/OrderActions";
import styles from "../../admin.module.css";

export const dynamic = "force-dynamic";

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;
function fmt(iso: string) {
  return new Date(iso).toLocaleString("ko-KR");
}
const TAX_LABEL: Record<string, string> = {
  none: "미신청",
  pending: "발행대기",
  issued: "발행완료",
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderNo: string }>;
}) {
  const { orderNo } = await params;
  const o = await getOrderForAdmin(decodeURIComponent(orderNo));
  if (!o) notFound();

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>주문 상세</h1>
      <p className={styles.pageDesc}>
        <Link href="/admin/orders" className={styles.backToShop}>
          ← 주문 목록
        </Link>{" "}
        · {o.orderNo}
      </p>

      <div className={styles.card} style={{ padding: 24, marginBottom: 20 }}>
        <div className={styles.detailHead}>
          <div>
            <div className={styles.detailEmail}>{o.orderNo}</div>
            <div className={styles.pId}>
              {fmt(o.createdAt)} · {o.userEmail}
            </div>
          </div>
          <OrderStatusBadge
            status={o.status}
            paidAt={o.paidAt}
            trackingNumber={o.trackingNumber}
          />
        </div>

        <div className={styles.detailActions}>
          <OrderActions
            orderNo={o.orderNo}
            status={o.status}
            tax={o.tax.state}
            cash={o.cash.state}
          />
        </div>
      </div>

      <div className={styles.card} style={{ padding: 24, marginBottom: 20 }}>
        <h2 className={styles.sectionTitle}>주문자 · 배송</h2>
        <table className={styles.table}>
          <tbody>
            <tr>
              <th style={{ width: 160 }}>받는 분</th>
              <td>{o.orderer.name}</td>
            </tr>
            <tr>
              <th>연락처</th>
              <td>{o.orderer.tel}</td>
            </tr>
            <tr>
              <th>배송지</th>
              <td>{o.orderer.address}</td>
            </tr>
            {o.orderer.memo && (
              <tr>
                <th>배송 메모</th>
                <td>{o.orderer.memo}</td>
              </tr>
            )}
            <tr>
              <th>입금자명</th>
              <td>{o.depositor}</td>
            </tr>
            <tr>
              <th>택배사 / 운송장</th>
              <td className={styles.mono}>
                {o.courier || o.trackingNumber
                  ? `${o.courier ?? "—"} / ${o.trackingNumber ?? "—"}`
                  : "—"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className={styles.card} style={{ padding: 24, marginBottom: 20 }}>
        <h2 className={styles.sectionTitle}>주문 상품 {o.items.length}건</h2>
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
            {o.items.map((it, i) => (
              <tr key={i}>
                <td>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className={styles.thumb} src={it.image} alt="" />
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
              <td className={styles.mono}>{won(o.supply)}</td>
            </tr>
            <tr>
              <th>부가세</th>
              <td className={styles.mono}>{won(o.vat)}</td>
            </tr>
            <tr>
              <th>배송비</th>
              <td className={styles.mono}>
                {o.shippingFee > 0 ? won(o.shippingFee) : "별도"}
              </td>
            </tr>
            <tr>
              <th>합계</th>
              <td className={styles.mono}>
                <strong>{won(o.total)}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className={styles.card} style={{ padding: 24 }}>
        <h2 className={styles.sectionTitle}>세금계산서</h2>
        <table className={styles.table}>
          <tbody>
            <tr>
              <th style={{ width: 160 }}>상태</th>
              <td>{TAX_LABEL[o.tax.state]}</td>
            </tr>
            {o.tax.state !== "none" && (
              <>
                <tr>
                  <th>사업자등록번호</th>
                  <td className={styles.mono}>{o.tax.bizNo ?? "—"}</td>
                </tr>
                <tr>
                  <th>상호</th>
                  <td>{o.tax.company ?? "—"}</td>
                </tr>
                {o.tax.issuedAt && (
                  <tr>
                    <th>발행일</th>
                    <td className={styles.mono}>{fmt(o.tax.issuedAt)}</td>
                  </tr>
                )}
                {o.tax.ntsApprovalNo && (
                  <tr>
                    <th>국세청승인번호</th>
                    <td className={styles.mono}>{o.tax.ntsApprovalNo}</td>
                  </tr>
                )}
                {o.tax.issuanceKey && (
                  <tr>
                    <th>발행키</th>
                    <td className={styles.mono}>{o.tax.issuanceKey}</td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
        {o.status === "cancelled" && o.tax.state === "issued" && (
          <p style={{ marginTop: 12, color: "#c0392b", fontSize: 13 }}>
            ⚠ 취소된 주문이지만 세금계산서가 발행되어 있습니다. 수정세금계산서
            발행을 별도로 처리하세요.
          </p>
        )}
      </div>

      {/* 현금영수증 (세금계산서와 택1 — 신청 건만 의미 있음) */}
      {o.cash.state !== "none" && (
        <div className={styles.card} style={{ padding: 24 }}>
          <h2 className={styles.sectionTitle}>현금영수증</h2>
          <table className={styles.table}>
            <tbody>
              <tr>
                <th style={{ width: 160 }}>상태</th>
                <td>
                  {o.cash.state === "issued" ? "발행완료" : "발행 대기"}
                </td>
              </tr>
              <tr>
                <th>휴대폰번호</th>
                <td className={styles.mono}>{o.cash.phone ?? "—"}</td>
              </tr>
              {o.cash.issuedAt && (
                <tr>
                  <th>발행일</th>
                  <td className={styles.mono}>{fmt(o.cash.issuedAt)}</td>
                </tr>
              )}
              {o.cash.approvalNo && (
                <tr>
                  <th>승인번호</th>
                  <td className={styles.mono}>{o.cash.approvalNo}</td>
                </tr>
              )}
            </tbody>
          </table>
          {o.status === "cancelled" && o.cash.state === "issued" && (
            <p style={{ marginTop: 12, color: "#c0392b", fontSize: 13 }}>
              ⚠ 취소된 주문이지만 현금영수증이 발행되어 있습니다. 발급 취소를
              별도로 처리하세요.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
