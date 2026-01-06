# Meeting Email Reminders Setup

This document explains how to set up automated email reminders for meetings.

## Features

### 1. Meeting Scheduled Email
Sent immediately when a meeting is created to all book club members.

**Includes:**
- Meeting title and description
- Date and time
- Duration
- Book club name
- Link to join meeting
- Notice about 15-minute reminder

### 2. Meeting Reminder Email
Sent 15 minutes before the meeting starts.

**Includes:**
- Countdown ("starts in 15 minutes!")
- Meeting details
- Direct join button
- Tips for checking camera/mic

## Setup Instructions

### Step 1: Environment Variables

Add to your Vercel environment variables (if not already set):

```bash
# SMTP Configuration (for sending emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Email Settings
EMAIL_FROM_ADDRESS=your-email@gmail.com
EMAIL_FROM_NAME=ebe

# App URL (for email links)
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Cron Job Security (generate a random string)
CRON_SECRET=your-random-secret-key-here
```

### Step 2: Set Up Cron Job on Vercel

#### Option A: Vercel Cron Jobs (Recommended)

1. Create `vercel.json` in your project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/meeting-reminders",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

This runs the reminder check every 5 minutes.

2. Deploy to Vercel - cron jobs will automatically start running

#### Option B: External Cron Service

If you prefer an external service (cron-job.org, EasyCron, etc.):

1. Set up a cron job to call:
   ```
   GET https://your-domain.com/api/cron/meeting-reminders
   ```

2. Add Authorization header:
   ```
   Authorization: Bearer your-random-secret-key-here
   ```

3. Schedule: Every 5 minutes (`*/5 * * * *`)

### Step 3: Test the Setup

#### Test Meeting Scheduled Email

1. Create a test book club
2. Schedule a test meeting
3. Check email for all members

#### Test Meeting Reminder Email

You can manually trigger the cron endpoint:

```bash
curl -X GET https://your-domain.com/api/cron/meeting-reminders \
  -H "Authorization: Bearer your-cron-secret"
```

Or schedule a test meeting 15 minutes from now and wait.

## Email Templates

### Meeting Scheduled Email
- **Subject:** `New Meeting Scheduled: "[Meeting Title]"`
- **When:** Immediately after meeting creation
- **Recipients:** All book club members

### Meeting Reminder Email
- **Subject:** `Reminder: "[Meeting Title]" starts in 15 minutes`
- **When:** 15 minutes before meeting start
- **Recipients:** All book club members

## Troubleshooting

### Emails Not Sending

1. **Check SMTP Configuration:**
   ```bash
   # Verify env variables are set in Vercel
   ```

2. **Check Logs:**
   - Go to Vercel dashboard → Your Project → Logs
   - Look for email service logs

3. **Gmail Users:**
   - Use an App Password, not your regular password
   - Enable 2FA first, then generate App Password at: https://myaccount.google.com/apppasswords

### Reminders Not Sending

1. **Check Cron Job Status:**
   - Vercel: Dashboard → Settings → Cron Jobs
   - Verify the cron is enabled and running

2. **Check Cron Logs:**
   ```bash
   # Look for "[CRON]" prefixed logs
   ```

3. **Manual Test:**
   ```bash
   curl -X GET https://your-domain.com/api/cron/meeting-reminders \
     -H "Authorization: Bearer your-cron-secret"
   ```

### Common Issues

**Problem:** "Failed to send meeting reminders"
**Solution:** Check SMTP credentials and Prisma connection

**Problem:** Duplicate reminder emails
**Solution:** Ensure cron runs at most every 5 minutes (not more frequently)

**Problem:** No emails for test meetings
**Solution:** Ensure meeting is at least 15 minutes in the future

## Monitoring

The cron endpoint returns useful stats:

```json
{
  "success": true,
  "meetingsProcessed": 2,
  "emailsSent": 8,
  "emailsFailed": 0,
  "timestamp": "2026-01-06T10:30:00.000Z"
}
```

Monitor these logs to ensure emails are sending successfully.

## Customization

### Change Reminder Timing

Edit `/src/app/api/cron/meeting-reminders/route.ts`:

```typescript
// For 30 minutes before:
const reminderTime = new Date(now.getTime() + 30 * 60 * 1000)

// Update email text:
minutesBefore: 30
```

### Add More Reminder Times

Create additional cron jobs for different intervals:
- 1 hour before: `/api/cron/meeting-reminders-1hour`
- 1 day before: `/api/cron/meeting-reminders-1day`

### Customize Email Templates

Edit `/src/lib/email/service.ts`:
- `sendMeetingScheduledEmail()` - Meeting creation email
- `sendMeetingReminderEmail()` - Reminder email

## Security

- **CRON_SECRET:** Keep this secret! It prevents unauthorized cron triggers
- **SMTP Credentials:** Never commit these to git
- **Rate Limiting:** Cron endpoint has no rate limiting - only authorized callers should access it

## Cost Considerations

- **Vercel Cron:** Included in Pro plan, limited in Hobby plan
- **SMTP:** Gmail allows 500 emails/day for free accounts
- **For Scale:** Consider email service like SendGrid, AWS SES, or Resend

## Future Enhancements

Potential improvements:
- ✅ Meeting scheduled email (implemented)
- ✅ 15-minute reminder (implemented)
- ⏳ 1-hour reminder
- ⏳ 1-day reminder
- ⏳ Recording available notification
- ⏳ Meeting cancelled email
- ⏳ Digest of upcoming meetings
- ⏳ Unsubscribe preferences
