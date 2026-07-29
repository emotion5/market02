import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getUserOrder } from "@/server/orders/service";
import { getProfile } from "@/server/auth/service";
import { getSiteSettings } from "@/lib/settings";
import TransactionStatement, {
  type StatementData,
} from "@/components/order/TransactionStatement";

export const dynamic = "force-dynamic";

const p2 = (n: number) => String(n).padStart(2, "0");

// 거래명세표 — 본인 주문의 거래 내역을 A4 문서로. 입금확인(결제완료) 이후에만 제공.
export default async function StatementPage({
  params,
}: {
  params: Promise<{ orderNo: string }>;
}) {
  const { orderNo } = await params;
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const [order, settings, profile] = await Promise.all([
    getUserOrder(decodeURIComponent(orderNo), session.userId),
    getSiteSettings(),
    getProfile(session.userId),
  ]);
  if (!order) notFound();
  // 입금 전(입금대기)·취소 건은 거래명세표 대상이 아니다.
  if (order.status === "pending" || order.status === "cancelled") notFound();

  const created = new Date(order.createdAt);
  const lineDate = `${p2(created.getMonth() + 1)}.${p2(created.getDate())}`;

  const items = order.items.map((it) => {
    const amount = it.price * it.quantity; // 부가세 포함 공급대가
    const vat = Math.round((amount * 10) / 110);
    return {
      date: lineDate,
      name: it.productName,
      spec: it.variantName,
      qty: it.quantity,
      unitPrice: it.price,
      supply: amount - vat,
      vat,
    };
  });

  const now = new Date();
  const data: StatementData = {
    issueNo: order.orderNo,
    issuedDate: `${now.getFullYear()}. ${p2(now.getMonth() + 1)}. ${p2(now.getDate())}`,
    customerName: profile?.company || order.orderer.name,
    supplier: {
      name: settings.supplierName,
      owner: settings.supplierOwner,
      bizNo: settings.supplierBizNo,
      address: settings.supplierAddress,
      category: settings.supplierCategory,
      tel: settings.supplierTel,
    },
    recipient: {
      name: order.orderer.name,
      tel: order.orderer.tel,
      address: order.orderer.address,
    },
    items,
    total: order.total,
  };

  return <TransactionStatement data={data} />;
}
