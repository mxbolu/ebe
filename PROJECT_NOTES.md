# EBE - Reading Journal App

## Project Overview
**ebe** is a personal reading journal application where users can:
- Track every book they've read
- Discover new reads
- Share their reading journey

Think Goodreads/StoryGraph but with a personal touch.

---

## Tech Stack
- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL (Prisma Postgres local)
- **ORM**: Prisma 7.2.0
- **UI Components**: lucide-react, class-variance-authority, tailwindcss-animate

---

## Project Structure
```
ebe/
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── layout.tsx    # Root layout
│   │   ├── page.tsx      # Landing page
│   │   └── globals.css   # Global styles
│   ├── components/       # Reusable UI components (empty)
│   ├── lib/              # Utility functions
│   └── styles/           # Additional styles
├── server/               # Backend logic (empty)
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   └── services/
├── prisma/
│   └── schema.prisma     # Database schema (minimal setup)
└── package.json
```

---

## Current Status

### ✅ Completed
- [x] Next.js project initialized
- [x] Dependencies installed (React, Prisma, Tailwind)
- [x] Basic landing page created
- [x] Prisma configuration set up
- [x] Local PostgreSQL database configured
- [x] Complete database schema defined

### ⏳ To Do
- [ ] Set up cloud storage for book cover uploads
- [ ] Run Prisma migrations
- [ ] Set up authentication system with role-based access control
- [ ] Create API routes (book submission, admin moderation)
- [ ] Build core UI components
- [ ] Implement book submission workflow
- [ ] Build admin dashboard
- [ ] Implement gamification system

---

## Conversation Log

### Session 1 - January 1, 2026
**Initial Project Assessment & Feature Planning**

**What we discovered:**
- Project has basic Next.js setup with TypeScript
- Prisma ORM configured but schema is empty
- Server directory structure exists but files are empty
- Components directory is empty
- Local Prisma Postgres database is configured

**Project Goal Confirmed:**
Building "ebe" - a reading journal app for tracking books, discovering new reads, and sharing reading journeys.

---

**Key Feature: User-Generated Book Submissions**

Users can submit books that aren't in the database. Key requirements:
- **Required fields**: Title and Author(s)
- **Optional**: Cover image upload, ISBN, description, etc.
- **Cover uploads**: Direct upload to cloud storage, 10MB max file size
- **Duplicate prevention**: Check for similar books before submission
- **Auto-suggest**: Show similar existing books if title/author matches
- **Moderation**: All submissions require admin/moderator approval
- **Attribution**: Users can opt-in/out of credit for submissions
- **Gamification**: Points, badges, and leaderboards for contributors

**Role-Based Access Control:**
- **USER**: Regular users (default)
- **MODERATOR**: Can review and approve submissions
- **ADMIN**: Full access to moderate and manage users
- **SUPER_ADMIN**: Ultimate authority

**Book Edit Suggestions:**
- Users can suggest edits to existing books
- All edits reviewed by admin/moderator before applying
- Tracks what field was changed and why

**Gamification System:**
- Points for: submitting books, approved submissions, writing reviews, reading books
- Badges for achievements (contributor badges, reading milestones, etc.)
- Leaderboard for top contributors
- User levels based on total points

---

## Database Schema

### Core Models

**User Model**
- Authentication: email, password, username
- Profile: name, avatar, bio
- Role: USER, MODERATOR, ADMIN, SUPER_ADMIN
- Privacy: showContributions (opt-in/out of attribution)
- Relations: reading entries, shelves, submissions, badges, stats

**Book Model**
- Core data: title, authors[], ISBN, cover, description
- Metadata: publishedYear, genres[], pageCount, publisher, language
- Attribution: addedBy, approvedBy, source (USER_SUBMITTED/API_IMPORT/ADMIN_ADDED)
- Stats: timesAddedToShelves, averageRating, totalRatings

**BookSubmission Model**
- All book fields (pending approval)
- submissionNotes from user
- Status: PENDING, APPROVED, REJECTED
- reviewNotes from admin
- Timestamps: submittedAt, reviewedAt

**BookEditSuggestion Model**
- Target: bookId, field name
- Values: currentValue, suggestedValue
- Context: reason for change
- Status: PENDING, APPROVED, REJECTED
- Review: reviewedBy, reviewNotes

**ReadingEntry Model**
- Link: userId, bookId (unique together)
- Status: WANT_TO_READ, CURRENTLY_READING, FINISHED, DID_NOT_FINISH
- Timeline: startDate, finishDate
- Feedback: rating (1-5), review, notes
- Flags: isFavorite, isPrivate

**ReadingProgress Model**
- Link: readingEntryId (one-to-one)
- Progress: currentPage, totalPages, progressPercentage
- Updated: lastUpdated timestamp

**Shelf Model**
- Ownership: userId
- Details: name, description
- Privacy: isPublic flag
- Many-to-many with Books via ShelfBook

**GamificationStats Model**
- Contributions: booksSubmitted, booksApproved, editsSubmitted, editsApproved
- Reading: booksRead, pagesRead, reviewsWritten
- Progress: totalPoints, level

**Badge & UserBadge Models**
- Badge types: BOOK_CONTRIBUTOR, EDIT_CONTRIBUTOR, READING_MILESTONE, REVIEW_MASTER, EARLY_ADOPTER
- Criteria stored as JSON
- UserBadge tracks when earned (unique per user per badge)

---

## Environment Variables
Current `.env` setup:
- `DATABASE_URL`: Prisma Postgres local connection (port 51213/51214)

---

## Notes & Decisions
- Project name "ebe" - meaning/acronym TBD
- Detailed features to be discussed in future sessions
- Focus on core functionality first, then expand to social features

---

## Resources & Links
- [Prisma Documentation](https://pris.ly/d/prisma-schema)
- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)

---

*Last Updated: January 1, 2026*
