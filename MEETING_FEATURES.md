# Meeting Features Documentation

This document outlines the new meeting features added to the book club platform.

## Features Implemented

### 1. Meeting Notifications ✅
Members receive notifications when:
- A meeting is scheduled
- A meeting is starting soon (15 minutes before)
- A meeting is cancelled

**Location:**
- Notification types: `src/lib/notifications.ts`
- Integration: `src/app/api/book-clubs/[id]/meetings/route.ts`

### 2. Meeting Recordings ✅
Admins and moderators can record meetings using Agora Cloud Recording.

**Key Components:**
- Recording service: `src/lib/agora-recording.ts`
- Start recording API: `src/app/api/book-clubs/[id]/meetings/[meetingId]/recording/start/route.ts`
- Stop recording API: `src/app/api/book-clubs/[id]/meetings/[meetingId]/recording/stop/route.ts`
- UI controls: Recording button in `src/components/VideoRoom.tsx`

**Features:**
- Admin/moderator-only access
- Visual recording indicator for all participants
- Automatic recording URL saved to database
- Supports HLS and MP4 formats

### 3. Screen Sharing ✅
Participants can share their screen during meetings.

**Location:**
- Implementation: `src/components/VideoRoom.tsx`

**Features:**
- Toggle between camera and screen
- Handles browser's native "Stop sharing" button
- Automatic fallback to camera
- Visual indicator showing "Your Screen"

### 4. Meeting Chat ✅
Real-time text chat during meetings.

**Location:**
- Implementation: `src/components/VideoRoom.tsx`

**Features:**
- Slide-out chat panel
- Message history with timestamps
- Auto-scroll to latest messages
- Send with Enter key
- Responsive design

### 5. Waiting Room ✅
Pre-meeting lobby where participants wait for host approval.

**Key Components:**
- User experience: `src/components/WaitingRoom.tsx`
- Admin panel: `src/components/WaitingRoomPanel.tsx`
- Join waiting room: `src/app/api/book-clubs/[id]/meetings/[meetingId]/waiting-room/join/route.ts`
- Check status: `src/app/api/book-clubs/[id]/meetings/[meetingId]/waiting-room/status/route.ts`
- List participants: `src/app/api/book-clubs/[id]/meetings/[meetingId]/waiting-room/participants/route.ts`
- Admit participant: `src/app/api/book-clubs/[id]/meetings/[meetingId]/waiting-room/admit/route.ts`
- Reject participant: `src/app/api/book-clubs/[id]/meetings/[meetingId]/waiting-room/reject/route.ts`

**Features:**
- Enabled by default for all meetings
- Admins/moderators bypass waiting room
- Real-time polling (3-second intervals)
- Beautiful waiting room UI
- Admin panel with admit/reject controls
- "Admit All" bulk action

## Environment Variables Required

Add these to your Vercel production environment:

```bash
# Agora Configuration (already added)
AGORA_APP_ID=your_app_id
AGORA_APP_CERTIFICATE=your_certificate

# Agora Cloud Recording (NEW - required for recording feature)
AGORA_CUSTOMER_KEY=your_customer_key
AGORA_CUSTOMER_SECRET=your_customer_secret
```

### How to Get Agora Cloud Recording Credentials

1. Log in to [Agora Console](https://console.agora.io/)
2. Go to your project
3. Navigate to "RESTful API" section
4. Copy the Customer ID (use as `AGORA_CUSTOMER_KEY`)
5. Copy the Customer Secret (use as `AGORA_CUSTOMER_SECRET`)
6. Enable Cloud Recording in your project settings

## Database Changes

Run the migration that was created:

```bash
npx prisma migrate deploy
```

This adds:
- `waitingRoomEnabled` field to `BookClubMeeting` model
- `MeetingWaitingParticipant` table for tracking waiting room participants

## Usage

### For Regular Members

1. **Joining a Meeting:**
   - Click "Join" on an active meeting
   - If waiting room is enabled, you'll see a waiting screen
   - Once admitted by the host, you'll join automatically

2. **During the Meeting:**
   - Toggle microphone with mic button
   - Toggle camera with camera button
   - Share screen with screen share button
   - Open chat with chat button
   - Leave meeting with leave button

### For Admins/Moderators

All member features, plus:

1. **Recording:**
   - Click the record button to start/stop recording
   - Recording indicator appears for all participants
   - Recording URL is saved when stopped

2. **Waiting Room Management:**
   - Waiting room panel appears in bottom-right corner
   - See all waiting participants
   - Admit or reject individual participants
   - Use "Admit All" for bulk admission

## API Endpoints

### Meetings
- `GET /api/book-clubs/[id]/meetings` - List meetings
- `POST /api/book-clubs/[id]/meetings` - Create meeting
- `POST /api/book-clubs/[id]/meetings/[meetingId]/join` - Join meeting

### Recording
- `POST /api/book-clubs/[id]/meetings/[meetingId]/recording/start` - Start recording
- `POST /api/book-clubs/[id]/meetings/[meetingId]/recording/stop` - Stop recording

### Waiting Room
- `POST /api/book-clubs/[id]/meetings/[meetingId]/waiting-room/join` - Join waiting room
- `GET /api/book-clubs/[id]/meetings/[meetingId]/waiting-room/status` - Check admission status
- `GET /api/book-clubs/[id]/meetings/[meetingId]/waiting-room/participants` - List waiting (admin only)
- `POST /api/book-clubs/[id]/meetings/[meetingId]/waiting-room/admit` - Admit participant (admin only)
- `POST /api/book-clubs/[id]/meetings/[meetingId]/waiting-room/reject` - Reject participant (admin only)

## Next Steps (Optional Enhancements)

1. **Real-time Notifications:**
   - Implement WebSocket for instant waiting room notifications
   - Remove polling in favor of push notifications

2. **Recording Management:**
   - Add UI to view past recordings
   - Implement recording playback
   - Add download functionality

3. **Chat Enhancements:**
   - Add emoji picker
   - File sharing
   - Message reactions
   - Private messages

4. **Advanced Controls:**
   - Mute all participants (host only)
   - Hand raise feature
   - Breakout rooms
   - Virtual backgrounds

5. **Analytics:**
   - Meeting attendance tracking
   - Recording view counts
   - Chat message analytics

## Troubleshooting

### Recording Not Starting
- Verify `AGORA_CUSTOMER_KEY` and `AGORA_CUSTOMER_SECRET` are set
- Check Agora Console for API quota
- Ensure Cloud Recording is enabled in project settings

### Waiting Room Not Working
- Verify database migration was run
- Check that `waitingRoomEnabled` is `true` for the meeting
- Ensure user has proper membership role

### Screen Sharing Issues
- Check browser permissions for screen capture
- Ensure HTTPS is being used (required for screen sharing)
- Try in a different browser (Chrome/Edge recommended)

## Security Notes

- Recording is admin/moderator only to prevent unauthorized recordings
- Waiting room provides security against meeting bombing
- All API endpoints verify user membership before allowing actions
- Agora credentials should never be exposed to the client

## Performance Considerations

- Waiting room polls every 3 seconds (can be increased if needed)
- Chat messages are stored in memory (consider database storage for persistence)
- Screen sharing uses higher bandwidth than camera
- Recordings are stored in Agora's cloud (configure custom storage for production)
