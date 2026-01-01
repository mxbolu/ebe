# EBE - Reading Journal App

## Project Overview
**ebe** is a personal reading journal application where users can:
- Track every book they've read
- Discover new reads from a catalog of 90,000+ books
- Share their reading journey
- Manage custom shelves and reading lists

Think Goodreads/StoryGraph but with a personal touch.

---

## Tech Stack
- **Frontend**: Next.js 16.1.1, React 19.2.3, TypeScript 5.9.3
- **Styling**: Tailwind CSS v3.4.19 (downgraded from v4 for compatibility)
- **Database**: PostgreSQL (Prisma Postgres local dev, Neon production)
- **ORM**: Prisma 7.2.0 with @prisma/adapter-pg
- **Authentication**: JWT with bcryptjs password hashing
- **Email Service**: nodemailer with OTP-based verification
- **Deployment**: Vercel (frontend + API), Neon PostgreSQL (database)
- **External APIs**: Open Library, Google Books (for book search and import)

---

## Project Structure
```
ebe/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/              # Authentication endpoints
│   │   │   │   ├── register/      # User signup with email verification
│   │   │   │   ├── login/         # Login with JWT
│   │   │   │   ├── logout/        # Clear session
│   │   │   │   ├── me/            # Get current user
│   │   │   │   ├── verify-email/  # Email OTP verification
│   │   │   │   ├── resend-verification/ # Resend OTP
│   │   │   │   ├── forgot-password/ # Password reset request
│   │   │   │   └── reset-password/  # Password reset with OTP
│   │   │   ├── books/
│   │   │   │   ├── search/        # Hybrid book search (DB + APIs)
│   │   │   │   └── [id]/          # Single book details
│   │   │   └── reading-entries/
│   │   │       ├── route.ts       # List/Create entries
│   │   │       ├── [id]/          # Get/Update/Delete entry
│   │   │       └── stats/         # User reading statistics
│   │   ├── signup/                # Signup page
│   │   ├── login/                 # Login page with forgot password link
│   │   ├── verify-email/          # Email verification page
│   │   ├── forgot-password/       # Password reset request page
│   │   ├── reset-password/        # Password reset form
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # Landing page with CTA
│   │   └── globals.css            # Tailwind directives
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── password.ts        # bcrypt hashing & validation
│   │   │   ├── jwt.ts             # Token generation & verification
│   │   │   └── middleware.ts      # Request authentication
│   │   ├── email/
│   │   │   └── service.ts         # Nodemailer + OTP templates
│   │   ├── utils/
│   │   │   └── cacheSearchResults.ts # Background book caching
│   │   └── prisma.ts              # Prisma client with pg adapter
├── prisma/
│   ├── schema.prisma              # Database schema
│   └── migrations/                # Migration history
├── scripts/
│   ├── import-openlibrary.mjs     # Import 90K books from Open Library
│   └── test-db-connection.mjs     # Test database connectivity
└── package.json
```

---

## Current Status

### ✅ Completed Features

#### Authentication & Security
- [x] User registration with full name, email, username, password
- [x] Password strength validation (8+ chars, uppercase, lowercase, number)
- [x] Email verification with 6-digit OTP (15-min expiry)
- [x] Login with email or username
- [x] JWT-based sessions with HTTP-only cookies
- [x] Forgot password flow with OTP
- [x] Password reset functionality
- [x] Beautiful email templates for verification and reset
- [x] Resend verification code option

#### Book Management
- [x] Imported 90,000+ books from Open Library to production database
- [x] Smart hybrid book search (database first, then external APIs)
- [x] Background caching of search results with quality filtering
- [x] Book details API endpoint
- [x] External API integration (Open Library, Google Books)
- [x] ISBN and external ID tracking (openLibraryId, googleBooksId)

#### Reading Journal
- [x] Create reading entries (status REQUIRED, other fields optional)
- [x] Update reading entries (flexible field updates)
- [x] Delete reading entries (with cascade)
- [x] List entries with advanced filtering (status, favorite, rating)
- [x] Sort entries (by date, rating, title)
- [x] Reading statistics endpoint (total books, by status, favorites, avg rating)
- [x] Privacy controls (isPrivate, isFavorite flags)
- [x] Removed reading progress tracking (simplified for v1)

#### UI Pages
- [x] Landing page with gradient hero and CTA buttons
- [x] Signup page with inline validation
- [x] Login page with forgot password link
- [x] Email verification page with OTP input and resend
- [x] Forgot password page
- [x] Reset password page with OTP and new password
- [x] Responsive design with Tailwind CSS
- [x] Production deployment on Vercel (https://ebe-ruby.vercel.app)

#### Database & Infrastructure
- [x] Complete Prisma schema with all models
- [x] Prisma 7 adapter pattern for PostgreSQL
- [x] Database migrations system
- [x] Local dev environment (Prisma Postgres)
- [x] Production environment (Neon PostgreSQL)
- [x] Vercel deployment with automatic GitHub integration

### ⏳ In Progress / To Do

#### High Priority
- [ ] User dashboard (homepage after login)
- [ ] Book details page (full book information)
- [ ] Create reading entry UI
- [ ] Reading journal list view
- [ ] User profile page
- [ ] Email SMTP configuration for production

#### Medium Priority
- [ ] Custom shelves UI
- [ ] Book submission workflow UI
- [ ] Admin moderation dashboard
- [ ] Edit suggestions UI
- [ ] Search results page

#### Low Priority / Future
- [ ] Gamification system UI (badges, points, leaderboard)
- [ ] Social features (follow users, share reviews)
- [ ] Advanced analytics and insights
- [ ] Mobile app (React Native)
- [ ] Cloud storage for book cover uploads

---

## Database Schema

### User Model
**Authentication**
- email (unique), password (hashed), username (unique)
- name (required), avatar, bio
- role: USER, MODERATOR, ADMIN, SUPER_ADMIN

**Email Verification (NEW)**
- isEmailVerified (boolean, default: false)
- verificationOTP (6-digit code)
- verificationOTPExpiry (DateTime)

**Password Reset (NEW)**
- resetOTP (6-digit code)
- resetOTPExpiry (DateTime)

**Other**
- showContributions (opt-in/out of attribution)
- Relations: reading entries, shelves, submissions, badges, stats

### Book Model
- Core: title, authors[], isbn, coverImageUrl, description
- Metadata: publishedYear, genres[], pageCount, publisher, language
- External IDs: openLibraryId, googleBooksId, goodreadsId
- Attribution: addedBy, approvedBy, source (USER_SUBMITTED, API_IMPORT, CACHED_FROM_SEARCH)
- Stats: timesAddedToShelves, averageRating, totalRatings

### ReadingEntry Model
- userId, bookId (unique together - one entry per user per book)
- status: WANT_TO_READ, CURRENTLY_READING, FINISHED, DID_NOT_FINISH (REQUIRED)
- startDate, finishDate (optional)
- rating (1-5), review, notes (all optional)
- isFavorite, isPrivate flags

### Other Models
- BookSubmission - Community book submissions (pending approval)
- BookEditSuggestion - Crowdsourced book improvements
- Shelf & ShelfBook - Custom collections
- ReadingProgress - Page-by-page tracking (disabled in v1)
- GamificationStats & Badge - Engagement features
- ImportJob - Track bulk import operations

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account (sends verification email)
- `POST /api/auth/login` - Login with email/username + password
- `POST /api/auth/logout` - Clear session cookie
- `GET /api/auth/me` - Get current user info (requires auth)
- `POST /api/auth/verify-email` - Verify email with OTP
- `POST /api/auth/resend-verification` - Resend verification OTP
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with OTP

### Books
- `GET /api/books/search?q={query}` - Search books (hybrid: DB first, then APIs)
- `GET /api/books/[id]` - Get single book details

### Reading Entries (all require authentication)
- `GET /api/reading-entries` - List entries with filtering and sorting
  - Query params: status, isFavorite, hasRating, sortBy, sortOrder, limit, offset
- `POST /api/reading-entries` - Create entry (status REQUIRED)
- `GET /api/reading-entries/[id]` - Get single entry
- `PATCH /api/reading-entries/[id]` - Update entry
- `DELETE /api/reading-entries/[id]` - Delete entry
- `GET /api/reading-entries/stats` - User statistics

---

## Authentication Flow

### Signup Flow
1. User fills signup form (email, username, password, full name - all required)
2. Backend validates password strength
3. 6-digit OTP generated and stored with 15-min expiry
4. User created with hashed password + OTP
5. Verification email sent (HTML template with gradient styling)
6. User redirected to `/verify-email?email={email}`
7. User enters OTP from email
8. On successful verification, isEmailVerified set to true
9. User can now login

### Login Flow
1. User enters email/username + password
2. Backend finds user, verifies password with bcrypt
3. JWT token generated with user info
4. Token set as HTTP-only cookie (7-day expiry)
5. User data returned (without password)
6. User redirected to dashboard/home

### Password Reset Flow
1. User clicks "Forgot password?" on login page
2. User enters email on `/forgot-password`
3. Backend generates reset OTP and sends email
4. User redirected to `/reset-password?email={email}`
5. User enters OTP + new password (with strength validation)
6. Password updated with bcrypt hash
7. Reset OTP cleared
8. User can login with new password

---

## Email Service Configuration

### Setup
Uses nodemailer with SMTP. Configure these environment variables:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@email.com
SMTP_PASS=your-app-password
EMAIL_FROM_NAME=ebe
```

### Development Mode
If SMTP is not configured, emails are logged to console instead of being sent.

### Email Templates
1. **Verification Email** - Welcome message with 6-digit OTP in styled box
2. **Password Reset Email** - Security notice with reset OTP and warning

Both use HTML templates with:
- Gradient headers (indigo to purple)
- Centered OTP display with large font
- 15-minute expiration notice
- Professional styling and branding

---

## Deployment

### Production URLs
- **App**: https://ebe-ruby.vercel.app
- **Database**: Neon PostgreSQL (pooled connection)
- **GitHub**: https://github.com/mxbolu/ebe

### Vercel Configuration
- **Framework**: Next.js
- **Build Command**: `prisma generate && next build`
- **Install Command**: Default (npm install)
- **Root Directory**: ./

### Environment Variables (Vercel)
```
DATABASE_URL=postgresql://neondb_owner:npg_uimA5cqkx6Bh@ep-proud-hat-ahfh1gs3-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=your-secret-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@email.com
SMTP_PASS=your-app-password
EMAIL_FROM_NAME=ebe
```

### Database Migrations
Production migrations run manually:
```bash
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

---

## Book Import System

### Open Library Import
- Imported 90,000+ books to production database
- Used `/subjects/{category}.json` API with pagination
- Fields extracted: title, authors, cover, description, ISBN, year, page count
- Quality filtering: required either ISBN OR (cover + description)
- Zero errors during production import

### Book Caching
Background caching system for search results:
- Runs asynchronously (non-blocking)
- Quality filter: ISBN OR (cover + description > 50 chars)
- Checks for duplicates via ISBN or external IDs
- Source marked as CACHED_FROM_SEARCH
- Successfully tested and working

---

## Technical Decisions & Fixes

### Prisma 7 Migration
**Issue**: Prisma v7 removed support for direct `url` in datasource
**Solution**: Implemented adapter pattern with @prisma/adapter-pg
- Created Pool connection with pg
- Used PrismaPg adapter for Prisma Client
- Handles both Prisma Postgres (local) and regular PostgreSQL (production)

### Tailwind CSS Version
**Issue**: Tailwind v4 incompatible with Next.js 16 Turbopack in production
**Solution**: Downgraded to v3.4.19
- Created v3-compatible config files
- Updated postcss.config.mjs
- Successfully deployed with UI

### Next.js 16 Params Change
**Issue**: Dynamic route params changed from object to Promise
**Solution**: Updated all route handlers
- Changed `{ params }` type to `Promise<{ params }>`
- Added `await params` in all handlers
- Fixed: books/[id], reading-entries/[id] (GET, PATCH, DELETE)

### Zod Validation
**Issue**: Used `.error.errors` instead of `.error.issues`
**Solution**: Updated all validation error handlers to use `.issues`

---

## Security Features

### Password Security
- bcryptjs hashing with 10 salt rounds
- Strength validation: 8+ chars, uppercase, lowercase, number
- Never stored in plain text

### JWT & Cookies
- HTTP-only cookies (XSS protection)
- Secure flag in production (HTTPS only)
- SameSite: lax (CSRF protection)
- 7-day expiration

### OTP Security
- 6-digit random codes (digits only)
- 15-minute expiration
- One-time use (cleared after verification)
- Separate OTPs for email verification and password reset

### API Protection
- Middleware authentication on protected routes
- User ownership checks for resources
- Token verification on every authenticated request

---

## Conversation Log

### Session 1 - January 1, 2026 (Morning)
**Initial Project Setup & Database Schema**
- Reviewed project structure and tech stack
- Designed comprehensive database schema
- Discussed user-generated book submissions
- Planned gamification features
- Set up Prisma schema with all models

### Session 2 - January 1, 2026 (Afternoon)
**Prisma v7 Migration & Book Import**
- Fixed Prisma v7 initialization error with adapter pattern
- Built book import system from Open Library
- Imported 90,000+ books with quality filtering
- Implemented smart book search API
- Added background caching for search results

### Session 3 - January 1, 2026 (Afternoon continued)
**Deployment & Authentication**
- Deployed to Vercel (multiple attempts with Tailwind issues)
- Migrated to Neon PostgreSQL for production
- Fixed Tailwind CSS v4 incompatibility (downgraded to v3)
- Built complete JWT authentication system
- Implemented reading entry CRUD operations
- Added advanced filtering and statistics

### Session 4 - January 1, 2026 (Evening)
**Email Verification & Password Reset**
- Installed nodemailer and otp-generator
- Created email service with beautiful HTML templates
- Updated User schema with verification and reset fields
- Built email verification flow (OTP-based)
- Built password reset flow (OTP-based)
- Created all UI pages (verify-email, forgot-password, reset-password)
- Updated login page with forgot password link
- Updated signup page to redirect to verification
- Fixed Next.js 16 params compatibility issues
- Made full name required on signup
- Updated PROJECT_NOTES.md with latest features

---

## Environment Variables

### Local Development
```env
DATABASE_URL="prisma+postgres://..."
JWT_SECRET="dev-secret-change-in-production"
```

### Production (Vercel)
```env
DATABASE_URL="postgresql://neondb_owner:..."
JWT_SECRET="strong-production-secret"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your@email.com"
SMTP_PASS="your-app-password"
EMAIL_FROM_NAME="ebe"
```

---

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run local build
npm start

# Prisma commands
npx prisma migrate dev          # Create and run migration
npx prisma migrate deploy       # Run migrations in production
npx prisma generate             # Generate Prisma Client
npx prisma studio               # Open database GUI

# Book import
npm run import:books            # Import from Open Library
```

---

## Known Issues & Limitations

1. **Email in Development**: Without SMTP config, emails log to console only
2. **Reading Progress**: Disabled for v1 (simplified user experience)
3. **No Dashboard Yet**: Users redirected to landing page after login
4. **No Book Submission UI**: API ready, UI pending
5. **Gamification**: Backend complete, frontend not implemented

---

## Next Steps (Priority Order)

### Immediate (Week 1)
1. Configure production SMTP for email delivery
2. Build user dashboard with reading stats
3. Create book details page
4. Build reading journal list view
5. Add create/edit reading entry forms

### Short-term (Week 2-3)
6. User profile page with settings
7. Custom shelves interface
8. Advanced book search filters
9. Reading entry privacy controls
10. Password change in settings

### Medium-term (Month 1)
11. Book submission workflow UI
12. Admin moderation dashboard
13. Edit suggestions interface
14. Social features (followers, public profiles)
15. Mobile-responsive improvements

---

## Resources & Links
- [Prisma v7 Documentation](https://www.prisma.io/docs)
- [Next.js 16 App Router](https://nextjs.org/docs)
- [Tailwind CSS v3](https://tailwindcss.com/docs)
- [Open Library API](https://openlibrary.org/developers/api)
- [Vercel Deployment Docs](https://vercel.com/docs)
- [Neon PostgreSQL](https://neon.tech/docs)

---

*Last Updated: January 1, 2026 - 4:30 PM*
*Status: Email verification and password reset complete, ready for user testing*
