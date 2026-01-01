# Implementation Roadmap - ebe Reading Journal

Based on the user journeys provided, here's a prioritized implementation plan.

---

## Current Status

### ✅ Already Implemented
- [x] User signup with email verification
- [x] Login with email/username
- [x] Password reset flow
- [x] Basic dashboard
- [x] Book search (hybrid: database + external APIs)
- [x] Add books to reading list (Want to Read, Currently Reading, Finished)
- [x] View reading lists with filtering
- [x] Basic reading statistics
- [x] Remove books from lists
- [x] Favorite books

### 🚧 Partially Implemented
- [ ] User profiles (data model exists, no UI)
- [ ] Book ratings (can add, but limited UI)
- [ ] Reviews (can add via API, no dedicated UI)
- [ ] Book submissions (data model exists, no workflow)
- [ ] Shelves (data model exists, no implementation)
- [ ] Badges/achievements (data model exists, no logic)

### ❌ Not Implemented
- [ ] SSO (Google, Apple)
- [ ] Import from Goodreads
- [ ] Edit reading entries
- [ ] Book detail pages
- [ ] Decimal ratings (1.0-10.0)
- [ ] Discussion threads
- [ ] Book clubs
- [ ] Discovery features
- [ ] Profile visibility controls
- [ ] Export data

---

## Implementation Phases

## PHASE 1: Complete Core Book Management (Week 1)
**Priority: CRITICAL - Foundation for everything else**

### 1.1 Edit Reading Entries ⭐ HIGHEST PRIORITY
**Journey**: 2.1 Search and Log a Book (enhancement)

**What to Build:**
- Edit modal/page for reading entries
- Update status (Want to Read → Currently Reading → Finished)
- Change rating (currently limited, make it better)
- Edit review text
- Update start/finish dates
- Update current page for progress tracking
- Toggle favorite status
- Set public/private visibility

**Files to Create/Update:**
- `src/components/EditReadingEntryModal.tsx` (new)
- `src/components/ReadingEntryCard.tsx` (update - add edit button)
- `src/app/api/reading-entries/[id]/route.ts` (already exists, verify PATCH)

**Implementation Steps:**
1. Create edit modal component with form
2. Add validation (Zod schemas)
3. Wire up to PATCH API endpoint
4. Add to ReadingEntryCard component
5. Test all field updates

**Time Estimate:** 3-4 hours

---

### 1.2 Book Detail Pages ⭐ HIGH PRIORITY
**Journey**: 2.1 Search and Log a Book (enhancement)

**What to Build:**
- Dedicated page for each book: `/books/[id]`
- Display full book information
- Show community ratings/reviews
- Add/edit your reading entry inline
- Quick actions (Add to List, Mark as Finished, etc.)
- Related books section
- Share book functionality

**Files to Create:**
- `src/app/books/[id]/page.tsx` (new)
- `src/components/BookDetail.tsx` (new)
- `src/components/CommunityRatings.tsx` (new)
- `src/components/RelatedBooks.tsx` (new)

**Implementation Steps:**
1. Create dynamic route for books
2. Fetch book details via existing API
3. Display comprehensive book info
4. Add quick action buttons
5. Show user's entry if exists
6. Add related books logic

**Time Estimate:** 3-4 hours

---

### 1.3 Decimal Rating System (1.0-10.0) ⭐ MEDIUM PRIORITY
**Journey**: 2.3 Rate a Book

**What to Build:**
- Update rating UI to support 1.0-10.0 scale with decimal precision
- Slider with snap points (1.0, 1.5, 2.0, etc.) OR direct number input
- Visual representation (star icons + decimal)
- Show community average vs user rating
- Update database schema if needed

**Database Changes:**
```sql
-- Already using Decimal in Prisma schema, verify precision
-- rating Decimal? @db.Decimal(3, 1)
-- This supports 1.0 to 10.0 with one decimal place
```

**Files to Update:**
- `src/components/RatingInput.tsx` (new)
- `src/components/EditReadingEntryModal.tsx` (use RatingInput)
- `src/components/BookCard.tsx` (display decimal ratings)
- `src/app/api/reading-entries/route.ts` (validate decimal range)

**Implementation Steps:**
1. Create RatingInput component (slider + number)
2. Validate range: 1.0 ≤ rating ≤ 10.0
3. Update all rating displays
4. Test decimal precision in DB

**Time Estimate:** 2-3 hours

---

### 1.4 Submit Missing Books ⭐ MEDIUM PRIORITY
**Journey**: 2.2 Submit a Missing Book

**What to Build:**
- "Can't find your book?" flow
- Book submission form with fields:
  - Title (required)
  - Author(s) (required)
  - ISBN (optional, auto-populate if provided)
  - Publisher, year, cover image (optional)
  - Genre/category
- Admin vetting workflow
- User notification when approved
- Track pending submissions

**Files to Create:**
- `src/app/submit-book/page.tsx` (new)
- `src/components/BookSubmissionForm.tsx` (new)
- `src/app/api/books/submit/route.ts` (new)
- `src/app/api/admin/book-submissions/route.ts` (new - admin only)

**Database:**
- BookSubmission model already exists
- Add notification system for approval

**Implementation Steps:**
1. Create submission form UI
2. API endpoint for submissions
3. ISBN lookup integration (optional)
4. Admin review interface
5. Approval workflow
6. User notifications

**Time Estimate:** 4-5 hours

---

## PHASE 2: Reviews & Social Features (Week 2)

### 2.1 Write and Display Reviews ⭐ HIGH PRIORITY
**Journey**: 3.1 Write a Book Review

**What to Build:**
- Dedicated review writing interface
- Rich text editor (optional formatting)
- Spoiler tags
- Recommend yes/no
- Public/private toggle
- Display reviews on:
  - Book detail pages
  - User profiles
  - Dashboard activity

**Files to Create:**
- `src/components/WriteReviewModal.tsx` (new)
- `src/components/ReviewCard.tsx` (new)
- `src/components/ReviewList.tsx` (new)
- `src/app/api/reviews/route.ts` (new, or enhance reading-entries)

**Implementation Steps:**
1. Create review writing modal
2. Add spoiler warning UI
3. Display reviews on book pages
4. Show in user activity
5. Add helpful votes (optional)

**Time Estimate:** 4-5 hours

---

### 2.2 User Profiles ⭐ HIGH PRIORITY
**Journey**: 4.2 Manage Profile Visibility

**What to Build:**
- Public profile pages: `/users/[username]`
- Profile editing: avatar upload, bio, display name
- Privacy controls:
  - Profile visibility (private/followers/public)
  - Show/hide current reads
  - Show/hide ratings and reviews
  - Show/hide library
- Reading statistics display
- Recent activity timeline

**Files to Create:**
- `src/app/users/[username]/page.tsx` (new)
- `src/app/settings/profile/page.tsx` (new)
- `src/app/settings/privacy/page.tsx` (new)
- `src/components/UserProfile.tsx` (new)
- `src/components/UserStats.tsx` (new)
- `src/app/api/users/[username]/route.ts` (new)
- `src/app/api/users/me/profile/route.ts` (new)

**Implementation Steps:**
1. Create user profile page
2. Add avatar upload (Cloudinary/Vercel Blob)
3. Build privacy settings UI
4. Implement visibility logic in API
5. Add reading stats display
6. Create activity timeline

**Time Estimate:** 6-8 hours

---

### 2.3 Discussion Threads ⭐ MEDIUM PRIORITY
**Journey**: 3.2 Start a Chapter/Topic Discussion Thread, 3.3 Participate in a Discussion

**Database Schema Needed:**
```prisma
model Discussion {
  id              String   @id @default(cuid())
  bookId          String
  book            Book     @relation(fields: [bookId], references: [id], onDelete: Cascade)
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title           String
  content         String   @db.Text
  chapterReference String?
  spoilerScope    String?  // "None", "Chapter 5", "Full book", etc.
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  replies         DiscussionReply[]
}

model DiscussionReply {
  id            String   @id @default(cuid())
  discussionId  String
  discussion    Discussion @relation(fields: [discussionId], references: [id], onDelete: Cascade)
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  content       String   @db.Text
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

**What to Build:**
- Discussion tab on book detail pages
- "Start Discussion" interface
- Thread view with spoiler warnings
- Reply functionality
- Sort/filter discussions by chapter

**Files to Create:**
- Migration: `prisma/migrations/add_discussions.sql`
- `src/components/DiscussionList.tsx` (new)
- `src/components/DiscussionThread.tsx` (new)
- `src/components/StartDiscussionModal.tsx` (new)
- `src/app/api/discussions/route.ts` (new)
- `src/app/api/discussions/[id]/replies/route.ts` (new)

**Time Estimate:** 5-6 hours

---

### 2.4 Find and Follow Users ⭐ LOW PRIORITY
**Journey**: 4.1 Find Other Users

**Database Schema Needed:**
```prisma
model Follow {
  id          String   @id @default(cuid())
  followerId  String
  follower    User     @relation("Following", fields: [followerId], references: [id], onDelete: Cascade)
  followingId String
  following   User     @relation("Followers", fields: [followingId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())

  @@unique([followerId, followingId])
  @@index([followerId])
  @@index([followingId])
}
```

**What to Build:**
- User discovery page
- Search users by username
- Browse by reading interests
- Follow/unfollow functionality
- Followers/following lists
- Reading compatibility score

**Time Estimate:** 4-5 hours

---

## PHASE 3: Book Clubs (Week 3)

### 3.1 Create and Manage Book Clubs ⭐ HIGH PRIORITY
**Journeys**: 5.1 Create a Book Club, 5.2 Invite Members, 5.3 Set Current Book Club Read

**Database Schema Needed:**
```prisma
model BookClub {
  id          String   @id @default(cuid())
  name        String
  description String?  @db.Text
  coverImage  String?
  privacy     String   @default("PUBLIC") // PUBLIC, PRIVATE, INVITE_ONLY
  genreFocus  String?
  createdById String
  createdBy   User     @relation(fields: [createdById], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  members     BookClubMember[]
  reads       BookClubRead[]
  meetings    BookClubMeeting[]
}

model BookClubMember {
  id         String   @id @default(cuid())
  clubId     String
  club       BookClub @relation(fields: [clubId], references: [id], onDelete: Cascade)
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role       String   @default("MEMBER") // ADMIN, MODERATOR, MEMBER
  joinedAt   DateTime @default(now())

  @@unique([clubId, userId])
  @@index([clubId])
  @@index([userId])
}

model BookClubRead {
  id            String   @id @default(cuid())
  clubId        String
  club          BookClub @relation(fields: [clubId], references: [id], onDelete: Cascade)
  bookId        String
  book          Book     @relation(fields: [bookId], references: [id])
  startDate     DateTime?
  endDate       DateTime?
  schedule      String?  @db.Text // JSON with chapter milestones
  isCurrent     Boolean  @default(false)
  createdAt     DateTime @default(now())

  @@index([clubId])
  @@index([bookId])
}

model BookClubMeeting {
  id          String   @id @default(cuid())
  clubId      String
  club        BookClub @relation(fields: [clubId], references: [id], onDelete: Cascade)
  title       String
  description String?  @db.Text
  scheduledAt DateTime
  duration    Int      // minutes
  meetingUrl  String?
  relatedBookId String?
  relatedBook Book?    @relation(fields: [relatedBookId], references: [id])
  createdById String
  createdBy   User     @relation(fields: [createdById], references: [id])
  createdAt   DateTime @default(now())

  @@index([clubId])
  @@index([scheduledAt])
}
```

**What to Build:**
- Create book club flow
- Club management dashboard (admin)
- Member invitation system (search, link, email)
- Set current read with schedule
- Member roster
- Club discovery/browse

**Files to Create:**
- Migration: `prisma/migrations/add_book_clubs.sql`
- `src/app/clubs/page.tsx` (browse clubs)
- `src/app/clubs/[id]/page.tsx` (club detail)
- `src/app/clubs/create/page.tsx` (create club)
- `src/components/BookClubCard.tsx`
- `src/components/BookClubMembers.tsx`
- `src/components/SetCurrentReadModal.tsx`
- `src/app/api/clubs/route.ts`
- `src/app/api/clubs/[id]/route.ts`
- `src/app/api/clubs/[id]/members/route.ts`
- `src/app/api/clubs/[id]/reads/route.ts`

**Time Estimate:** 8-10 hours

---

### 3.2 Schedule Virtual Meetings ⭐ MEDIUM PRIORITY
**Journeys**: 5.4 Schedule a Virtual Meeting, 5.5 Join a Virtual Meeting

**What to Build:**
- Meeting scheduling interface
- Calendar integration (Google Calendar, Apple Calendar)
- Timezone handling
- Meeting reminders/notifications
- Meeting join flow
- Integration options:
  - External: Zoom, Google Meet (link only)
  - OR In-app: Jitsi Meet embed (future)

**Files to Create:**
- `src/components/ScheduleMeetingModal.tsx`
- `src/components/MeetingCard.tsx`
- `src/app/api/clubs/[id]/meetings/route.ts`
- `src/lib/calendar.ts` (iCal generation)

**Time Estimate:** 4-5 hours

---

## PHASE 4: Import/Export & Data Management (Week 4)

### 4.1 Goodreads Import ⭐ HIGH PRIORITY
**Journey**: 1.2 Import Reading History

**What to Build:**
- Import wizard UI
- File upload (CSV)
- Parse Goodreads export format
- Match books to database
- Handle unmatched books (submit for review)
- Show import progress
- Review and confirm import
- Background job processing for large imports

**Files to Create:**
- `src/app/settings/import/page.tsx` (new)
- `src/components/ImportWizard.tsx` (new)
- `src/app/api/import/goodreads/route.ts` (new)
- `src/lib/import/goodreads-parser.ts` (new)
- `src/lib/import/book-matcher.ts` (new)

**Implementation Steps:**
1. Create import wizard UI
2. Parse CSV (handle Goodreads format)
3. Match books by ISBN/title+author
4. Handle rating conversion
5. Batch create reading entries
6. Show progress (use job queue for large imports)

**Time Estimate:** 6-8 hours

---

### 4.2 Data Export ⭐ MEDIUM PRIORITY

**What to Build:**
- Export wizard
- Format options: CSV, JSON, PDF
- Export scope: all books, specific shelf, date range
- Download generated files

**Files to Create:**
- `src/app/settings/export/page.tsx` (new)
- `src/app/api/export/route.ts` (new)
- `src/lib/export/csv-generator.ts` (new)
- `src/lib/export/json-generator.ts` (new)

**Time Estimate:** 3-4 hours

---

## PHASE 5: SSO & Enhanced Onboarding (Week 5)

### 5.1 Google & Apple SSO ⭐ MEDIUM PRIORITY
**Journey**: 1.1 New User Signup (enhancement)

**What to Build:**
- Google OAuth integration
- Apple Sign In integration
- Link/unlink SSO providers
- Handle account merging (email conflicts)

**Libraries:**
- NextAuth.js or custom OAuth implementation
- Google OAuth2
- Apple Sign In

**Files to Create/Update:**
- `src/app/api/auth/[...nextauth]/route.ts` (if using NextAuth)
- OR `src/app/api/auth/google/route.ts` (custom)
- OR `src/app/api/auth/apple/route.ts` (custom)
- Update User model to include `provider` and `providerId`

**Time Estimate:** 5-6 hours

---

### 5.2 Onboarding Flow ⭐ LOW PRIORITY
**Journey**: 1.1 New User Signup (enhancement)

**What to Build:**
- Welcome screen after signup
- Reading preferences survey (genres, favorite authors)
- Profile setup (name, avatar, bio)
- Optional import prompt
- Skip functionality

**Files to Create:**
- `src/app/onboarding/page.tsx` (new)
- `src/components/OnboardingSteps.tsx` (new)

**Time Estimate:** 3-4 hours

---

## PHASE 6: Discovery & Recommendations (Week 6)

### 6.1 Browse by Genre
**What to Build:**
- Genre taxonomy/listing
- Genre detail pages
- Filter books by genre
- Popular books per genre

**Time Estimate:** 3-4 hours

---

### 6.2 Trending & Popular
**What to Build:**
- Most added this week
- Highest rated this month
- Popular on platform

**Time Estimate:** 2-3 hours

---

### 6.3 Recommendations Engine
**What to Build:**
- Basic collaborative filtering
- Genre-based suggestions
- "Readers like you also enjoyed..."

**Time Estimate:** 6-8 hours

---

## Summary Timeline

| Phase | Duration | Priority | Features |
|-------|----------|----------|----------|
| Phase 1: Core Book Management | Week 1 | CRITICAL | Edit entries, book details, ratings, submissions |
| Phase 2: Reviews & Social | Week 2 | HIGH | Reviews, profiles, discussions, following |
| Phase 3: Book Clubs | Week 3 | HIGH | Clubs, members, meetings |
| Phase 4: Import/Export | Week 4 | HIGH | Goodreads import, data export |
| Phase 5: SSO & Onboarding | Week 5 | MEDIUM | Google/Apple login, onboarding |
| Phase 6: Discovery | Week 6 | MEDIUM | Genres, trending, recommendations |

**Total Estimated Time: 6 weeks of focused development**

---

## Immediate Next Steps

**Which phase would you like to start with?**

I recommend:

### Option A: Phase 1 - Core Book Management (RECOMMENDED)
Start with editing reading entries and book detail pages. This completes the core user experience.

### Option B: Phase 3 - Book Clubs
Jump straight to book clubs if that's your differentiator and highest priority social feature.

### Option C: Phase 4 - Import/Export
If you have existing users or want to attract Goodreads migrants, start here.

Let me know which phase to begin, and I'll start implementing!
