-- AlterEnum: 회원 상태에 '정지' 추가 (schema 순서에 맞춰 WITHDRAWN 앞에 배치)
ALTER TYPE "UserStatus" ADD VALUE 'SUSPENDED' BEFORE 'WITHDRAWN';

-- CreateEnum: 회원 등급(회원도매가 자격)
CREATE TYPE "MemberGrade" AS ENUM ('GENERAL', 'WHOLESALE');

-- AlterTable: 등급 + 정지 감사 필드
ALTER TABLE "User"
  ADD COLUMN "grade" "MemberGrade" NOT NULL DEFAULT 'GENERAL',
  ADD COLUMN "suspendedAt" TIMESTAMP(3),
  ADD COLUMN "suspendReason" TEXT,
  ADD COLUMN "suspendedById" TEXT;

-- Backfill: 기존 승인 사업자(활성)는 회원도매가 등급을 유지 (가격 정책 불변)
UPDATE "User" SET "grade" = 'WHOLESALE' WHERE "type" = 'BUSINESS' AND "status" = 'ACTIVE';
