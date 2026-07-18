-- AlterTable
ALTER TABLE "BusinessProfile" ALTER COLUMN "company" DROP NOT NULL,
ALTER COLUMN "licenseFileUrl" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "name" DROP NOT NULL;
