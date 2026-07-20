-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "vaAccountNumber" TEXT,
ADD COLUMN     "vaBank" TEXT,
ADD COLUMN     "vaDueDate" TIMESTAMP(3);
