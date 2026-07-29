-- CreateEnum
CREATE TYPE "CashReceiptStatus" AS ENUM ('NONE', 'PENDING', 'ISSUED');

-- CreateTable
CREATE TABLE "CashReceipt" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "requested" BOOLEAN NOT NULL DEFAULT false,
    "phone" TEXT,
    "status" "CashReceiptStatus" NOT NULL DEFAULT 'NONE',
    "approvalNo" TEXT,
    "issuedAt" TIMESTAMP(3),
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CashReceipt_orderId_key" ON "CashReceipt"("orderId");

-- AddForeignKey
ALTER TABLE "CashReceipt" ADD CONSTRAINT "CashReceipt_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
