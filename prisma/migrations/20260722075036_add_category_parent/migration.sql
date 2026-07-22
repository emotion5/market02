-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "parentSlug" TEXT;

-- CreateIndex
CREATE INDEX "Category_parentSlug_idx" ON "Category"("parentSlug");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentSlug_fkey" FOREIGN KEY ("parentSlug") REFERENCES "Category"("slug") ON DELETE NO ACTION ON UPDATE NO ACTION;
