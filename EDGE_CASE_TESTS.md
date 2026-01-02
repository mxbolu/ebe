# Edge Case Test Cases for Phase 3 Backend

## Overview
This document outlines critical edge cases to test for the gamification system. These tests should be run in development/staging before production deployment.

---

## 1. Badge System Edge Cases

### 1.1 Concurrent Badge Creation
**Scenario:** Two users simultaneously finish their 5th book
**Expected:** Only one "Bookworm Beginner" badge created, both users get it
**How to Test:**
```bash
# Terminal 1: Mark user A's 5th book as finished
curl -X PATCH .../api/reading-entries/entryA -d '{"status":"FINISHED"}'

# Terminal 2: Immediately mark user B's 5th book as finished
curl -X PATCH .../api/reading-entries/entryB -d '{"status":"FINISHED"}'

# Verify: Check database for duplicate badges
SELECT COUNT(*) FROM "Badge" WHERE name = 'Bookworm Beginner'; -- Should be 1
SELECT COUNT(*) FROM "UserBadge" WHERE "badgeId" = ...; -- Should be 2
```
**Status:** ✅ Fixed with race condition handling

---

### 1.2 Badge Awarding on Status Change from FINISHED
**Scenario:** User marks book as FINISHED, then changes to READING
**Expected:** Badge remains earned (no removal)
**How to Test:**
```bash
# Mark as finished (triggers badge check)
PATCH /api/reading-entries/{id} {"status": "FINISHED"}

# Change to READING
PATCH /api/reading-entries/{id} {"status": "READING"}

# Verify: Badge still in UserBadge table
GET /api/user/badges
```
**Expected Result:** Badge persists, count still includes this book

---

### 1.3 Multiple Milestone Badges at Once
**Scenario:** User finishes 10th book, should get both 5-book and 10-book badges if they don't have 5-book yet
**Expected:** Both badges awarded in one operation
**How to Test:**
```bash
# Create user with 9 finished books, mark 10th as finished
PATCH /api/reading-entries/{id} {"status": "FINISHED"}

# Verify both badges earned
GET /api/user/badges
# Should return: "Bookworm Beginner" and "Ten Book Triumph"
```

---

### 1.4 Genre Badge with Multi-Genre Books
**Scenario:** Book has genres ["Fiction", "Mystery"], user finishes 5 books each with both genres
**Expected:** Both "Fiction Explorer" and "Mystery Explorer" badges awarded
**How to Test:**
```sql
-- Setup: 5 books with genres: ["Fiction", "Mystery"]
-- Verify genre count logic
SELECT * FROM "ReadingEntry"
WHERE userId = '...' AND status = 'FINISHED'
```

---

### 1.5 Review Badge Without Actual Review Text
**Scenario:** User has rating but no review text
**Expected:** Should NOT count toward review badges
**How to Test:**
```bash
# Finish 5 books with rating only, no review text
PATCH /api/reading-entries/{id} {"status": "FINISHED", "rating": 8.5}

# Check review master badges
GET /api/user/badges
# Should NOT have "Reviewer Rookie"
```

---

## 2. Reading Streak Edge Cases

### 2.1 Same Day Multiple Finishes
**Scenario:** User finishes 3 books on same day
**Expected:** Streak increments only once (from yesterday to today)
**How to Test:**
```bash
# Mark 3 books as finished on same day
PATCH /api/reading-entries/entry1 {"status": "FINISHED"}
PATCH /api/reading-entries/entry2 {"status": "FINISHED"}
PATCH /api/reading-entries/entry3 {"status": "FINISHED"}

# Check streak
GET /api/user/streak
# currentStreak should increase by 1 maximum
```
**Status:** ✅ Fixed - returns early on daysDiff === 0

---

### 2.2 Timezone Boundary Reading
**Scenario:** User in PST finishes book at 11:30 PM PST, then at 12:30 AM PST (next day local, same day UTC)
**Expected:** Streak should handle correctly based on UTC dates
**How to Test:**
- Mock system time to 2026-01-02 23:30 PST (2026-01-03 07:30 UTC)
- Finish book → creates streak with UTC date 2026-01-03
- Mock system time to 2026-01-03 00:30 PST (2026-01-03 08:30 UTC)
- Finish book → should be same UTC day, no streak increment

**Status:** ✅ Fixed with UTC normalization

---

### 2.3 Leap to 2+ Day Gap
**Scenario:** User has 10-day streak, skips 3 days, then reads again
**Expected:** Current streak resets to 1, longest streak preserved at 10
**How to Test:**
```bash
# Setup: Create streak with currentStreak: 10, longestStreak: 10
# Wait 3 days (or mock date)
# Finish a book
GET /api/user/streak
# Expected: currentStreak: 1, longestStreak: 10
```

---

### 2.4 First Ever Reading
**Scenario:** New user finishes first book ever
**Expected:** Creates ReadingStreak with currentStreak: 1, longestStreak: 1
**How to Test:**
```bash
# New user, mark first book finished
PATCH /api/reading-entries/{id} {"status": "FINISHED"}

GET /api/user/streak
# Expected: { currentStreak: 1, longestStreak: 1, lastReadDate: today }
```

---

### 2.5 Streak Badge Thresholds
**Scenario:** User reaches exactly 7 days, should get "Week Warrior" badge
**Expected:** Badge awarded on day 7, not before
**How to Test:**
```bash
# Setup streak with currentStreak: 6
# Finish book to increment to 7
PATCH /api/reading-entries/{id} {"status": "FINISHED"}

GET /api/user/badges
# Should include "Week Warrior"
```

---

## 3. Review Helpful Edge Cases

### 3.1 Mark Own Review as Helpful
**Scenario:** User tries to mark their own review helpful
**Expected:** 400 error "Cannot mark your own review as helpful"
**How to Test:**
```bash
# User A creates review
PATCH /api/reading-entries/entryA {"status": "FINISHED", "review": "Great!"}

# User A tries to mark own review helpful
POST /api/reviews/entryA/helpful
# Expected: 400 error
```
**Status:** ✅ Implemented with validation

---

### 3.2 Duplicate Helpful Mark
**Scenario:** User tries to mark same review helpful twice
**Expected:** 409 error "Already marked as helpful"
**How to Test:**
```bash
# User B marks review helpful
POST /api/reviews/entryA/helpful

# User B tries again
POST /api/reviews/entryA/helpful
# Expected: 409 error
```
**Status:** ✅ Prevented by unique constraint

---

### 3.3 Remove Non-Existent Helpful Mark
**Scenario:** User tries to remove helpful mark they never made
**Expected:** 404 error "Not marked as helpful"
**How to Test:**
```bash
DELETE /api/reviews/entryA/helpful
# Expected: 404 if user never marked it
```

---

### 3.4 Mark Helpful on Entry Without Review
**Scenario:** Reading entry has rating but no review text
**Expected:** Should still allow marking helpful (rating-only entries count)
**How to Test:**
```bash
# Entry with rating only, no review
POST /api/reviews/entryA/helpful
# Expected: 201 success (as long as rating exists)
```
**Status:** ✅ Implemented - checks `!entry.review && !entry.rating`

---

## 4. Challenge System Edge Cases

### 4.1 Join Inactive Challenge
**Scenario:** User tries to join challenge with isActive: false
**Expected:** 404 error "Challenge not found or inactive"
**How to Test:**
```bash
# Create challenge, set isActive: false
POST /api/challenges/user {"challengeId": "inactive_challenge"}
# Expected: 404 error
```
**Status:** ✅ Implemented

---

### 4.2 Join Same Challenge Twice
**Scenario:** User already in challenge, tries to join again
**Expected:** 409 error "Already joined this challenge"
**How to Test:**
```bash
POST /api/challenges/user {"challengeId": "challenge_1"}
# Success

POST /api/challenges/user {"challengeId": "challenge_1"}
# Expected: 409 error
```
**Status:** ✅ Prevented by unique constraint

---

### 4.3 Join Expired Challenge
**Scenario:** Challenge endDate is in the past
**Expected:** Should not appear in GET /api/challenges
**How to Test:**
```bash
GET /api/challenges
# Should only return challenges where endDate >= now
```
**Status:** ✅ Implemented with `endDate: { gte: new Date() }`

---

## 5. Review Sorting Edge Cases

### 5.1 Sort Reviews with Tie in Helpful Count
**Scenario:** Two reviews both have 5 helpful marks
**Expected:** Stable sort (maintains original order)
**How to Test:**
```bash
GET /api/books/{id}/reviews?sortBy=helpful
# Reviews with same helpfulCount should maintain creation order
```

---

### 5.2 Sort by Highest with Null Ratings
**Scenario:** Some reviews have ratings, some don't
**Expected:** Null ratings should come last
**How to Test:**
```bash
GET /api/books/{id}/reviews?sortBy=highest
# Entries with rating: null should appear at end
```
**Note:** Currently Prisma handles this, but verify behavior

---

### 5.3 Pagination with In-Memory Sorting
**Scenario:** 100 reviews, sort by helpful, paginate 10 per page
**Expected:** Correct top 10 on page 1, next 10 on page 2
**How to Test:**
```bash
GET /api/books/{id}/reviews?sortBy=helpful&page=1&limit=10
GET /api/books/{id}/reviews?sortBy=helpful&page=2&limit=10
# Verify no overlap, correct order
```
**Status:** ✅ Implemented with slice(offset, offset + limit)

---

## 6. Data Integrity Edge Cases

### 6.1 Delete Reading Entry with Helpful Marks
**Scenario:** Review has 10 helpful marks, entry gets deleted
**Expected:** Cascade delete removes all ReviewHelpful records
**How to Test:**
```sql
-- Verify cascade in schema
DELETE FROM "ReadingEntry" WHERE id = '...'
-- Check ReviewHelpful table
SELECT COUNT(*) FROM "ReviewHelpful" WHERE "readingEntryId" = '...'
-- Should be 0
```
**Status:** ✅ Schema has `onDelete: Cascade`

---

### 6.2 Delete User with Badges
**Scenario:** User has 5 badges, user account deleted
**Expected:** UserBadge records cascade delete
**How to Test:**
```sql
DELETE FROM "User" WHERE id = '...'
SELECT COUNT(*) FROM "UserBadge" WHERE "userId" = '...'
-- Should be 0
```
**Status:** ✅ Schema has `onDelete: Cascade`

---

### 6.3 Update Book Genres After Badge Earned
**Scenario:** User earned "Fiction Explorer", book genre changes from Fiction to Mystery
**Expected:** Badge persists (doesn't get removed)
**How to Test:**
```bash
# User has "Fiction Explorer" badge from reading 5 fiction books
# Update one book's genre
PATCH /api/books/{id} {"genres": ["Mystery"]}

# Badge should still exist
GET /api/user/badges
```
**Note:** Badges are immutable once earned (by design)

---

## 7. Performance Edge Cases

### 7.1 User with 1000+ Finished Books
**Scenario:** Power user with massive library
**Expected:** Badge check should complete in < 2 seconds
**How to Test:**
```bash
# Create user with 1000 finished books
# Time the badge check
time PATCH /api/reading-entries/{id} {"status": "FINISHED"}
# Monitor query performance in logs
```

---

### 7.2 Book with 500+ Reviews
**Scenario:** Popular book with many reviews
**Expected:** Review sorting (especially helpful) should complete in < 1 second
**How to Test:**
```bash
time GET /api/books/{id}/reviews?sortBy=helpful
# Check performance with in-memory sorting
```

---

## 8. Authentication Edge Cases

### 8.1 Expired Session Token
**Scenario:** User's session expires mid-request
**Expected:** 401 Unauthorized
**How to Test:**
```bash
# Use expired or invalid token
curl -X POST .../api/reviews/123/helpful \
  -H "Cookie: session=expired_token"
# Expected: 401
```

---

### 8.2 Missing User ID in Session
**Scenario:** Malformed session without userId
**Expected:** 401 Unauthorized
**How to Test:**
```bash
# Mock session without userId field
# Try authenticated endpoint
# Expected: 401
```

---

## Testing Checklist

### Critical Tests (Must Pass)
- [ ] Concurrent badge creation (no duplicates)
- [ ] Same-day multiple finishes (streak increments once)
- [ ] Own review marking (rejected)
- [ ] Duplicate helpful mark (rejected)
- [ ] Inactive challenge join (rejected)
- [ ] Timezone streak calculation (UTC consistent)

### Important Tests (Should Pass)
- [ ] Multiple milestone badges at once
- [ ] Review badge without review text
- [ ] Streak reset after gap
- [ ] First-ever reading streak creation
- [ ] Expired challenge filtering

### Nice-to-Have Tests
- [ ] Performance with 1000+ books
- [ ] Performance with 500+ reviews
- [ ] Cascade delete data integrity
- [ ] Tie-breaking in sorts

---

## Automated Test Script Ideas

```javascript
// Example: Test concurrent badge creation
async function testConcurrentBadges() {
  const user1 = await createUserWith4FinishedBooks()
  const user2 = await createUserWith4FinishedBooks()

  // Finish 5th book for both simultaneously
  await Promise.all([
    markAsFinished(user1.lastEntry),
    markAsFinished(user2.lastEntry)
  ])

  // Check badge count
  const badges = await prisma.badge.findMany({
    where: { name: 'Bookworm Beginner' }
  })

  assert(badges.length === 1, 'Should have exactly 1 badge')

  const userBadges = await prisma.userBadge.count({
    where: { badgeId: badges[0].id }
  })

  assert(userBadges === 2, 'Both users should have the badge')
}
```

---

## Notes

- All tests should be run in a staging environment first
- Use database transactions for test setup/teardown
- Monitor server logs for errors during tests
- Document any failures and fixes
- Run tests after any schema or logic changes

---

## Test Results Log

| Test Case | Date | Result | Notes |
|-----------|------|--------|-------|
| Concurrent badge creation | TBD | - | - |
| Same-day streak | TBD | - | - |
| Own review helpful | TBD | - | - |
| ... | ... | ... | ... |
