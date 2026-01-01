-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "goodreadsId" TEXT;

-- CreateIndex
CREATE INDEX "Book_goodreadsId_idx" ON "Book"("goodreadsId");
