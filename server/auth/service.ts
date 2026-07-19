import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { hashPassword, verifyPassword } from "./password";
import type { SessionPayload } from "./session";

// 인증 비즈니스 로직 (순수 — Next 비의존). 라우트 핸들러가 오케스트레이션한다.

export type AuthErrorCode =
  | "EMAIL_TAKEN"
  | "BIZNO_TAKEN"
  | "INVALID_CREDENTIALS"
  | "NOT_ALLOWED";

export class AuthError extends Error {
  constructor(
    public code: AuthErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export interface AuthUser {
  id: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
  type: "PERSONAL" | "BUSINESS";
  status: "ACTIVE" | "PENDING" | "REJECTED" | "SUSPENDED" | "WITHDRAWN";
  name: string | null;
}

type UserRow = {
  id: string;
  email: string;
  role: AuthUser["role"];
  type: AuthUser["type"];
  status: AuthUser["status"];
  name: string | null;
};

function toAuthUser(u: UserRow): AuthUser {
  return {
    id: u.id,
    email: u.email,
    role: u.role,
    type: u.type,
    status: u.status,
    name: u.name,
  };
}

// 세션에 담을 최소 정보. (회원도매가 여부는 매 요청 DB 조회로 판정 — 토큰 staleness 방지)
export function sessionFor(user: AuthUser): SessionPayload {
  return { userId: user.id, role: user.role };
}

async function ensureEmailFree(email: string): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AuthError("EMAIL_TAKEN", "이미 가입된 이메일입니다.");
}

// 동시 가입 레이스는 DB unique 제약이 최종 방어 — P2002 를 친절한 에러로 변환.
function mapUniqueError(e: unknown): never {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    const target = String(e.meta?.target ?? "");
    if (target.includes("bizNo")) {
      throw new AuthError("BIZNO_TAKEN", "이미 등록된 사업자등록번호입니다.");
    }
    throw new AuthError("EMAIL_TAKEN", "이미 가입된 이메일입니다.");
  }
  throw e;
}

export async function signupPersonal(input: {
  email: string;
  password: string;
}): Promise<AuthUser> {
  await ensureEmailFree(input.email);
  const passwordHash = await hashPassword(input.password);
  try {
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        type: "PERSONAL",
        status: "ACTIVE",
      },
    });
    return toAuthUser(user);
  } catch (e) {
    mapUniqueError(e);
  }
}

export async function signupBusiness(input: {
  email: string;
  password: string;
  bizNo: string;
  company?: string;
  licenseFileUrl?: string;
}): Promise<AuthUser> {
  await ensureEmailFree(input.email);
  const existingBiz = await prisma.businessProfile.findUnique({
    where: { bizNo: input.bizNo },
  });
  if (existingBiz) {
    throw new AuthError("BIZNO_TAKEN", "이미 등록된 사업자등록번호입니다.");
  }
  const passwordHash = await hashPassword(input.password);
  try {
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        type: "BUSINESS",
        status: "PENDING", // 관리자 승인 후 ACTIVE + 회원도매가
        business: {
          create: {
            bizNo: input.bizNo,
            company: input.company ?? null,
            licenseFileUrl: input.licenseFileUrl ?? null,
          },
        },
      },
    });
    return toAuthUser(user);
  } catch (e) {
    mapUniqueError(e);
  }
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<AuthUser> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  const invalid = new AuthError(
    "INVALID_CREDENTIALS",
    "이메일 또는 비밀번호가 올바르지 않습니다.",
  );
  if (!user) throw invalid;
  const ok = await verifyPassword(user.passwordHash, input.password);
  if (!ok) throw invalid;
  if (user.status === "WITHDRAWN") {
    throw new AuthError("NOT_ALLOWED", "탈퇴한 계정입니다.");
  }
  if (user.status === "REJECTED") {
    throw new AuthError(
      "NOT_ALLOWED",
      "가입이 반려된 계정입니다. 고객센터로 문의해주세요.",
    );
  }
  if (user.status === "SUSPENDED") {
    throw new AuthError(
      "NOT_ALLOWED",
      "정지된 계정입니다. 고객센터로 문의해주세요.",
    );
  }
  return toAuthUser(user);
}

export async function getMe(userId: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.status === "WITHDRAWN") return null;
  return toAuthUser(user);
}

// ── 사업자 승인 (관리자) ──────────────────────────────

export interface PendingBusiness {
  id: string; // user id
  email: string;
  bizNo: string;
  company: string | null;
  createdAt: string; // ISO
}

export async function listPendingBusinesses(): Promise<PendingBusiness[]> {
  const users = await prisma.user.findMany({
    where: { type: "BUSINESS", status: "PENDING" },
    include: { business: true },
    orderBy: { createdAt: "asc" },
  });
  return users.map((u) => ({
    id: u.id,
    email: u.email,
    bizNo: u.business?.bizNo ?? "",
    company: u.business?.company ?? null,
    createdAt: u.createdAt.toISOString(),
  }));
}

export async function approveBusiness(
  userId: string,
  adminId: string,
): Promise<void> {
  await prisma.$transaction([
    // 승인 = 활성화 + 회원도매가 등급 부여
    prisma.user.update({
      where: { id: userId },
      data: { status: "ACTIVE", grade: "WHOLESALE" },
    }),
    prisma.businessProfile.update({
      where: { userId },
      data: { approvedAt: new Date(), approvedById: adminId, rejectReason: null },
    }),
  ]);
}

export async function rejectBusiness(
  userId: string,
  adminId: string,
  reason: string,
): Promise<void> {
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { status: "REJECTED" } }),
    prisma.businessProfile.update({
      where: { userId },
      data: {
        approvedById: adminId,
        approvedAt: null,
        rejectReason: reason || null,
      },
    }),
  ]);
}

// ── 회원 정지 / 등급 (관리자) ──────────────────────────
// 반환값: 처리 성공 여부(대상이 없거나 전이 불가한 상태면 false).

export type MemberOpResult = "ok" | "not_found" | "invalid_state";

// 정지 = 활성 회원의 로그인/이용 차단. ACTIVE 상태에서만 가능.
export async function suspendMember(
  userId: string,
  adminId: string,
  reason: string,
): Promise<MemberOpResult> {
  const u = await prisma.user.findFirst({
    where: { id: userId, role: "CUSTOMER" },
    select: { status: true },
  });
  if (!u) return "not_found";
  if (u.status !== "ACTIVE") return "invalid_state";
  await prisma.user.update({
    where: { id: userId },
    data: {
      status: "SUSPENDED",
      suspendedAt: new Date(),
      suspendReason: reason || null,
      suspendedById: adminId,
    },
  });
  return "ok";
}

// 정지 해제 = 다시 활성. SUSPENDED 상태에서만 가능. 등급(grade)은 그대로 두어 도매가 자격이 복원된다.
export async function reactivateMember(
  userId: string,
): Promise<MemberOpResult> {
  const u = await prisma.user.findFirst({
    where: { id: userId, role: "CUSTOMER" },
    select: { status: true },
  });
  if (!u) return "not_found";
  if (u.status !== "SUSPENDED") return "invalid_state";
  await prisma.user.update({
    where: { id: userId },
    data: {
      status: "ACTIVE",
      suspendedAt: null,
      suspendReason: null,
      suspendedById: null,
    },
  });
  return "ok";
}

// 등급 변경 = 회원도매가 자격 부여/회수. 활성/정지 회원 대상(탈퇴·반려·대기는 불가).
export async function setMemberGrade(
  userId: string,
  grade: "GENERAL" | "WHOLESALE",
): Promise<MemberOpResult> {
  const u = await prisma.user.findFirst({
    where: { id: userId, role: "CUSTOMER" },
    select: { status: true },
  });
  if (!u) return "not_found";
  if (u.status !== "ACTIVE" && u.status !== "SUSPENDED") return "invalid_state";
  await prisma.user.update({ where: { id: userId }, data: { grade } });
  return "ok";
}

// ── 프로필 / 탈퇴 ──────────────────────────────────────

export interface Profile {
  email: string;
  name: string | null;
  tel: string | null;
  type: "PERSONAL" | "BUSINESS";
  bizNo: string | null; // 사업자회원만
  company: string | null; // 사업자회원만
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    include: { business: true },
  });
  if (!u || u.status === "WITHDRAWN") return null;
  return {
    email: u.email,
    name: u.name,
    tel: u.tel,
    type: u.type,
    bizNo: u.business?.bizNo ?? null,
    company: u.business?.company ?? null,
  };
}

export async function updateProfile(
  userId: string,
  input: { name?: string; tel?: string; company?: string; newPassword?: string },
): Promise<void> {
  const data: Prisma.UserUpdateInput = {};
  if (input.name !== undefined) data.name = input.name || null;
  if (input.tel !== undefined) data.tel = input.tel || null;
  if (input.newPassword) data.passwordHash = await hashPassword(input.newPassword);
  await prisma.user.update({ where: { id: userId }, data });

  // 상호는 사업자회원만 — updateMany 라 프로필 없으면 조용히 no-op
  if (input.company !== undefined) {
    await prisma.businessProfile.updateMany({
      where: { userId },
      data: { company: input.company || null },
    });
  }
}

export async function withdraw(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { status: "WITHDRAWN", withdrawnAt: new Date() },
  });
}
