-- CreateTable
CREATE TABLE "BookClubMeeting" (
    "id" TEXT NOT NULL,
    "bookClubId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "agoraChannelName" TEXT NOT NULL,
    "agoraAppId" TEXT,
    "recordingUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookClubMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookClubMeeting_bookClubId_idx" ON "BookClubMeeting"("bookClubId");

-- CreateIndex
CREATE INDEX "BookClubMeeting_scheduledAt_idx" ON "BookClubMeeting"("scheduledAt");

-- CreateIndex
CREATE INDEX "BookClubMeeting_status_idx" ON "BookClubMeeting"("status");

-- AddForeignKey
ALTER TABLE "BookClubMeeting" ADD CONSTRAINT "BookClubMeeting_bookClubId_fkey" FOREIGN KEY ("bookClubId") REFERENCES "BookClub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookClubMeeting" ADD CONSTRAINT "BookClubMeeting_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
