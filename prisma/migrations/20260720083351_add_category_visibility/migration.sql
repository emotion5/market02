-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "showInNav" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showOnHome" BOOLEAN NOT NULL DEFAULT true;
