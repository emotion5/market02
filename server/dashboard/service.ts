import { prisma } from "@/server/db";

// 어드민 대시보드 지표. 각 카드는 대응하는 관리 화면으로 연결된다.
export interface DashboardStats {
  pendingBusiness: number; // 사업자 승인 대기
  pendingDeposit: number; // 입금 대기 주문
  toShip: number; // 배송 처리 대기(입금확인·배송준비)
  taxPending: number; // 세금계산서 발행 대기
  newMembers7d: number; // 최근 7일 신규 가입(고객)
  validQuotes: number; // 유효한 견적서
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);

  const [
    pendingBusiness,
    pendingDeposit,
    toShip,
    taxPending,
    newMembers7d,
    validQuotes,
  ] = await Promise.all([
    prisma.user.count({ where: { type: "BUSINESS", status: "PENDING" } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: { in: ["PAID", "PREPARING"] } } }),
    prisma.taxInvoice.count({ where: { requested: true, status: "PENDING" } }),
    prisma.user.count({
      where: { role: "CUSTOMER", createdAt: { gte: weekAgo } },
    }),
    prisma.quote.count({ where: { validUntil: { gte: now } } }),
  ]);

  return {
    pendingBusiness,
    pendingDeposit,
    toShip,
    taxPending,
    newMembers7d,
    validQuotes,
  };
}
