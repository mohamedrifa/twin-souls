# Two Souls. One Celebration

## Twin Sisters Birthday Surprise --- Product & Implementation Plan

**Project goal:** Build a beautiful, mobile-first birthday website for
twin sisters Kowsalya and Kowsika. Each sister enters a unique access
code from a different location. When both have joined, they experience a
shared countdown and reveal two app gifts.

**Time budget:** 10 hours\
**Priority:** Reliability and gift delivery first; visual polish second.

------------------------------------------------------------------------

## 1. The Story

Kowsalya and Kowsika are twin sisters and Bharatanatyam dancers who run
separate academies:

-   **Kowsalya:** Salya's Dance Academy
-   **Kowsika:** Shrinrityalaya

The website's theme is:

> **Two Souls. One Celebration.**\
> Two journeys. Two academies. One unforgettable birthday moment.

Visual direction: - Midnight maroon, antique gold, and warm ivory -
Elegant Indian classical dance-inspired ornamentation - Subtle
diya/lotus motifs and tasteful gold particles - Beautiful typography,
soft transitions, and restrained animation - Mobile-first layout
designed primarily for phones

Do not overbuild. The emotional reveal and reliable synchronization
matter more than elaborate effects.

------------------------------------------------------------------------

## 2. Required User Journey

### Screen A --- Invitation

Show both sisters' names, the birthday theme, and a clear **Begin Your
Surprise** button.

Suggested heading: **A celebration written in rhythm.**

Keep the actual gift links and reveal message hidden until the shared
countdown finishes.

### Screen B --- Recording consent

If the recording feature is enabled, show a clear, friendly consent
screen before requesting camera permission.

The screen must explain: - The front camera will record their birthday
experience. - Whether audio will also be recorded. - Recording begins
only after they agree and camera permission is granted. - The video will
be uploaded to a private backend location. - Who can access the
recording and how it will be used. - They can decline recording and
still participate in the birthday experience, unless the organizer has a
legitimate reason to make recording a requirement.

Use a clear choice such as **Agree & Enable Camera** and **Continue
Without Recording**. Do not misrepresent why camera permission is
needed. Do not start recording secretly or conceal the fact that
recording is active.

The camera preview does not need to dominate the UI. If the preview is
omitted, still show a clear recording status/indicator and provide an
easy way to stop recording.

Request microphone permission only if audio recording is needed, and
disclose it separately. Browser permission prompts alone are not
informed consent to record.

### Screen C --- Private access

Each sister enters a separate unique access code:

-   Kowsalya's code authenticates Kowsalya.
-   Kowsika's code authenticates Kowsika.

Validate codes on the backend. Never hardcode real access codes or
secrets in public frontend code. Rate-limit invalid attempts and avoid
revealing the other sister's code.

### Screen D --- Waiting room

The first sister to join waits for the other sister.

Example for Kowsalya:

> Waiting for Kowsika to join your celebration...

Example for Kowsika:

> Waiting for Kowsalya to join your celebration...

Use a gentle diya animation and a live connection status. When the
second sister joins, update both phones immediately through Socket.IO.

### Screen E --- Shared countdown

Once both authenticated participants have joined, show a synchronized
countdown from **10 to 0**.

Use one server-created countdown deadline shared by both clients. Never
start two independent ten-second timers.

### Screen F --- Gift reveal

At zero, reveal a joint birthday message, then two separate gift cards:

-   **Salya's Dance Academy** --- Kowsalya's app release
-   **Shrinrityalaya** --- Kowsika's app release

Each card has a clear **Unlock My Gift** button linking to the correct,
tested release asset or app page.

### Screen G --- Recording finalization (if enabled)

Stop and finalize the recording at the end of the reveal, or when the
participant explicitly stops it. Upload remaining data, show upload
progress, and confirm when the upload has completed.

If recording is declined or unavailable, the birthday flow must still
work.

------------------------------------------------------------------------

## 3. Technology Stack

  -------------------------------------------------------------------------------
  Layer              Technology                                Purpose
  ------------------ ----------------------------------------- ------------------
  Frontend           React + Vite                              Mobile-first
                                                               single-page app

  Styling            Tailwind CSS                              Responsive visual
                                                               system

  Animation          Framer Motion (optional)                  Smooth transitions
                                                               and reveal

  Backend            Node.js + Express                         API, validation,
                                                               session
                                                               orchestration

  Real-time          Socket.IO                                 Live joining,
                                                               shared state,
                                                               countdown updates

  Database           MongoDB Atlas + Mongoose                  Session state and
                                                               recording metadata

  Camera             `navigator.mediaDevices.getUserMedia()`   Explicitly
                                                               authorized camera
                                                               access

  Recording          `MediaRecorder`                           Browser-side video
                                                               recording after
                                                               consent

  Video storage      Private server filesystem or persistent   Store uploaded
                     volume                                    video files

  Frontend hosting   Vercel                                    Public HTTPS
                                                               frontend

  Backend hosting    Render or another persistent Node.js host Express +
                                                               Socket.IO +
                                                               uploads
  -------------------------------------------------------------------------------

### Deployment warning

A temporary server filesystem may be erased on restart or redeploy. If
storing recordings on the backend host, configure and test a persistent
disk/volume. Confirm available storage, upload limits, and retention
policy before the event.

------------------------------------------------------------------------

## 4. Architecture

``` text
Kowsalya's phone                         Kowsika's phone
      |                                        |
      | Consent (optional recording)            | Consent (optional recording)
      | Unique access code A                    | Unique access code B
      +--------------------+--------------------+
                           |
                     HTTPS / Socket.IO
                           |
                    Node.js + Express
                           |
                  Authenticated socket room
                           |
                      MongoDB Atlas
                           |
                 Shared session + deadline

Each phone's MediaRecorder
          |
          | Chunked HTTPS upload over authenticated session
          v
Private persistent backend storage
          |
          +-- kowsalya-<session>.webm
          +-- kowsika-<session>.webm
```

-   React controls the screen and client-side camera/recording
    lifecycle.
-   Express validates access and provides session state.
-   Socket.IO broadcasts authorized state changes to both clients.
-   MongoDB persists the session status, countdown deadline, and
    recording metadata.
-   The backend authorizes transitions and upload access.
-   Video files remain outside public static directories and are not
    publicly accessible by filename.

------------------------------------------------------------------------

## 5. Session State Machine

``` text
WAITING
   |
   | Both unique participants authenticated
   v
BOTH_JOINED
   |
   | Server creates one shared countdown deadline
   v
COUNTDOWN
   |
   | Server verifies deadline reached
   v
REVEALED
```

Suggested states: - `WAITING`: Only one participant has joined. -
`COUNTDOWN`: Both participants have joined and the deadline is set. -
`REVEALED`: Countdown has completed and gifts can be displayed.

The server is authoritative. A client cannot declare the session
revealed or create a new countdown deadline.

Persist the state and deadline so refreshes, temporary disconnections,
and backend restarts do not restart the countdown.

------------------------------------------------------------------------

## 6. MongoDB Data Model

Illustrative session document:

``` js
{
  sessionId: "birthday-2026",
  status: "WAITING",
  participants: {
    kowsalya: { joined: false },
    kowsika: { joined: false }
  },
  countdownEndsAt: null,
  revealedAt: null,
  gifts: {
    kowsalyaAppUrl: process.env.KOWSALYA_APP_URL,
    kowsikaAppUrl: process.env.KOWSIKA_APP_URL
  },
  recordings: {
    kowsalya: { status: "not_started", fileKey: null },
    kowsika: { status: "not_started", fileKey: null }
  }
}
```

This is an illustrative schema. Keep access-code hashes and sensitive
configuration in server-side storage, not public session documents.
Avoid sending private recording paths to ordinary clients.

Recording metadata can include: - Participant ID - Session ID - Consent
timestamp and consent version - Recording start/end timestamps - MIME
type - Upload status - File size and storage key

Do not store more personal data than needed.

------------------------------------------------------------------------

## 7. Socket.IO Events

  -----------------------------------------------------------------------
  Event                   Direction               Purpose
  ----------------------- ----------------------- -----------------------
  `join_celebration`      Client → server         Submit access code

  `join_success`          Server → client         Confirm participant
                                                  identity

  `waiting_for_twin`      Server → client         Display waiting state

  `both_ready`            Server → both           Send shared countdown
                                                  deadline

  `session_state`         Server → client         Recover state after
                                                  reconnect

  `gift_revealed`         Server → both           Notify that gifts are
                                                  available

  `recording_status`      Client/server           Coordinate recording
                                                  status, not expose
                                                  private data

  `upload_progress`       Client → UI             Display progress for
                                                  the current participant
  -----------------------------------------------------------------------

Authenticate each socket before joining the private room. Do not trust a
client-supplied participant name by itself.

------------------------------------------------------------------------

## 8. Countdown Synchronization

When the second authenticated participant joins, the server should
perform an atomic state transition and set one deadline:

``` js
const countdownEndsAt = Date.now() + 10_000;

io.to(celebrationRoom).emit("both_ready", {
  countdownEndsAt
});
```

Client display logic can derive the remaining number from the shared
deadline:

``` jsx
const [remaining, setRemaining] = useState(10);

useEffect(() => {
  if (!countdownEndsAt) return;

  const updateCountdown = () => {
    const seconds = Math.max(
      0,
      Math.ceil((countdownEndsAt - Date.now()) / 1000)
    );

    setRemaining(seconds);
  };

  updateCountdown();
  const timer = setInterval(updateCountdown, 100);

  return () => clearInterval(timer);
}, [countdownEndsAt]);
```

This snippet is only the display logic. The complete implementation
must: - Persist the deadline. - Use an atomic server-side transition so
simultaneous join requests cannot create multiple countdowns. - Recover
the existing deadline after refresh/reconnect. - Let the server
determine when reveal is authorized. - Account for phone clock
differences with a server-clock offset/estimate if tighter
synchronization is needed.

------------------------------------------------------------------------

## 9. Camera and Recording Requirements

### Consent and permissions

-   Use HTTPS in production; camera access generally requires a secure
    context.
-   Explain recording purpose, audio/video capture, storage location,
    access, and retention before recording starts.
-   Obtain an explicit affirmative action before requesting
    camera/microphone access and starting the recorder.
-   Never disguise recording as a camera check or make the recording
    status deceptive.
-   Show a clear recording indicator and an easy stop control throughout
    the recording.
-   If permission is denied, the camera fails, or recording is
    unsupported, continue without recording.
-   Request microphone access only when audio capture is actually
    needed.

### Recording API

Use:

-   `navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false })`
    for video-only recording.
-   `MediaRecorder` after checking browser support and supported MIME
    types.
-   `MediaRecorder.isTypeSupported()` rather than assuming a particular
    format.
-   A `MediaRecorder` chunk handler to collect/upload segments safely.

For video plus audio, request audio explicitly, disclose it, and update
the consent copy.

### Mobile browser constraints

Continuous capture cannot be guaranteed if a phone locks, the user
switches apps, the browser is backgrounded, memory is exhausted, or the
operating system suspends the page. Test on the actual phones and
browsers.

Do not wait until the end to send a very large video. Upload chunks or
short segments to reduce loss risk. Handle reconnects and retry failed
chunks. If local temporary buffering is used, explain its limitations
and clear it safely after successful upload.

### Backend storage

Example private storage layout:

``` text
server/
└── private-recordings/
    └── birthday-session/
        ├── kowsalya.webm
        └── kowsika.webm
```

Implementation requirements: - Store recordings outside public static
folders. - Generate server-side filenames; never trust uploaded
filenames or paths. - Authenticate and authorize every upload. - Enforce
file-size, duration, and MIME-type limits. - Use chunk identifiers and
session ownership to prevent cross-participant writes. - Avoid placing
recordings in logs or public URLs. - Restrict access to the
administrator/authorized owner. - Define retention and deletion
procedures. - Test persistent storage and available disk space before
the event.

For a ten-hour deadline, recording is a secondary feature. First ensure
the full birthday flow works with recording disabled. Then implement and
test consentful recording if time permits.

------------------------------------------------------------------------

## 10. Mobile-First UI Guidelines

The experience is intended primarily for phones.

-   Design for narrow viewports first; test approximately 320--430 CSS
    pixels wide.
-   Use a single-column layout and generous touch targets.
-   Keep primary buttons comfortable to tap (roughly 44--48 CSS pixels
    or larger).
-   Respect safe areas and device notches.
-   Prevent horizontal scrolling.
-   Use readable text, sufficient contrast, and reduced-motion support.
-   Keep the camera preview optional and visually unobtrusive; recording
    status must still be clear if recording is active.
-   Keep the gift cards stacked vertically on mobile.
-   Avoid heavy videos and large assets that delay the experience on
    mobile data.
-   Handle orientation changes and viewport resizing.
-   Keep the countdown number large and centered.
-   Ensure the page does not depend on hover.
-   Test on both sisters' real phones and separate mobile networks.

Suggested design tokens: - Background: deep maroon / near-black plum -
Accent: antique gold - Text: warm ivory - Secondary text: muted
rose-gray - Cards: subtle maroon gradients with restrained gold borders

------------------------------------------------------------------------

## 11. Suggested Project Structure

``` text
twin-birthday/
├── client/
│   └── src/
│       ├── components/
│       │   ├── Invitation.jsx
│       │   ├── RecordingConsent.jsx
│       │   ├── AccessCode.jsx
│       │   ├── WaitingRoom.jsx
│       │   ├── Countdown.jsx
│       │   ├── GiftReveal.jsx
│       │   └── RecordingStatus.jsx
│       ├── hooks/
│       │   ├── useCelebrationSocket.js
│       │   └── useRecorder.js
│       ├── App.jsx
│       └── index.css
│
└── server/
    └── src/
        ├── models/
        │   ├── Celebration.js
        │   └── Recording.js
        ├── middleware/
        │   └── authenticateSocket.js
        ├── routes/
        │   ├── celebration.js
        │   └── recordings.js
        ├── socket/
        │   └── celebrationHandlers.js
        ├── services/
        │   └── recordingStorage.js
        ├── app.js
        └── server.js
```

Keep the UI state flow simple:

`invitation` → `consent` (if recording enabled) → `access` → `waiting` →
`countdown` → `reveal` → `upload-complete`

If recording is declined, skip recording states and continue the
celebration.

------------------------------------------------------------------------

## 12. Ten-Hour Schedule

  -----------------------------------------------------------------------
  Time                    Work                    Deliverable
  ----------------------- ----------------------- -----------------------
  Hour 1                  Set up Vite, Tailwind,  Running starter project
                          Express, Socket.IO,     
                          MongoDB                 

  Hours 2--3              Access validation,      Reliable two-person
                          socket room, state      session
                          machine, shared         
                          deadline                

  Hours 4--5              Invitation, access,     Complete working
                          waiting, countdown,     birthday flow
                          gift reveal             

  Hour 6                  Add verified app links  Gifts work end to end
                          and personal birthday   
                          message                 

  Hour 7                  Polish mobile UI,       Presentation-ready
                          transitions, typography mobile interface

  Hour 8                  Deploy frontend/backend Public HTTPS deployment
                          and configure           
                          environment             

  Hour 9                  Test both phones,       Reliability fixes
                          networks, refresh,      
                          reconnect, gift links   

  Hour 10                 Rehearse and reset the  Ready for the birthday
                          session                 
  -----------------------------------------------------------------------

**Scope rule:** If the main flow is not complete by Hour 5, postpone
recording, sound, and advanced effects. If recording is required for the
final build, allow time for device testing and upload recovery rather
than assuming the browser will record uninterrupted.

------------------------------------------------------------------------

## 13. Deployment Checklist

### Environment and deployment

-   [ ] Configure `VITE_API_URL` and `VITE_SOCKET_URL`.
-   [ ] Configure backend CORS for the deployed frontend origin.
-   [ ] Configure MongoDB Atlas credentials securely.
-   [ ] Configure secure access-code storage and rate limiting.
-   [ ] Configure persistent backend storage for recordings if enabled.
-   [ ] Verify backend WebSocket support and cold-start behavior.
-   [ ] Verify both app links on the target phones.

### Two-person session

-   [ ] Kowsalya's code works only for Kowsalya.
-   [ ] Kowsika's code works only for Kowsika.
-   [ ] First participant sees the correct waiting message.
-   [ ] Second participant joining updates both phones.
-   [ ] Both countdowns use one server deadline.
-   [ ] Refresh and reconnect do not restart the countdown.
-   [ ] Invalid codes and duplicate connections are handled safely.
-   [ ] Both gifts are revealed only when the server authorizes it.

### Recording, if enabled

-   [ ] Consent copy is clear and shown before recording.
-   [ ] Permission denial does not break the birthday flow.
-   [ ] Recording indicator and stop control remain visible.
-   [ ] Correct video/audio mode is used.
-   [ ] Chunked upload and retries work.
-   [ ] Videos are stored privately on persistent storage.
-   [ ] Upload completion is confirmed.
-   [ ] Files are accessible only to authorized people.
-   [ ] Retention and deletion behavior is documented.
-   [ ] Actual phone/browser tests are complete.

------------------------------------------------------------------------

## 14. Birthday Message

> # Two Souls. One Celebration.
>
> To my dearest Kowsalya and Kowsika ❤️
>
> Two hearts that began their journey together, two beautiful souls who
> found their rhythm in Bharatham, and two dreams that continue to
> inspire everyone around them.
>
> Through **Salya's Dance Academy** and **Shrinrityalaya**, you are
> sharing more than dance. You are passing on tradition, discipline,
> expression, and the beauty of our culture to the next generation.
>
> Today, I wanted to give you something a little different. Something
> built with love, especially for both of you.
>
> Two gifts. Two journeys. One bond that no distance can ever change.
>
> Happy Birthday, my dear sisters! May your lives always be filled with
> rhythm, grace, happiness, and countless beautiful moments.
>
> **With all my love, always. ❤️**

Personalize this message before deployment if you want to include a
family memory or a separate wish for each sister.

------------------------------------------------------------------------

## 15. Final Priorities

1.  Reliable two-person authentication and waiting room.
2.  Shared server-controlled countdown.
3.  Correct gift links and birthday message.
4.  Mobile-first polish and performance.
5.  Explicit-consent recording with private, persistent storage, only if
    time allows.
6.  Optional music and visual effects.

**Guiding principle:** The surprise is the gift reveal, not undisclosed
recording. Keep the recording purpose transparent, and keep the actual
birthday gift a secret.

------------------------------------------------------------------------

# 16. Ready-to-Paste Antigravity Prompt

Copy the prompt below into Antigravity. Provide the two real app release
URLs when asked, or add them as backend environment variables.

``` text
You are a senior full-stack engineer and mobile-first UI designer. Build a production-minded, responsive birthday surprise website called “Two Souls. One Celebration.” for twin sisters Kowsalya and Kowsika.

CONTEXT
- Kowsalya runs Salya's Dance Academy.
- Kowsika runs Shrinrityalaya.
- They will open the site on separate mobile phones from different locations.
- The site is a birthday gift reveal for two mobile apps I built for them.
- I have approximately 10 hours, so prioritize a complete, tested core experience over unnecessary features.

TECH STACK
- Frontend: React + Vite + Tailwind CSS.
- Backend: Node.js + Express.
- Realtime: Socket.IO.
- Database: MongoDB with Mongoose.
- Optional animations: Framer Motion, only if it does not slow down the core implementation.
- Deployable frontend and backend, with environment variables and HTTPS in production.

REQUIRED EXPERIENCE
1. Create a polished invitation page with the headline “A celebration written in rhythm.” Use a premium midnight-maroon, antique-gold, and ivory palette inspired by Bharatanatyam. Use tasteful ornaments, readable typography, and subtle motion.
2. If recording is implemented, show an honest recording-consent screen before requesting camera permission. Explain whether video/audio is recorded, the purpose, private backend storage, who can access it, and retention. Provide a clear agree option and a continue-without-recording option. Never record secretly or disguise recording as a camera check. Show a clear recording indicator and a stop control while recording. If permission is denied, continue the birthday flow without recording.
3. Give Kowsalya and Kowsika separate unique access codes. Validate codes on the backend; never place real codes or secrets in frontend code. Rate-limit invalid attempts and do not reveal one sister's code to the other.
4. After the first participant authenticates, show a personalized waiting page such as “Waiting for Kowsika to join your celebration…”. The other sister should see the corresponding message.
5. When both authenticated participants have joined, use a server-created, persisted countdown deadline for a shared 10-to-0 countdown. Do not start independent client timers. Use an atomic server-side transition to avoid duplicate countdowns if both join simultaneously.
6. After the deadline, the server authorizes the reveal. Show a warm joint birthday message, then two separate gift cards:
   - Salya's Dance Academy — Kowsalya's app release URL.
   - Shrinrityalaya — Kowsika's app release URL.
   Keep the real URLs in backend environment variables named KOWSALYA_APP_URL and KOWSIKA_APP_URL, and verify them before release.
7. If recording is implemented, record only after explicit consent. Use getUserMedia and MediaRecorder, detect supported formats, handle camera/microphone permission errors, upload in chunks or short segments, retry failures, and confirm when the upload completes. Store videos outside public static folders on persistent private backend storage. Generate filenames server-side, enforce file-size/type limits, authorize uploads, and do not expose public video URLs. Recording must be optional and must not block the gift reveal if unavailable.
8. Make the entire site mobile-first. Test at 320–430 CSS pixels. Use a single-column layout, large touch targets, safe-area spacing, no horizontal overflow, accessible contrast, readable text, reduced-motion support, and vertically stacked gift cards. Do not rely on hover.
9. Support refresh and reconnection: recover the current server session and countdown deadline without restarting. Handle duplicate connections, wrong codes, one participant disconnecting, and backend restarts.
10. Keep the actual gift reveal hidden until the server-authorized countdown completes.

IMPLEMENTATION RULES
- First inspect the existing workspace and preserve any useful code. If it is empty, scaffold the project.
- Build the core two-person session and gift reveal before advanced styling or recording.
- Use clean, understandable components and keep frontend and backend organized.
- Include .env.example files with placeholder values only; never commit real secrets.
- Add validation, useful error states, and clear setup instructions in README.md.
- Configure CORS for the intended frontend origin and use HTTPS in production.
- Use a persistent backend disk/volume if video recording is enabled. Do not assume a hosting provider's temporary filesystem persists.
- Keep recording metadata in MongoDB and video bytes in private filesystem storage.
- Do not claim perfect continuous mobile recording: explain and handle interruptions from tab backgrounding, phone lock, browser suspension, or low memory.
- Do not build unnecessary admin dashboards, account registration, or unrelated features.

DELIVERABLES
- Complete working frontend and backend source code.
- Responsive invitation, consent (if recording enabled), access, waiting, countdown, and gift-reveal screens.
- Socket.IO event handling and persisted session-state recovery.
- Mongoose schemas and secure backend endpoints.
- Optional consentful recording with private chunked upload, if time permits after the core flow works.
- .env.example, README.md, and local development commands.
- A manual test checklist covering both phones on separate networks, wrong codes, refresh/reconnect, countdown alignment, gift URLs, and recording consent/upload if implemented.

SUGGESTED ORDER
Phase 1: Scaffold and verify the frontend/backend run.
Phase 2: Implement authentication, shared session state, Socket.IO room, and persisted countdown.
Phase 3: Build the full birthday UI and gift reveal.
Phase 4: Test the core flow on two devices.
Phase 5: Polish mobile design.
Phase 6: Add optional recording only if enough time remains, then test on actual target phones.
Phase 7: Document deployment and final rehearsal steps.

Start by inspecting the workspace, then implement the project in small, testable steps. Do not stop after producing a plan or mockup; create the working code and explain how to run it.
```
