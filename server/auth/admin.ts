import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";

// 어드민 회원 관리용 조회 (전체 회원 목록·검색·상세).
// 승인/반려 쓰기 로직은 기존 auth/service.ts 에 있음(approveBusiness/rejectBusiness).
// 관리자 계정(role=ADMIN)은 회원 목록에서 제외한다.

export type MemberType = "PERSONAL" | "BUSINESS";
export type MemberStatus = "ACTIVE" | "PENDING" | "REJECTED" | "WITHDRAWN";

export interface AdminMemberRow {
  id: string;
  email: string;
  name: string | null;
  type: MemberType;
  status: MemberStatus;
  company: string | null; // 사업자
  bizNo: string | null; // 사업자
  createdAt: string; // ISO
}

export interface AdminMemberListResult {
  rows: AdminMemberRow[];
  total: number;
  page: number;
  pageSize: number;
}

export const MEMBER_PAGE_SIZE = 20;

export async function listMembersForAdmin(
  opts: { q?: string; type?: string; status?: string; page?: number } = {},
): Promise<AdminMemberListResult> {
  const where: Prisma.UserWhereInput = { role: "CUSTOMER" };
  if (opts.type === "PERSONAL" || opts.type === "BUSINESS") {
    where.type = opts.type;
  }
  if (
    opts.status === "ACTIVE" ||
    opts.status === "PENDING" ||
    opts.status === "REJECTED" ||
    opts.status === "WITHDRAWN"
  ) {
    where.status = opts.status;
  }
  const q = opts.q?.trim();
  if (q) {
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
      { business: { company: { contains: q, mode: "insensitive" } } },
      { business: { bizNo: { contains: q } } },
    ];
  }

  const page = Math.max(1, opts.page ?? 1);
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      include: { business: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * MEMBER_PAGE_SIZE,
      take: MEMBER_PAGE_SIZE,
    }),
  ]);

  return {
    rows: users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      type: u.type,
      status: u.status,
      company: u.business?.company ?? null,
      bizNo: u.business?.bizNo ?? null,
      createdAt: u.createdAt.toISOString(),
    })),
    total,
    page,
    pageSize: MEMBER_PAGE_SIZE,
  };
}

export interface AdminMemberDetail {
  id: string;
  email: string;
  name: string | null;
  tel: string | null;
  type: MemberType;
  status: MemberStatus;
  createdAt: string;
  withdrawnAt: string | null;
  business: null | {
    bizNo: string;
    company: string | null;
    owner: string | null;
    licenseFileUrl: string | null;
    approvedAt: string | null;
    approvedById: string | null;
    rejectReason: string | null;
  };
}

export async function getMemberForAdmin(
  id: string,
): Promise<AdminMemberDetail | null> {
  const u = await prisma.user.findFirst({
    where: { id, role: "CUSTOMER" },
    include: { business: true },
  });
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    tel: u.tel,
    type: u.type,
    status: u.status,
    createdAt: u.createdAt.toISOString(),
    withdrawnAt: u.withdrawnAt ? u.withdrawnAt.toISOString() : null,
    business: u.business
      ? {
          bizNo: u.business.bizNo,
          company: u.business.company,
          owner: u.business.owner,
          licenseFileUrl: u.business.licenseFileUrl,
          approvedAt: u.business.approvedAt
            ? u.business.approvedAt.toISOString()
            : null,
          approvedById: u.business.approvedById,
          rejectReason: u.business.rejectReason,
        }
      : null,
  };
}
