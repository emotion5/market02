import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";

// 어드민 견적서 관리(조회 위주). 소비자용 server/quotes/service 와 분리.

export interface AdminQuoteRow {
  number: string;
  issuedAt: string;
  validUntil: string;
  expired: boolean;
  customerCompany: string;
  customerContactName: string;
  total: number;
  itemCount: number;
  userEmail: string;
}

export interface AdminQuoteListResult {
  rows: AdminQuoteRow[];
  total: number;
  page: number;
  pageSize: number;
}

export const QUOTE_PAGE_SIZE = 20;

export async function listQuotesForAdmin(
  opts: { q?: string; status?: string; page?: number } = {},
): Promise<AdminQuoteListResult> {
  const now = new Date();
  const where: Prisma.QuoteWhereInput = {};
  if (opts.status === "valid") where.validUntil = { gte: now };
  else if (opts.status === "expired") where.validUntil = { lt: now };

  const q = opts.q?.trim();
  if (q) {
    where.OR = [
      { number: { contains: q, mode: "insensitive" } },
      { customerCompany: { contains: q, mode: "insensitive" } },
      { customerContactName: { contains: q, mode: "insensitive" } },
    ];
  }

  const page = Math.max(1, opts.page ?? 1);
  const [total, quotes] = await Promise.all([
    prisma.quote.count({ where }),
    prisma.quote.findMany({
      where,
      orderBy: { issuedAt: "desc" },
      skip: (page - 1) * QUOTE_PAGE_SIZE,
      take: QUOTE_PAGE_SIZE,
      include: {
        _count: { select: { items: true } },
        user: { select: { email: true } },
      },
    }),
  ]);

  return {
    rows: quotes.map((qt) => ({
      number: qt.number,
      issuedAt: qt.issuedAt.toISOString(),
      validUntil: qt.validUntil.toISOString(),
      expired: qt.validUntil.getTime() < now.getTime(),
      customerCompany: qt.customerCompany,
      customerContactName: qt.customerContactName,
      total: qt.total,
      itemCount: qt._count.items,
      userEmail: qt.user.email,
    })),
    total,
    page,
    pageSize: QUOTE_PAGE_SIZE,
  };
}

export interface AdminQuoteItem {
  productId: string;
  productName: string;
  variantName: string;
  color: string | null;
  image: string;
  unitPrice: number;
  quantity: number;
}
export interface AdminQuoteDetail {
  number: string;
  issuedAt: string;
  validUntil: string;
  expired: boolean;
  userEmail: string;
  customer: { company: string; contactName: string; contactTel: string };
  items: AdminQuoteItem[];
  supply: number;
  vat: number;
  total: number;
}

export async function getQuoteForAdmin(
  number: string,
): Promise<AdminQuoteDetail | null> {
  const qt = await prisma.quote.findUnique({
    where: { number },
    include: { items: { orderBy: { id: "asc" } }, user: { select: { email: true } } },
  });
  if (!qt) return null;
  return {
    number: qt.number,
    issuedAt: qt.issuedAt.toISOString(),
    validUntil: qt.validUntil.toISOString(),
    expired: qt.validUntil.getTime() < Date.now(),
    userEmail: qt.user.email,
    customer: {
      company: qt.customerCompany,
      contactName: qt.customerContactName,
      contactTel: qt.customerContactTel,
    },
    items: qt.items.map((it) => ({
      productId: it.productId,
      productName: it.productName,
      variantName: it.variantName,
      color: it.color,
      image: it.image,
      unitPrice: it.unitPrice,
      quantity: it.quantity,
    })),
    supply: qt.supply,
    vat: qt.vat,
    total: qt.total,
  };
}
