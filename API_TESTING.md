# Phase 3 Backend API Testing Guide

This guide provides instructions for testing all the new Phase 3 gamification features.

## Prerequisites
- You need to be logged in to test authenticated endpoints
- Have at least one book in your library
- Mark some books as "FINISHED" to test badge triggers

## 🎖️ Badge System APIs

### Get User Badges
**Endpoint:** `GET /api/user/badges`

**Test:**
```bash
# Should return array of earned badges
curl -X GET https://ebe.vercel.app/api/user/badges \
  -H "Cookie: your-session-cookie"
```

**Expected Response:**
```json
{
  "badges": [
    {
      "id": "badge_123",
      "userId": "user_123",
      "badgeId": "badge_milestone_5",
      "earnedAt": "2026-01-02T...",
      "badge": {
        "name": "Bookworm Beginner",
        "description": "Read 5 books",
        "type": "READING_MILESTONE",
        "points": 50
      }
    }
  ]
}
```

**Trigger Badge Earning:**
To test badge awarding, mark a book as FINISHED via the UI or API:
```bash
# Mark a reading entry as FINISHED
curl -X PATCH https://ebe.vercel.app/api/reading-entries/{entryId} \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"status": "FINISHED"}'
```

This should automatically:
- Check reading milestones (5, 10, 25, 50, 100 books)
- Check review milestones (if review exists)
- Check genre explorer badges
- Update reading streak

## 🔥 Reading Streak API

### Get User Streak
**Endpoint:** `GET /api/user/streak`

**Test:**
```bash
curl -X GET https://ebe.vercel.app/api/user/streak \
  -H "Cookie: your-session-cookie"
```

**Expected Response:**
```json
{
  "streak": {
    "id": "streak_123",
    "userId": "user_123",
    "currentStreak": 7,
    "longestStreak": 15,
    "lastReadDate": "2026-01-02T00:00:00.000Z",
    "createdAt": "2026-01-01T...",
    "updatedAt": "2026-01-02T..."
  }
}
```

**Notes:**
- Streak updates automatically when you mark a book as FINISHED
- Consecutive days increase the streak
- Missing a day resets current streak to 1
- Longest streak is preserved

## 🏆 Challenges APIs

### Get All Active Challenges
**Endpoint:** `GET /api/challenges`

**Test:**
```bash
curl -X GET https://ebe.vercel.app/api/challenges
```

**Expected Response:**
```json
{
  "challenges": [
    {
      "id": "challenge_123",
      "name": "January Reading Sprint",
      "description": "Read 5 books this month",
      "type": "monthly",
      "targetValue": 5,
      "startDate": "2026-01-01T...",
      "endDate": "2026-01-31T...",
      "isActive": true
    }
  ]
}
```

### Get User's Challenges
**Endpoint:** `GET /api/challenges/user`

**Test:**
```bash
curl -X GET https://ebe.vercel.app/api/challenges/user \
  -H "Cookie: your-session-cookie"
```

**Expected Response:**
```json
{
  "userChallenges": [
    {
      "id": "uc_123",
      "userId": "user_123",
      "challengeId": "challenge_123",
      "currentValue": 2,
      "isCompleted": false,
      "completedAt": null,
      "joinedAt": "2026-01-01T...",
      "challenge": {
        "name": "January Reading Sprint",
        "targetValue": 5,
        ...
      }
    }
  ]
}
```

### Join a Challenge
**Endpoint:** `POST /api/challenges/user`

**Test:**
```bash
curl -X POST https://ebe.vercel.app/api/challenges/user \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"challengeId": "challenge_123"}'
```

**Expected Response:**
```json
{
  "userChallenge": {
    "id": "uc_456",
    "userId": "user_123",
    "challengeId": "challenge_123",
    "currentValue": 0,
    "isCompleted": false,
    "joinedAt": "2026-01-02T...",
    "challenge": {...}
  }
}
```

## 👍 Review Helpful APIs

### Mark Review as Helpful
**Endpoint:** `POST /api/reviews/{readingEntryId}/helpful`

**Test:**
```bash
curl -X POST https://ebe.vercel.app/api/reviews/{readingEntryId}/helpful \
  -H "Cookie: your-session-cookie"
```

**Expected Response:**
```json
{
  "helpfulCount": 5
}
```

**Validation:**
- Cannot mark your own review as helpful
- Can only mark once per review
- Reading entry must have a review or rating

### Remove Helpful Mark
**Endpoint:** `DELETE /api/reviews/{readingEntryId}/helpful`

**Test:**
```bash
curl -X DELETE https://ebe.vercel.app/api/reviews/{readingEntryId}/helpful \
  -H "Cookie: your-session-cookie"
```

**Expected Response:**
```json
{
  "helpfulCount": 4
}
```

## 📚 Enhanced Reviews API (with sorting)

### Get Book Reviews with Sorting
**Endpoint:** `GET /api/books/{bookId}/reviews?sortBy={sortType}`

**Sort Options:**
- `recent` (default) - Most recent first
- `helpful` - Most helpful first
- `highest` - Highest rated first
- `lowest` - Lowest rated first

**Test Recent (default):**
```bash
curl -X GET "https://ebe.vercel.app/api/books/{bookId}/reviews"
```

**Test Most Helpful:**
```bash
curl -X GET "https://ebe.vercel.app/api/books/{bookId}/reviews?sortBy=helpful"
```

**Test Highest Rated:**
```bash
curl -X GET "https://ebe.vercel.app/api/books/{bookId}/reviews?sortBy=highest"
```

**Expected Response:**
```json
{
  "reviews": [
    {
      "id": "entry_123",
      "rating": 8.5,
      "review": "Great book!",
      "createdAt": "2026-01-02T...",
      "helpfulCount": 12,
      "user": {
        "id": "user_456",
        "username": "booklover",
        "name": "Book Lover",
        "avatar": null
      }
    }
  ],
  "hasMore": true,
  "page": 1
}
```

## 🧪 Testing Workflow

### Complete Testing Sequence:

1. **Test Initial State:**
   ```bash
   # Check badges (should be empty or have early adopter)
   GET /api/user/badges

   # Check streak (might not exist yet)
   GET /api/user/streak
   ```

2. **Mark Books as Finished:**
   ```bash
   # Mark 5+ books as FINISHED to trigger milestone badge
   PATCH /api/reading-entries/{id}
   body: {"status": "FINISHED"}
   ```

3. **Verify Badges Awarded:**
   ```bash
   # Should now show reading milestone badges
   GET /api/user/badges
   ```

4. **Verify Streak Created:**
   ```bash
   # Should show currentStreak: 1, longestStreak: 1
   GET /api/user/streak
   ```

5. **Add Reviews:**
   ```bash
   # Add reviews to 5+ finished books
   PATCH /api/reading-entries/{id}
   body: {"status": "FINISHED", "rating": 8.5, "review": "Great book!"}
   ```

6. **Verify Review Badges:**
   ```bash
   # Should show review master badges
   GET /api/user/badges
   ```

7. **Test Review Helpful:**
   ```bash
   # Mark someone else's review as helpful
   POST /api/reviews/{entryId}/helpful

   # Verify count in reviews list
   GET /api/books/{bookId}/reviews?sortBy=helpful
   ```

8. **Test Challenges:**
   ```bash
   # Get available challenges
   GET /api/challenges

   # Join a challenge
   POST /api/challenges/user
   body: {"challengeId": "..."}

   # Check progress
   GET /api/challenges/user
   ```

## 🐛 Known Edge Cases to Test

1. **Same Day Reading:** Marking multiple books as finished on the same day should not increase streak multiple times
2. **Own Review:** Trying to mark your own review as helpful should return error
3. **Duplicate Helpful:** Marking the same review helpful twice should return error
4. **Genre Badge:** Reading 5+ books in same genre should award genre explorer badge
5. **Streak Reset:** Not reading for 2+ days should reset current streak to 1 but preserve longest streak

## ✅ Success Criteria

- ✅ Badges automatically awarded when milestones reached
- ✅ Streaks update on consecutive reading days
- ✅ Reviews can be sorted by helpful/rating/date
- ✅ Users can mark reviews helpful
- ✅ Challenges track progress correctly
- ✅ No duplicate badges awarded
- ✅ Error handling works for edge cases

## 📊 Testing Checklist

- [ ] Mark 5 books as finished → Check for "Bookworm Beginner" badge
- [ ] Write 5 reviews → Check for "Reviewer Rookie" badge
- [ ] Read 5 books in same genre → Check for "{Genre} Explorer" badge
- [ ] Mark books finished on consecutive days → Check streak increases
- [ ] Sort reviews by helpful/highest/lowest → Verify order
- [ ] Mark review as helpful → Verify count increases
- [ ] Join a challenge → Verify appears in user challenges
- [ ] Try marking own review helpful → Verify error
- [ ] Try duplicate helpful mark → Verify error
- [ ] Check API response times → Should be < 1s
