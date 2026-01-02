-- AlterTable
ALTER TABLE "ReadingEntry" ADD COLUMN     "readCount" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "lastReadDate" TIMESTAMP(3);

-- Update existing entries: set lastReadDate to finishDate for FINISHED books
UPDATE "ReadingEntry"
SET "lastReadDate" = "finishDate"
WHERE status = 'FINISHED' AND "finishDate" IS NOT NULL;
