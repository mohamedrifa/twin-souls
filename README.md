# Two Souls. One Celebration.
### Twin Sisters Birthday Surprise: Kausalya & Kaushika

> *â€œA celebration written in rhythm.â€*  
> Two journeys. Two academies. One unforgettable birthday moment.

A mobile-first, synchronized birthday reveal website built for twin sisters **Kausalya** (*Salya's Dance Academy*) and **Kaushika** (*Shrinrityalaya*). Designed to be opened simultaneously on separate mobile devices from different locations.

---

## Architecture Overview

```text
Kausalya's Phone                             Kaushika's Phone
(Salya's Dance Academy)                      (Shrinrityalaya)
       â”‚                                            â”‚
       â”œâ”€ Transparent Consent (Optional Video)      â”œâ”€ Transparent Consent (Optional Video)
       â”œâ”€ Access Code: SALYA2026                    â”œâ”€ Access Code: SHRIN2026
       â”‚                                            â”‚
       â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                             â”‚
                      WSS / HTTPS (Socket.IO & REST)
                             â”‚
                      Node.js Express Server
                             â”‚
             â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
             â”‚                               â”‚
       MongoDB Database               Private Storage
  (Shared Session State,           (server/private-recordings/
  Countdown Deadline, Auth)        non-public chunked video vault)
```

---

## Key Features

1. **Bharatanatyam Aesthetic Design System**:
   - Midnight-maroon (`#120309`, `#260918`), antique-gold (`#d4af37`), and warm ivory (`#fbf8f2`) palette.
   - Traditional animated golden Diya with flame flicker effect and classical Indian filigree / lotus motifs.
   - Mobile-first layout optimized for 320pxâ€“430px screens with comfortable touch targets (48px+), safe-area insets, and zero horizontal overflow.

2. **Server-Authoritative Synchronization (Socket.IO)**:
   - Separate secret access codes (`Kausalya_CODE` and `Kaushika_CODE`).
   - Timing-safe code comparison (`crypto.timingSafeEqual`) and brute-force rate-limiting.
   - First participant to enter code sees a personalized waiting room (*"Waiting for Kaushika to join your celebration..."*).
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
   - **In-Browser Reaction Vault**: Tap **"ðŸŽ¬ View & Download Birthday Reactions"** to watch the reactions directly in an in-app player or download the `.mp4` files.
   - Files stored privately in `server/private-recordings/` outside public web directories. No public video URLs are exposed.
   - Unobtrusive recording pill with blink indicator, chunk counter, and a one-tap **Stop** control.

5. **Birthday Reveal & Gift Delivery**:
   - Joyful confetti cannon animation.
   - Dedicated birthday letter celebrating their bond and classical dance academies.
   - Two distinct vertically stacked gift cards linking to their custom mobile app releases:
     - **Salya's Dance Academy** â€” Kausalya's app URL (`Kausalya_APP_URL`)
     - **Shrinrityalaya** â€” Kaushika's app URL (`Kaushika_APP_URL`)

---

## Project Structure

```text
twin-gifts/
â”œâ”€â”€ client/                     # React + Vite + Tailwind CSS frontend
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â”‚   â”œâ”€â”€ Invitation.jsx          # Screen A: Landing page
â”‚   â”‚   â”‚   â”œâ”€â”€ RecordingConsent.jsx    # Screen B: Honest consent
â”‚   â”‚   â”‚   â”œâ”€â”€ AccessCode.jsx          # Screen C: Private access code
â”‚   â”‚   â”‚   â”œâ”€â”€ WaitingRoom.jsx         # Screen D: Sister waiting room
â”‚   â”‚   â”‚   â”œâ”€â”€ Countdown.jsx           # Screen E: Shared 10-to-0 timer
â”‚   â”‚   â”‚   â”œâ”€â”€ GiftReveal.jsx          # Screen F: Letter & mobile app cards
â”‚   â”‚   â”‚   â”œâ”€â”€ RecordingStatus.jsx     # Floating recording indicator
â”‚   â”‚   â”‚   â”œâ”€â”€ DiyaFlame.jsx           # Golden glowing Diya component
â”‚   â”‚   â”‚   â””â”€â”€ OrnamentalBorder.jsx    # Classical Indian lotus filigree
â”‚   â”‚   â”œâ”€â”€ hooks/
â”‚   â”‚   â”‚   â”œâ”€â”€ useCelebrationSocket.js # Realtime state & sync hook
â”‚   â”‚   â”‚   â””â”€â”€ useRecorder.js          # Camera capture & chunked upload
â”‚   â”‚   â”œâ”€â”€ App.jsx
â”‚   â”‚   â””â”€â”€ index.css
â”‚   â”œâ”€â”€ .env.example
â”‚   â””â”€â”€ package.json
â”‚
â”œâ”€â”€ server/                     # Node.js + Express + Socket.IO backend
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ models/
â”‚   â”‚   â”‚   â”œâ”€â”€ Celebration.js          # MongoDB session schema
â”‚   â”‚   â”‚   â””â”€â”€ Recording.js            # Video metadata schema
â”‚   â”‚   â”œâ”€â”€ middleware/
â”‚   â”‚   â”‚   â”œâ”€â”€ authenticateSocket.js   # Socket HMAC handshake auth
â”‚   â”‚   â”‚   â””â”€â”€ rateLimiter.js          # Rate limiter for access codes
â”‚   â”‚   â”œâ”€â”€ routes/
â”‚   â”‚   â”‚   â”œâ”€â”€ celebration.js          # Code verification & reveal auth
â”‚   â”‚   â”‚   â””â”€â”€ recordings.js           # Private chunked upload endpoints
â”‚   â”‚   â”œâ”€â”€ socket/
â”‚   â”‚   â”‚   â””â”€â”€ celebrationHandlers.js  # Realtime room & countdown sync
â”‚   â”‚   â”œâ”€â”€ services/
â”‚   â”‚   â”‚   â”œâ”€â”€ db.js                   # Mongoose & Atlas / Memory fallback
â”‚   â”‚   â”‚   â”œâ”€â”€ sessionService.js       # Atomic state machine & reveal checks
â”‚   â”‚   â”‚   â”œâ”€â”€ tokenService.js         # Cryptographic HMAC tokens
â”‚   â”‚   â”‚   â””â”€â”€ recordingStorage.js     # Private filesystem vault
â”‚   â”‚   â”œâ”€â”€ app.js
â”‚   â”‚   â””â”€â”€ server.js
â”‚   â”œâ”€â”€ private-recordings/             # Protected storage (not served statically)
â”‚   â”œâ”€â”€ test/
â”‚   â”‚   â””â”€â”€ e2e-test.js                 # Complete 9-step automated test suite
â”‚   â”œâ”€â”€ .env.example
â”‚   â””â”€â”€ package.json
â”‚
â”œâ”€â”€ package.json
â””â”€â”€ README.md
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
Kausalya_CODE=SALYA2026
Kaushika_CODE=SHRIN2026
Kausalya_APP_URL=https://salyasdance.app/release
Kaushika_APP_URL=https://shrinrityalaya.app/release
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
- Kausalya access & WAITING state with hidden gifts
- Kaushika access & atomic COUNTDOWN deadline trigger
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
| **2. Invitation Page & Layout** | View at 320pxâ€“430px viewport on Safari / Chrome Mobile. | Single-column, no horizontal scroll, high-contrast text, regal maroon/gold palette. |
| **3. Recording Consent** | Tap "Begin Your Surprise". Screen shows honest disclosures. | Explains reaction recording, private storage, and optional nature. Tap "Continue Without Recording" to proceed without camera. |
| **4. Invalid Access Code** | Enter `WRONG123` on Access Code screen. | Red error banner displayed; no hint about the other sister's code; rate limit protects after repeated attempts. |
| **5. Kausalya Enters `SALYA2026`** | Enter Kausalya's code on Phone 1. | Screen displays: *"Waiting for Kaushika to join your celebration..."* with glowing Diya and live sync badge. Gift links remain hidden. |
| **6. Kaushika Enters `SHRIN2026`** | Enter Kaushika's code on Phone 2. | Server immediately emits `both_ready`. Both phones simultaneously switch to the 10-to-0 countdown ring. |
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
   - `Kausalya_CODE=<your_chosen_secret_code>`
   - `Kaushika_CODE=<your_chosen_secret_code>`
   - `Kausalya_APP_URL=<verified_release_url>`
   - `Kaushika_APP_URL=<verified_release_url>`
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
