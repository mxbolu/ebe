-- CreateTable
CREATE TABLE "BookClub" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "coverImage" TEXT,
    "maxMembers" INTEGER,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookClub_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookClubMember" (
    "id" TEXT NOT NULL,
    "bookClubId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookClubMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookClubBook" (
    "id" TEXT NOT NULL,
    "bookClubId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "addedById" TEXT NOT NULL,
    "currentReadClubId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookClubBook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookClubDiscussion" (
    "id" TEXT NOT NULL,
    "bookClubId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "replyToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookClubDiscussion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookClub_createdById_idx" ON "BookClub"("createdById");

-- CreateIndex
CREATE INDEX "BookClub_isPublic_idx" ON "BookClub"("isPublic");

-- CreateIndex
CREATE INDEX "BookClub_createdAt_idx" ON "BookClub"("createdAt");

-- CreateIndex
CREATE INDEX "BookClubMember_bookClubId_idx" ON "BookClubMember"("bookClubId");

-- CreateIndex
CREATE INDEX "BookClubMember_userId_idx" ON "BookClubMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BookClubMember_bookClubId_userId_key" ON "BookClubMember"("bookClubId", "userId");

-- CreateIndex
CREATE INDEX "BookClubBook_bookClubId_idx" ON "BookClubBook"("bookClubId");

-- CreateIndex
CREATE INDEX "BookClubBook_bookId_idx" ON "BookClubBook"("bookId");

-- CreateIndex
CREATE INDEX "BookClubBook_status_idx" ON "BookClubBook"("status");

-- CreateIndex
CREATE UNIQUE INDEX "BookClubBook_currentReadClubId_key" ON "BookClubBook"("currentReadClubId");

-- CreateIndex
CREATE INDEX "BookClubDiscussion_bookClubId_idx" ON "BookClubDiscussion"("bookClubId");

-- CreateIndex
CREATE INDEX "BookClubDiscussion_userId_idx" ON "BookClubDiscussion"("userId");

-- CreateIndex
CREATE INDEX "BookClubDiscussion_createdAt_idx" ON "BookClubDiscussion"("createdAt");

-- CreateIndex
CREATE INDEX "BookClubDiscussion_replyToId_idx" ON "BookClubDiscussion"("replyToId");

-- AddForeignKey
ALTER TABLE "BookClub" ADD CONSTRAINT "BookClub_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookClubMember" ADD CONSTRAINT "BookClubMember_bookClubId_fkey" FOREIGN KEY ("bookClubId") REFERENCES "BookClub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookClubMember" ADD CONSTRAINT "BookClubMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookClubBook" ADD CONSTRAINT "BookClubBook_bookClubId_fkey" FOREIGN KEY ("bookClubId") REFERENCES "BookClub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookClubBook" ADD CONSTRAINT "BookClubBook_currentReadClubId_fkey" FOREIGN KEY ("currentReadClubId") REFERENCES "BookClub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookClubBook" ADD CONSTRAINT "BookClubBook_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookClubBook" ADD CONSTRAINT "BookClubBook_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookClubDiscussion" ADD CONSTRAINT "BookClubDiscussion_bookClubId_fkey" FOREIGN KEY ("bookClubId") REFERENCES "BookClub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookClubDiscussion" ADD CONSTRAINT "BookClubDiscussion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookClubDiscussion" ADD CONSTRAINT "BookClubDiscussion_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "BookClubDiscussion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
