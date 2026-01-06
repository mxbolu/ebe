-- AlterTable
ALTER TABLE "BookClubMeeting" ADD COLUMN     "waitingRoomEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "MeetingWaitingParticipant" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingWaitingParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MeetingWaitingParticipant_meetingId_idx" ON "MeetingWaitingParticipant"("meetingId");

-- CreateIndex
CREATE INDEX "MeetingWaitingParticipant_userId_idx" ON "MeetingWaitingParticipant"("userId");

-- CreateIndex
CREATE INDEX "MeetingWaitingParticipant_status_idx" ON "MeetingWaitingParticipant"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingWaitingParticipant_meetingId_userId_key" ON "MeetingWaitingParticipant"("meetingId", "userId");

-- AddForeignKey
ALTER TABLE "MeetingWaitingParticipant" ADD CONSTRAINT "MeetingWaitingParticipant_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "BookClubMeeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingWaitingParticipant" ADD CONSTRAINT "MeetingWaitingParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
