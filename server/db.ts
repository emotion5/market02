import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7: 런타임 DB 접속은 "드라이버 어댑터"로 한다.
// DATABASE_URL = 앱 런타임 접속 URL (서버리스면 커넥션 풀러 URL: Neon pooler 등).
// (마이그레이션용 DIRECT_URL 은 prisma.config.ts 가 별도로 사용)
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// 개발 중 HMR 로 PrismaClient 인스턴스가 여러 개 생겨 커넥션이 새는 것을 막는 싱글턴.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
