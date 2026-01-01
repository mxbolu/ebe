-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "ReadingStatus" AS ENUM ('WANT_TO_READ', 'CURRENTLY_READING', 'FINISHED', 'DID_NOT_FINISH');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BookSource" AS ENUM ('USER_SUBMITTED', 'API_IMPORT', 'ADMIN_ADDED');

-- CreateEnum
CREATE TYPE "BadgeType" AS ENUM ('BOOK_CONTRIBUTOR', 'EDIT_CONTRIBUTOR', 'READING_MILESTONE', 'REVIEW_MASTER', 'EARLY_ADOPTER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT,
    "avatar" TEXT,
    "bio" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "showContributions" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "authors" TEXT[],
    "isbn" TEXT,
    "coverImageUrl" TEXT,
    "description" TEXT,
    "publishedYear" INTEGER,
    "genres" TEXT[],
    "pageCount" INTEGER,
    "publisher" TEXT,
    "language" TEXT DEFAULT 'en',
    "source" "BookSource" NOT NULL,
    "addedByUserId" TEXT,
    "approvedByUserId" TEXT,
    "timesAddedToShelves" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION,
    "totalRatings" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookSubmission" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "authors" TEXT[],
    "isbn" TEXT,
    "coverImageUrl" TEXT,
    "description" TEXT,
    "publishedYear" INTEGER,
    "genres" TEXT[],
    "pageCount" INTEGER,
    "publisher" TEXT,
    "language" TEXT,
    "submissionNotes" TEXT,
    "submittedByUserId" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedByUserId" TEXT,
    "reviewNotes" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "BookSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookEditSuggestion" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "suggestedByUserId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "currentValue" TEXT,
    "suggestedValue" TEXT NOT NULL,
    "reason" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedByUserId" TEXT,
    "reviewNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookEditSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "status" "ReadingStatus" NOT NULL DEFAULT 'WANT_TO_READ',
    "startDate" TIMESTAMP(3),
    "finishDate" TIMESTAMP(3),
    "rating" INTEGER,
    "review" TEXT,
    "notes" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingProgress" (
    "id" TEXT NOT NULL,
    "readingEntryId" TEXT NOT NULL,
    "currentPage" INTEGER NOT NULL DEFAULT 0,
    "totalPages" INTEGER NOT NULL,
    "progressPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shelf" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shelf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShelfBook" (
    "id" TEXT NOT NULL,
    "shelfId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShelfBook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GamificationStats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "booksSubmitted" INTEGER NOT NULL DEFAULT 0,
    "booksApproved" INTEGER NOT NULL DEFAULT 0,
    "editsSubmitted" INTEGER NOT NULL DEFAULT 0,
    "editsApproved" INTEGER NOT NULL DEFAULT 0,
    "booksRead" INTEGER NOT NULL DEFAULT 0,
    "pagesRead" INTEGER NOT NULL DEFAULT 0,
    "reviewsWritten" INTEGER NOT NULL DEFAULT 0,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GamificationStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "BadgeType" NOT NULL,
    "iconUrl" TEXT,
    "criteria" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Book_isbn_key" ON "Book"("isbn");

-- CreateIndex
CREATE INDEX "Book_title_idx" ON "Book"("title");

-- CreateIndex
CREATE INDEX "Book_authors_idx" ON "Book"("authors");

-- CreateIndex
CREATE INDEX "Book_isbn_idx" ON "Book"("isbn");

-- CreateIndex
CREATE INDEX "Book_source_idx" ON "Book"("source");

-- CreateIndex
CREATE INDEX "Book_createdAt_idx" ON "Book"("createdAt");

-- CreateIndex
CREATE INDEX "BookSubmission_submittedByUserId_idx" ON "BookSubmission"("submittedByUserId");

-- CreateIndex
CREATE INDEX "BookSubmission_status_idx" ON "BookSubmission"("status");

-- CreateIndex
CREATE INDEX "BookSubmission_submittedAt_idx" ON "BookSubmission"("submittedAt");

-- CreateIndex
CREATE INDEX "BookEditSuggestion_bookId_idx" ON "BookEditSuggestion"("bookId");

-- CreateIndex
CREATE INDEX "BookEditSuggestion_status_idx" ON "BookEditSuggestion"("status");

-- CreateIndex
CREATE INDEX "BookEditSuggestion_suggestedByUserId_idx" ON "BookEditSuggestion"("suggestedByUserId");

-- CreateIndex
CREATE INDEX "ReadingEntry_userId_idx" ON "ReadingEntry"("userId");

-- CreateIndex
CREATE INDEX "ReadingEntry_bookId_idx" ON "ReadingEntry"("bookId");

-- CreateIndex
CREATE INDEX "ReadingEntry_status_idx" ON "ReadingEntry"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ReadingEntry_userId_bookId_key" ON "ReadingEntry"("userId", "bookId");

-- CreateIndex
CREATE UNIQUE INDEX "ReadingProgress_readingEntryId_key" ON "ReadingProgress"("readingEntryId");

-- CreateIndex
CREATE INDEX "ReadingProgress_readingEntryId_idx" ON "ReadingProgress"("readingEntryId");

-- CreateIndex
CREATE INDEX "Shelf_userId_idx" ON "Shelf"("userId");

-- CreateIndex
CREATE INDEX "ShelfBook_shelfId_idx" ON "ShelfBook"("shelfId");

-- CreateIndex
CREATE INDEX "ShelfBook_bookId_idx" ON "ShelfBook"("bookId");

-- CreateIndex
CREATE UNIQUE INDEX "ShelfBook_shelfId_bookId_key" ON "ShelfBook"("shelfId", "bookId");

-- CreateIndex
CREATE UNIQUE INDEX "GamificationStats_userId_key" ON "GamificationStats"("userId");

-- CreateIndex
CREATE INDEX "GamificationStats_totalPoints_idx" ON "GamificationStats"("totalPoints");

-- CreateIndex
CREATE INDEX "GamificationStats_level_idx" ON "GamificationStats"("level");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_name_key" ON "Badge"("name");

-- CreateIndex
CREATE INDEX "UserBadge_userId_idx" ON "UserBadge"("userId");

-- CreateIndex
CREATE INDEX "UserBadge_badgeId_idx" ON "UserBadge"("badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_userId_badgeId_key" ON "UserBadge"("userId", "badgeId");

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_addedByUserId_fkey" FOREIGN KEY ("addedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookSubmission" ADD CONSTRAINT "BookSubmission_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookSubmission" ADD CONSTRAINT "BookSubmission_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookEditSuggestion" ADD CONSTRAINT "BookEditSuggestion_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookEditSuggestion" ADD CONSTRAINT "BookEditSuggestion_suggestedByUserId_fkey" FOREIGN KEY ("suggestedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookEditSuggestion" ADD CONSTRAINT "BookEditSuggestion_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingEntry" ADD CONSTRAINT "ReadingEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingEntry" ADD CONSTRAINT "ReadingEntry_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingProgress" ADD CONSTRAINT "ReadingProgress_readingEntryId_fkey" FOREIGN KEY ("readingEntryId") REFERENCES "ReadingEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shelf" ADD CONSTRAINT "Shelf_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShelfBook" ADD CONSTRAINT "ShelfBook_shelfId_fkey" FOREIGN KEY ("shelfId") REFERENCES "Shelf"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShelfBook" ADD CONSTRAINT "ShelfBook_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamificationStats" ADD CONSTRAINT "GamificationStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
