-- CreateTable
CREATE TABLE "SiteSetting" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "supplierName" TEXT NOT NULL,
    "supplierOwner" TEXT NOT NULL,
    "supplierBizNo" TEXT NOT NULL,
    "supplierAddress" TEXT NOT NULL,
    "supplierCategory" TEXT NOT NULL,
    "supplierTel" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "bankAccountNumber" TEXT NOT NULL,
    "bankAccountHolder" TEXT NOT NULL,
    "quoteValidDays" INTEGER NOT NULL DEFAULT 14,
    "csEmail" TEXT NOT NULL,
    "csTel" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);

-- Seed the singleton row with the current hardcoded values (lib/constants),
-- so consumer screens keep showing the same values until an admin edits them.
INSERT INTO "SiteSetting" (
    "id", "supplierName", "supplierOwner", "supplierBizNo", "supplierAddress",
    "supplierCategory", "supplierTel", "bankName", "bankAccountNumber",
    "bankAccountHolder", "quoteValidDays", "csEmail", "csTel", "updatedAt"
) VALUES (
    'default', 'MMM MARKET', '홍길동', '000-00-00000', '서울특별시 ○○구 ○○로 00, 0층',
    '도소매 / 인테리어 자재', '02-000-0000', '국민은행', '000000-00-000000',
    'MMM MARKET', 14, 'help@mmm-market.com', '02-000-0000', NOW()
);
