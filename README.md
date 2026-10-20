# Two Souls. One Celebration.
### Twin Sisters Birthday Surprise: Kowsalya & Kowsika

> *“A celebration written in rhythm.”*  
> Two journeys. Two academies. One unforgettable birthday moment.

A mobile-first, synchronized birthday reveal website built for twin sisters **Kowsalya** (*Salya's Dance Academy*) and **Kowsika** (*Shrinrityalaya*). Designed to be opened simultaneously on separate mobile devices from different locations.

---

## Architecture Overview

```text
Kowsalya's Phone                             Kowsika's Phone
(Salya's Dance Academy)                      (Shrinrityalaya)
       │                                            │
       ├─ Transparent Consent (Optional Video)      ├─ Transparent Consent (Optional Video)
       ├─ Access Code: SALYA2026                    ├─ Access Code: SHRIN2026
       │                                            │
       └─────────────────────┬──────────────────────┘
                             │
                      WSS / HTTPS (Socket.IO & REST)
                             │
                      Node.js Express Server
                             │
             ┌───────────────┴───────────────┐
             │                               │
       MongoDB Database               Private Storage
  (Shared Session State,           (server/private-recordings/
  Countdown Deadline, Auth)        non-public chunked video vault)
```

---

## Key Features

1. **Bharatanatyam Aesthetic Design System**:
   - Midnight-maroon (`#120309`, `#260918`), antique-gold (`#d4af37`), and warm ivory (`#fbf8f2`) palette.
   - Traditional animated golden Diya with flame flicker effect and classical Indian filigree / lotus motifs.
   - Mobile-first layout optimized for 320px–430px screens with comfortable touch targets (48px+), safe-area insets, and zero horizontal overflow.

2. **Server-Authoritative Synchronization (Socket.IO)**:
   - Separate secret access codes (`KOWSALYA_CODE` and `KOWSIKA_CODE`).
   - Timing-safe code comparison (`crypto.timingSafeEqual`) and brute-force rate-limiting.
   - First participant to enter code sees a personalized waiting room (*"Waiting for Kowsika to join your celebration..."*).
   - Atomic state transition when second participant joins: creates a **single, server-persisted 10-second countdown deadline**.
   - Clock offset synchronization prevents timer drift between mobile devices.
   - **Gifts remain hidden on the server** and are never sent to the client until the countdown reaches 0.

3. **Strict Ephemeral Session & Synchronized Restart on Refresh**:
   - The session is strictly ephemeral: no credentials or participant states are saved across refreshes.
   - If either sister refreshes her screen or disconnects, the celebration immediately and safely **restarts for both participants**.
   - The server resets the database session back to the initial `WAITING` state, cancels any pending countdowns, and broadcasts a `session_restarted` event via Socket.IO.
   - Both devices immediately return to the starting screen with an informative notice, ensuring both sisters always experience the full surprise countdown and reveal together!

4. **Transparent Reaction Recording & Universal MP4 Conversion**:
   - Clear disclosure explaining what is recorded, private storage, authorized family access, and retention.
   - Dedicated **"Agree & Enable Camera"** and **"Continue Without Recording"** actions. Never deceives the user.
   - If permission is denied or camera fails, celebration continues seamlessly without recording.
   - Initial container headers (Chunk #0) are strictly retained and never dropped during the code entry stage.
   - Chunked upload in 4-second slices with automatic retry to protect against mobile backgrounding or network drops.
   - **Automated Universal MP4 Encoding**: On recording finalization, the backend uses `ffmpeg-static` to produce a standard, universally playable H.264/AAC `.mp4` file with `faststart` (moov atom relocated to beginning). Plays out of the box in Windows Media Player, QuickTime on iOS/macOS, Android, WhatsApp, and browsers without format errors!
   - **In-Browser Reaction Vault**: Tap **"🎬 View & Download Birthday Reactions"** to watch the reactions directly in an in-app player or download the `.mp4` files.
   - Files stored privately in `server/private-recordings/` outside public web directories. No public video URLs are exposed.
   - Unobtrusive recording pill with blink indicator, chunk counter, and a one-tap **Stop** control.

5. **Birthday Reveal & Gift Delivery**:
   - Joyful confetti cannon animation.
   - Dedicated birthday letter celebrating their bond and classical dance academies.
   - Two distinct vertically stacked gift cards linking to their custom mobile app releases:
     - **Salya's Dance Academy** — Kowsalya's app URL (`KOWSALYA_APP_URL`)
     - **Shrinrityalaya** — Kowsika's app URL (`KOWSIKA_APP_URL`)

---

## Project Structure

```text
twin-gifts/
├── client/                     # React + Vite + Tailwind CSS frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Invitation.jsx          # Screen A: Landing page
│   │   │   ├── RecordingConsent.jsx    # Screen B: Honest consent
│   │   │   ├── AccessCode.jsx          # Screen C: Private access code
│   │   │   ├── WaitingRoom.jsx         # Screen D: Sister waiting room
│   │   │   ├── Countdown.jsx           # Screen E: Shared 10-to-0 timer
│   │   │   ├── GiftReveal.jsx          # Screen F: Letter & mobile app cards
│   │   │   ├── RecordingStatus.jsx     # Floating recording indicator
│   │   │   ├── DiyaFlame.jsx           # Golden glowing Diya component
│   │   │   └── OrnamentalBorder.jsx    # Classical Indian lotus filigree
│   │   ├── hooks/
│   │   │   ├── useCelebrationSocket.js # Realtime state & sync hook
│   │   │   └── useRecorder.js          # Camera capture & chunked upload
│   │   ├── App.jsx
│   │   └── index.css
│   ├── .env.example
│   └── package.json
│
├── server/                     # Node.js + Express + Socket.IO backend
│   ├── src/
│   │   ├── models/
│   │   │   ├── Celebration.js          # MongoDB session schema
│   │   │   └── Recording.js            # Video metadata schema
│   │   ├── middleware/
│   │   │   ├── authenticateSocket.js   # Socket HMAC handshake auth
│   │   │   └── rateLimiter.js          # Rate limiter for access codes
│   │   ├── routes/
│   │   │   ├── celebration.js          # Code verification & reveal auth
│   │   │   └── recordings.js           # Private chunked upload endpoints
│   │   ├── socket/
│   │   │   └── celebrationHandlers.js  # Realtime room & countdown sync
│   │   ├── services/
│   │   │   ├── db.js                   # Mongoose & Atlas / Memory fallback
│   │   │   ├── sessionService.js       # Atomic state machine & reveal checks
│   │   │   ├── tokenService.js         # Cryptographic HMAC tokens
│   │   │   └── recordingStorage.js     # Private filesystem vault
│   │   ├── app.js
│   │   └── server.js
│   ├── private-recordings/             # Protected storage (not served statically)
│   ├── test/
│   │   └── e2e-test.js                 # Complete 9-step automated test suite
│   ├── .env.example
│   └── package.json
│
├── package.json
└── README.md
```

---

## Quickstart (Local Development)

### 1. Prerequisites
- Node.js (v18+ or v22+)
- npm (v9+)

### 2. Install Dependencies

In the root directory, or individually in `server` and `client`:

```bash
# Install backend
cd server
npm install

# Install frontend
cd ../client
npm install
```

### 3. Environment Variables Configuration

Copy `.env.example` to `.env` in both folders:

**Server (`server/.env`)**:
```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
KOWSALYA_CODE=SALYA2026
KOWSIKA_CODE=SHRIN2026
KOWSALYA_APP_URL=https://salyasdance.app/release
KOWSIKA_APP_URL=https://shrinrityalaya.app/release
SESSION_ID=birthday-2026
RECORDINGS_DIR=./private-recordings
MAX_RECORDING_BYTES=104857600
# Optional: supply your MongoDB Atlas URI. 
# If omitted in development, an automatic embedded in-memory MongoDB will be used.
# MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/twin_birthday
```

**Client (`client/.env`)**:
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_SESSION_ID=birthday-2026
```

### 4. Run the Servers

Start the backend:
```bash
cd server
npm start
```

In a second terminal, start the frontend:
```bash
cd client
npm run dev
```

The frontend will run at `http://localhost:5173` (and your local LAN IP for phone testing, e.g. `http://192.168.x.x:5173`).

---

## Running Automated End-to-End Tests

A complete automated test suite verifies all 9 core requirements:
- Session resets
- Health check
- Invalid code rejection (401) and timing-safe checks
- Kowsalya access & WAITING state with hidden gifts
- Kowsika access & atomic COUNTDOWN deadline trigger
- Reconnection / refresh during countdown without restarting
- Private video chunk upload and metadata tracking
- Recording finalization in private vault
- Server-authorized reveal after countdown deadline and gift URL delivery

Run the test suite with:
```bash
npm run test:e2e
```
*(or `node server/test/e2e-test.js`)*

---

## Manual Test Checklist

| Test Case | Steps to Execute | Expected Outcome |
| :--- | :--- | :--- |
| **1. Separate Mobile Networks** | Open phone 1 on cellular data and phone 2 on Wi-Fi at your frontend URL. | Both devices connect smoothly over WebSocket without CORS or transport errors. |
| **2. Invitation Page & Layout** | View at 320px–430px viewport on Safari / Chrome Mobile. | Single-column, no horizontal scroll, high-contrast text, regal maroon/gold palette. |
| **3. Recording Consent** | Tap "Begin Your Surprise". Screen shows honest disclosures. | Explains reaction recording, private storage, and optional nature. Tap "Continue Without Recording" to proceed without camera. |
| **4. Invalid Access Code** | Enter `WRONG123` on Access Code screen. | Red error banner displayed; no hint about the other sister's code; rate limit protects after repeated attempts. |
| **5. Kowsalya Enters `SALYA2026`** | Enter Kowsalya's code on Phone 1. | Screen displays: *"Waiting for Kowsika to join your celebration..."* with glowing Diya and live sync badge. Gift links remain hidden. |
| **6. Kowsika Enters `SHRIN2026`** | Enter Kowsika's code on Phone 2. | Server immediately emits `both_ready`. Both phones simultaneously switch to the 10-to-0 countdown ring. |
| **7. Screen Refresh (Synchronized Restart)** | Refresh Phone 1 at any point during waiting, countdown, or reveal. | Neither phone saves the session. Server cancels any timer, resets session to `WAITING`, and triggers a restart for BOTH phones so they begin again together. |
| **8. Synchronized Reveal** | Countdown reaches zero. | Joyful confetti fires; joint birthday letter displayed; two separate gift cards appear (*Salya's Dance Academy* & *Shrinrityalaya*). |
| **9. Verify App Gift URLs** | Tap "Unlock Salya's Dance App" and "Unlock Shrinrityalaya App". | Opens the respective release URLs verified in backend environment variables. |
| **10. Rehearsal Reset** | Tap the subtle "Rehearse / Reset" button in the footer. | Session is safely reset to `WAITING` state for a fresh run-through. |

---

## Production Deployment Guide

### Backend (Render, Railway, or VPS)
1. Set the following environment variables:
   - `PORT=5000` (or host-assigned)
   - `CLIENT_ORIGIN=https://your-frontend.vercel.app`
   - `MONGODB_URI=mongodb+srv://<user>:<pwd>@cluster.mongodb.net/twin_birthday`
   - `KOWSALYA_CODE=<your_chosen_secret_code>`
   - `KOWSIKA_CODE=<your_chosen_secret_code>`
   - `KOWSALYA_APP_URL=<verified_release_url>`
   - `KOWSIKA_APP_URL=<verified_release_url>`
   - `RECORDINGS_DIR=/var/data/recordings` (attach a persistent volume for private video storage)
2. Ensure WebSocket / sticky sessions are enabled if using multiple backend instances.
3. Start command: `node src/server.js`.

### Frontend (Vercel, Netlify, or Cloudflare Pages)
1. Build command: `npm run build`
2. Output directory: `dist`
3. Environment variables:
   - `VITE_API_URL=https://your-backend.onrender.com`
   - `VITE_SOCKET_URL=https://your-backend.onrender.com`
   - `VITE_SESSION_ID=birthday-2026`
4. Camera permissions require **HTTPS** (automatically provided by modern hosting providers).
#   t w i n - s o u l s  
 