-- CreateIndex
CREATE INDEX "Book_publishedYear_idx" ON "Book"("publishedYear");

-- CreateIndex
CREATE INDEX "Book_averageRating_idx" ON "Book"("averageRating");

-- CreateIndex
CREATE INDEX "Book_genres_idx" ON "Book"("genres");

-- CreateIndex
CREATE INDEX "Book_averageRating_totalRatings_idx" ON "Book"("averageRating", "totalRatings");

-- CreateIndex
CREATE INDEX "Book_publishedYear_averageRating_idx" ON "Book"("publishedYear", "averageRating");
