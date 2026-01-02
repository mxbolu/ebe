-- Add performance indexes for Phase 3 gamification features

-- Badge indexes for faster lookups by type and name
CREATE INDEX "Badge_type_idx" ON "Badge"("type");
CREATE INDEX "Badge_type_name_idx" ON "Badge"("type", "name");

-- ReadingEntry indexes for badge checking and review sorting
CREATE INDEX "ReadingEntry_userId_status_idx" ON "ReadingEntry"("userId", "status");
CREATE INDEX "ReadingEntry_bookId_status_isPrivate_idx" ON "ReadingEntry"("bookId", "status", "isPrivate");
CREATE INDEX "ReadingEntry_createdAt_idx" ON "ReadingEntry"("createdAt");
CREATE INDEX "ReadingEntry_rating_idx" ON "ReadingEntry"("rating");

-- ReadingChallenge indexes for fetching active challenges
CREATE INDEX "ReadingChallenge_isActive_endDate_idx" ON "ReadingChallenge"("isActive", "endDate");
CREATE INDEX "ReadingChallenge_startDate_idx" ON "ReadingChallenge"("startDate");
