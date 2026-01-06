-- CreateTable
CREATE TABLE "ReviewComment" (
    "id" TEXT NOT NULL,
    "readingEntryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReviewComment_readingEntryId_idx" ON "ReviewComment"("readingEntryId");

-- CreateIndex
CREATE INDEX "ReviewComment_userId_idx" ON "ReviewComment"("userId");

-- CreateIndex
CREATE INDEX "ReviewComment_parentId_idx" ON "ReviewComment"("parentId");

-- CreateIndex
CREATE INDEX "ReviewComment_createdAt_idx" ON "ReviewComment"("createdAt");

-- AddForeignKey
ALTER TABLE "ReviewComment" ADD CONSTRAINT "ReviewComment_readingEntryId_fkey" FOREIGN KEY ("readingEntryId") REFERENCES "ReadingEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewComment" ADD CONSTRAINT "ReviewComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewComment" ADD CONSTRAINT "ReviewComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ReviewComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
