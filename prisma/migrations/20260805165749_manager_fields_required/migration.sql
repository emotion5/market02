-- 담당자명·담당자 연락처를 필수(NOT NULL)로 전환.
-- 기존 빈 값(테스트 계정 3건)은 2026-08-05 backfill 완료 → 안전하게 제약 추가.
ALTER TABLE "BusinessProfile" ALTER COLUMN "managerName" SET NOT NULL;
ALTER TABLE "BusinessProfile" ALTER COLUMN "managerTel" SET NOT NULL;
