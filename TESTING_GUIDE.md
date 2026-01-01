# Phase 1 Testing Guide

This guide will walk you through testing all Phase 1 features systematically.

**Live Application**: https://iwewa.com

---

## Pre-Testing Setup

### 1. Clear Browser Data (Recommended)
To start fresh:
- Open Developer Tools (F12 or Cmd+Option+I)
- Go to Application → Storage → Clear site data
- Or use incognito/private browsing mode

### 2. Have Test Data Ready
For testing book submission, prepare:
- A real book title and author
- Optional: ISBN, publisher, year
- Book that might not be in the database (self-published, indie, recent release)

---

## Test Suite

## 1️⃣ Authentication & Dashboard

### Test 1.1: Sign Up
**Steps:**
1. Go to https://iwewa.com
2. Click "Sign up" or navigate to `/signup`
3. Fill out the form:
   - **Full Name**: Test User
   - **Username**: testuser[random numbers]
   - **Email**: your-email@example.com
   - **Password**: TestPass123!
4. Click "Sign Up"

**Expected Results:**
- ✅ Form validates password requirements
- ✅ Redirects to `/verify-email?email=your-email@example.com`
- ✅ User is automatically logged in (check for token cookie in DevTools)
- ✅ Email sent with verification code (check inbox/spam)

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________________

---

### Test 1.2: Login
**Steps:**
1. Log out if logged in
2. Navigate to `/login`
3. Enter username or email and password
4. Click "Log in"

**Expected Results:**
- ✅ Redirects to `/dashboard`
- ✅ Dashboard loads with user info in header
- ✅ Shows "My Books" tab by default
- ✅ Email verification warning if not verified

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________________

---

### Test 1.3: Dashboard Layout
**Steps:**
1. View the dashboard at `/dashboard`

**Expected Results:**
- ✅ Header shows:
  - "ebe" logo
  - User name and email
  - Logout button
- ✅ Tab navigation:
  - "My Books" tab
  - "Add Books" tab
- ✅ Statistics cards show (if you have books):
  - Total Books
  - Finished
  - Avg Rating
  - Pages Read
- ✅ Empty state if no books: "No books yet"

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________________

---

## 2️⃣ Book Search & Discovery

### Test 2.1: Search for Books
**Steps:**
1. Go to dashboard → "Add Books" tab
2. Search for a popular book (e.g., "Harry Potter")
3. Wait for results

**Expected Results:**
- ✅ Shows loading spinner during search
- ✅ Returns results from multiple sources
- ✅ Each book card shows:
  - Cover image or placeholder
  - Title (clickable)
  - Author(s)
  - Page count, year, rating (if available)
  - "Add to My Books" button
- ✅ Results count displayed

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________________

---

### Test 2.2: Empty Search Results
**Steps:**
1. Search for a very obscure or made-up book title
2. Wait for results

**Expected Results:**
- ✅ Shows "No books found" message
- ✅ Displays "Can't find your book? Submit it here" button
- ✅ Button links to `/submit-book`

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________________

---

### Test 2.3: Add Book to Library
**Steps:**
1. Search for a book
2. Click "Add to My Books" on any result
3. Select a status (e.g., "Want to Read")

**Expected Results:**
- ✅ Shows success message: "Added to want to read"
- ✅ Success message disappears after 3 seconds
- ✅ Can add same book with different status (updates, doesn't duplicate)

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________________

---

## 3️⃣ Book Detail Pages

### Test 3.1: Navigate to Book Detail
**Steps:**
1. From search results, click on a book title
2. Should navigate to `/books/[id]`

**Expected Results:**
- ✅ Page loads with book information
- ✅ Shows large cover image
- ✅ Displays:
  - Title and authors
  - Description (if available)
  - Metadata (pages, publisher, ISBN, language, year)
  - Genre tags (if available)
  - Community rating
- ✅ Shows "Add to My Books" button if not in library
- ✅ Shows "In Your Library" badge if already added
- ✅ "Back to Dashboard" link works

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________________

---

### Test 3.2: Add Book from Detail Page
**Steps:**
1. Find a book not in your library
2. View its detail page
3. Click "Add to My Books"
4. Select a status

**Expected Results:**
- ✅ Book is added to library
- ✅ Button changes to "In Your Library" badge
- ✅ Shows "Edit Entry" and "Remove from Library" buttons
- ✅ Can navigate to dashboard to see the book

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________________

---

### Test 3.3: View Your Entry on Detail Page
**Steps:**
1. View detail page of a book in your library
2. Scroll to "Your Entry" section

**Expected Results:**
- ✅ Shows your rating (if rated)
- ✅ Shows your review (if written)
- ✅ Shows reading progress (if in progress)
- ✅ "Edit Entry" button links to dashboard
- ✅ "Remove from Library" button works

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________________

---

## 4️⃣ Edit Reading Entry

### Test 4.1: Open Edit Modal
**Steps:**
1. Go to dashboard → "My Books" tab
2. Find any book in your library
3. Click "Edit" button

**Expected Results:**
- ✅ Modal opens with edit form
- ✅ Shows book cover and title in header
- ✅ Pre-fills current values for all fields
- ✅ Close (X) button in header works
- ✅ "Cancel" button closes modal

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________________

---

### Test 4.2: Update Reading Status
**Steps:**
1. Open edit modal
2. Click different status buttons
3. Save changes

**Expected Results:**
- ✅ Status buttons visually indicate selection
- ✅ All 4 statuses available:
  - Want to Read (blue)
  - Currently Reading (green)
  - Finished (purple)
  - Did Not Finish (gray)
- ✅ Changes save successfully
- ✅ Status badge updates on card

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________________

---

### Test 4.3: Set Decimal Rating
**Steps:**
1. Open edit modal
2. Test all rating input methods:
   - **Slider**: Drag to different values
   - **Number Input**: Type a value (e.g., 8.5)
   - **Quick Buttons**: Click 1.0, 2.5, 5.0, 7.5, 10.0
3. Observe star display
4. Save

**Expected Results:**
- ✅ Slider moves in 0.5 increments
- ✅ Number input validates range (1.0-10.0)
- ✅ Quick buttons set exact values
- ✅ Stars display correctly:
  - 10.0 → 5 full stars
  - 5.0 → 2.5 stars
  - 8.5 → 4.25 stars (4 full + 1 quarter)
- ✅ Rating displays as "X.X/10"
- ✅ "Clear" button removes rating
- ✅ Saved rating persists

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________________

---

### Test 4.4: Edit Review and Notes
**Steps:**
1. Open edit modal
2. Write/edit review text
3. Write/edit personal notes
4. Save changes

**Expected Results:**
- ✅ Character count updates as you type
- ✅ Review shows on card after save
- ✅ Notes help text: "Only you can see these notes"
- ✅ Both fields save correctly

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________________

---

### Test 4.5: Set Dates and Progress
**Steps:**
1. Open edit modal for a "Currently Reading" book
2. Set start date (date picker)
3. Set current page (e.g., page 150 of 300)
4. Observe progress bar
5. Save changes

**Expected Results:**
- ✅ Date pickers work correctly
- ✅ Current page validates (0 to total pages)
- ✅ Progress bar shows:
  - Percentage complete
  - Pages remaining
  - Visual progress bar
- ✅ Progress updates in real-time as you type
- ✅ Saved dates appear on card

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________________

---

### Test 4.6: Toggle Favorite and Privacy
**Steps:**
1. Open edit modal
2. Toggle "Mark as Favorite" checkbox
3. Toggle "Keep Private" checkbox
4. Save changes

**Expected Results:**
- ✅ Favorite toggle works
- ✅ Star icon on card fills/unfills
- ✅ Privacy toggle works
- ✅ Settings persist

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________________

---

## 5️⃣ Submit Missing Book

### Test 5.1: Access Submission Form
**Steps:**
1. Method A: From empty search results → click "Can't find your book?"
2. Method B: Navigate directly to `/submit-book`

**Expected Results:**
- ✅ Both methods load the submission form
- ✅ Shows info banner about review process
- ✅ Form displays all fields

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________________

---

### Test 5.2: Submit a Book (Required Fields Only)
**Steps:**
1. Fill out ONLY required fields:
   - **Title**: "Test Book Title"
   - **Author(s)**: "Test Author"
2. Click "Submit Book for Review"

**Expected Results:**
- ✅ Form validates required fields
- ✅ Shows loading state: "Submitting..."
- ✅ Success message appears
- ✅ Form resets to empty
- ✅ "Go to Dashboard" link works

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________________

---

### Test 5.3: Submit with All Fields
**Steps:**
1. Fill out ALL fields:
   - Title
   - Authors (comma-separated: "Author One, Author Two")
   - ISBN
   - Publisher
   - Publication Year
   - Page Count
   - Description
   - Genres (comma-separated: "Fiction, Fantasy")
   - Language (dropdown)
   - Cover Image URL
2. Submit

**Expected Results:**
- ✅ All fields accept input
- ✅ Comma separation works for authors and genres
- ✅ Submission succeeds
- ✅ Success message appears

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________________

---

### Test 5.4: Duplicate Submission Prevention
**Steps:**
1. Submit a book with a specific ISBN
2. Try to submit the same book again (same ISBN)

**Expected Results:**
- ✅ Second submission fails
- ✅ Error message: "A book with this ISBN already exists..." OR "A submission for this book is already pending review"

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________________

---

## 6️⃣ Reading List Management

### Test 6.1: Filter Reading List
**Steps:**
1. Go to "My Books" tab
2. Add books with different statuses (if you haven't)
3. Click each filter tab:
   - All
   - Want to Read
   - Currently Reading
   - Finished

**Expected Results:**
- ✅ Each tab shows count in parentheses
- ✅ Clicking tab filters books correctly
- ✅ Active tab is highlighted
- ✅ Statistics cards update based on filter

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________________

---

### Test 6.2: Remove Book from Library
**Steps:**
1. Find any book in your library
2. Click "Remove" button
3. Confirm deletion

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ Clicking "OK" removes book
- ✅ Book disappears from list
- ✅ Statistics update
- ✅ Clicking "Cancel" keeps book

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________________

---

## 7️⃣ Responsive Design

### Test 7.1: Mobile View
**Steps:**
1. Resize browser to mobile width (< 768px)
2. OR open on mobile device
3. Navigate through all pages

**Expected Results:**
- ✅ Dashboard stacks vertically
- ✅ Statistics cards stack
- ✅ Book cards stack
- ✅ Edit modal is scrollable
- ✅ Book detail page is readable
- ✅ All buttons are tappable

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________________

---

## 8️⃣ Navigation & Links

### Test 8.1: Clickable Book Titles
**Steps:**
1. Click book titles in various places:
   - Search results
   - My Books list
   - Book detail page

**Expected Results:**
- ✅ All book titles are clickable
- ✅ Hover shows color change (indigo)
- ✅ Clicking navigates to book detail page

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________________

---

### Test 8.2: Navigation Consistency
**Steps:**
1. Navigate between pages
2. Check "Back to Dashboard" links

**Expected Results:**
- ✅ Back links work from:
  - Book detail pages
  - Submit book page
- ✅ Logo clicks (if any) return to dashboard
- ✅ Logout works from all pages

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________________

---

## 9️⃣ Edge Cases

### Test 9.1: Book with No Cover Image
**Steps:**
1. Find/add a book without a cover image

**Expected Results:**
- ✅ Shows placeholder icon
- ✅ Placeholder is visually appealing
- ✅ Layout doesn't break

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________________

---

### Test 9.2: Long Book Titles
**Steps:**
1. Find a book with a very long title

**Expected Results:**
- ✅ Title truncates with ellipsis (line-clamp)
- ✅ Full title visible on detail page
- ✅ Layout doesn't overflow

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________________

---

### Test 9.3: Multiple Authors
**Steps:**
1. Find a book with 3+ authors

**Expected Results:**
- ✅ All authors display (comma-separated)
- ✅ Truncates nicely if too long

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________________

---

## 🔟 Performance

### Test 10.1: Search Speed
**Steps:**
1. Search for a popular book
2. Note time to results

**Expected Results:**
- ✅ Results appear within 3-5 seconds
- ✅ Loading indicator shows during wait

**Actual Results:**
- [ ] Pass / [ ] Fail
- Time: _______ seconds

---

### Test 10.2: Page Load Times
**Steps:**
1. Navigate between pages
2. Observe loading speed

**Expected Results:**
- ✅ Dashboard loads quickly
- ✅ Book detail pages load within 1-2 seconds
- ✅ Modal opens instantly

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _______________________

---

## Summary Checklist

After completing all tests, fill out:

### Features Working ✅
- [ ] Authentication (signup, login, logout)
- [ ] Dashboard and navigation
- [ ] Book search
- [ ] Book detail pages
- [ ] Add books to library
- [ ] Edit reading entries
- [ ] Decimal rating system (1.0-10.0)
- [ ] Reviews and notes
- [ ] Reading progress tracking
- [ ] Favorite books
- [ ] Remove books
- [ ] Submit missing books
- [ ] Filtering reading lists
- [ ] Responsive design

### Bugs Found 🐛
1. _______________________
2. _______________________
3. _______________________

### Improvements Needed 💡
1. _______________________
2. _______________________
3. _______________________

### Overall Assessment
- **Critical Issues**: _____ (blocks usage)
- **Minor Issues**: _____ (annoying but workable)
- **Polish Needed**: _____ (cosmetic improvements)

**Ready for production?**: [ ] Yes / [ ] No / [ ] With fixes

---

## Reporting Issues

If you find any bugs, please note:
1. **What you were doing** (steps to reproduce)
2. **What you expected** to happen
3. **What actually happened**
4. **Browser and device** (Chrome/Safari/Firefox, Desktop/Mobile)
5. **Screenshots** (if relevant)

Share your findings and I'll fix any issues immediately!

---

**Happy Testing! 🧪**
