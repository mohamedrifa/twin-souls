const crypto = require('crypto');
const Celebration = require('../models/Celebration');

const DEFAULT_SESSION_ID = process.env.SESSION_ID || 'birthday-2026';

// Timing-safe string comparison to protect against timing attacks
function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a.trim().toUpperCase());
  const bufB = Buffer.from(b.trim().toUpperCase());
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

// Map access code to participant identity
function verifyAccessCode(inputCode) {
  const kowsalyaEnvCode = process.env.KOWSALYA_CODE || 'SALYA2026';
  const kowsikaEnvCode = process.env.KOWSIKA_CODE || 'SHRIN2026';

  const isKausalya = safeCompare(inputCode, kowsalyaEnvCode) ||
                     safeCompare(inputCode, 'SALYA2026') ||
                     safeCompare(inputCode, 'KAUSALYA2026') ||
                     safeCompare(inputCode, 'KOWSALYA2026');

  if (isKausalya) {
    return {
      valid: true,
      participant: 'kowsalya',
      displayName: 'Kausalya',
      academy: "Salya's Dance Academy",
      twinName: 'Kaushika'
    };
  }

  const isKaushika = safeCompare(inputCode, kowsikaEnvCode) ||
                     safeCompare(inputCode, 'SHRIN2026') ||
                     safeCompare(inputCode, 'KAUSHIKA2026') ||
                     safeCompare(inputCode, 'KOWSIKA2026');

  if (isKaushika) {
    return {
      valid: true,
      participant: 'kowsika',
      displayName: 'Kaushika',
      academy: 'Shrinrityalaya',
      twinName: 'Kausalya'
    };
  }

  return { valid: false };
}

// Get or initialize celebration session
async function getOrCreateSession(sessionId = DEFAULT_SESSION_ID) {
  const currentKowsalyaUrl = process.env.KOWSALYA_APP_URL || 'https://github.com/mohamedrifa/Salya-s-Dance-Academy/releases/download/Mobile_App/Salya.s.Academy.apk';
  const currentKowsalyaUsername = process.env.KOWSALYA_APP_USERNAME || 'teacher@salyasacademy.com';
  const currentKowsalyaPassword = process.env.KOWSALYA_APP_PASSWORD || 'Teacher123!';

  const currentKowsikaUrl = process.env.KOWSIKA_APP_URL || 'https://github.com/mohamedrifa/ShriNrityalaya/releases/download/Mobile_App/shrinrityalaya.apk';
  const currentKowsikaUsername = process.env.KOWSIKA_APP_USERNAME || 'teacher@shrinrityalaya.com';
  const currentKowsikaPassword = process.env.KOWSIKA_APP_PASSWORD || 'Teacher@123!';

  let session = await Celebration.findOne({ sessionId });
  if (!session) {
    session = await Celebration.create({
      sessionId,
      status: 'WAITING',
      participants: {
        kowsalya: { joined: false },
        kowsika: { joined: false }
      },
      gifts: {
        kowsalyaAppUrl: currentKowsalyaUrl,
        kowsalyaUsername: currentKowsalyaUsername,
        kowsalyaPassword: currentKowsalyaPassword,
        kowsikaAppUrl: currentKowsikaUrl,
        kowsikaUsername: currentKowsikaUsername,
        kowsikaPassword: currentKowsikaPassword
      }
    });
  } else {
    // Keep stored gifts synchronized with environment configuration
    session.gifts = {
      kowsalyaAppUrl: currentKowsalyaUrl,
      kowsalyaUsername: currentKowsalyaUsername,
      kowsalyaPassword: currentKowsalyaPassword,
      kowsikaAppUrl: currentKowsikaUrl,
      kowsikaUsername: currentKowsikaUsername,
      kowsikaPassword: currentKowsikaPassword
    };
    await session.save();
  }
  return session;
}

// Mark participant as joined and handle atomic state transitions
async function recordParticipantJoin(sessionId, participant, { socketId, consentToRecord = false, ip = null }) {
  await getOrCreateSession(sessionId);

  // Update participant details
  const updateQuery = {};
  updateQuery[`participants.${participant}.joined`] = true;
  updateQuery[`participants.${participant}.joinedAt`] = new Date();
  if (socketId) updateQuery[`participants.${participant}.socketId`] = socketId;
  updateQuery[`participants.${participant}.consentToRecord`] = Boolean(consentToRecord);
  if (ip) updateQuery[`participants.${participant}.ip`] = ip;

  await Celebration.updateOne({ sessionId }, { $set: updateQuery });

  // Reload fresh session to check both participants
  let updated = await Celebration.findOne({ sessionId });
  const kowsalyaJoined = Boolean(updated.participants?.kowsalya?.joined);
  const kowsikaJoined = Boolean(updated.participants?.kowsika?.joined);

  // CRITICAL CHECK: Countdown can ONLY start if BOTH sisters have joined
  if (kowsalyaJoined && kowsikaJoined) {
    if (updated.status === 'WAITING' || updated.status === 'BOTH_JOINED') {
      // Atomic update to COUNTDOWN with server-authoritative 10s deadline
      const deadline = new Date(Date.now() + 10_000);
      const transitionResult = await Celebration.findOneAndUpdate(
        {
          sessionId,
          status: { $in: ['WAITING', 'BOTH_JOINED'] }
        },
        {
          $set: {
            status: 'COUNTDOWN',
            countdownEndsAt: deadline,
            revealedAt: null
          }
        },
        { new: true }
      );

      if (transitionResult) {
        return { session: transitionResult, justStartedCountdown: true };
      }
    }
  } else {
    // Only one sister joined so far: MUST strictly remain in WAITING state!
    await Celebration.updateOne(
      { sessionId },
      {
        $set: {
          status: 'WAITING',
          countdownEndsAt: null,
          revealedAt: null
        }
      }
    );
    updated = await Celebration.findOne({ sessionId });
  }

  return { session: updated, justStartedCountdown: false };
}

// Verify countdown deadline and authorize reveal
async function checkAndAuthorizeReveal(sessionId = DEFAULT_SESSION_ID) {
  const session = await Celebration.findOne({ sessionId });
  if (!session) return null;

  const kowsalyaJoined = Boolean(session.participants?.kowsalya?.joined);
  const kowsikaJoined = Boolean(session.participants?.kowsika?.joined);
  const bothJoined = kowsalyaJoined && kowsikaJoined;

  // If both sisters are not joined, it can NEVER be revealed or counting down!
  if (!bothJoined) {
    if (session.status !== 'WAITING') {
      await Celebration.updateOne(
        { sessionId },
        { $set: { status: 'WAITING', countdownEndsAt: null, revealedAt: null } }
      );
      session.status = 'WAITING';
      session.countdownEndsAt = null;
      session.revealedAt = null;
    }
    return session;
  }

  if (session.status === 'REVEALED') {
    return session;
  }

  if (session.status === 'COUNTDOWN' && session.countdownEndsAt) {
    const now = Date.now();
    const endsAt = new Date(session.countdownEndsAt).getTime();
    // Allow 2000ms tolerance for network latency & timer precision
    if (now >= endsAt - 2000) {
      // Atomically transition to REVEALED
      const revealed = await Celebration.findOneAndUpdate(
        { sessionId, status: 'COUNTDOWN' },
        {
          $set: {
            status: 'REVEALED',
            revealedAt: new Date()
          }
        },
        { new: true }
      );
      return revealed || session;
    }
  }

  return session;
}

// Client-safe state serialization (hiding sensitive URLs until reveal)
function serializeClientState(session, currentParticipant) {
  if (!session) return null;

  const kowsalyaJoined = Boolean(session.participants?.kowsalya?.joined);
  const kowsikaJoined = Boolean(session.participants?.kowsika?.joined);
  const bothJoined = kowsalyaJoined && kowsikaJoined;

  // REVEALED is strictly allowed ONLY if bothJoined is true AND countdown has finished
  const isRevealed = bothJoined && (
    session.status === 'REVEALED' || (
      session.status === 'COUNTDOWN' &&
      session.countdownEndsAt &&
      Date.now() >= new Date(session.countdownEndsAt).getTime()
    )
  );

  // COUNTDOWN is strictly allowed ONLY if bothJoined is true and not revealed yet
  const isCountdown = bothJoined && !isRevealed && session.status === 'COUNTDOWN' && Boolean(session.countdownEndsAt);

  // If not both joined, status is GUARANTEED to be WAITING
  const effectiveStatus = isRevealed ? 'REVEALED' : (isCountdown ? 'COUNTDOWN' : 'WAITING');

  const clientPayload = {
    sessionId: session.sessionId,
    status: effectiveStatus,
    serverTime: Date.now(),
    countdownEndsAt: isCountdown ? new Date(session.countdownEndsAt).getTime() : null,
    revealedAt: isRevealed && session.revealedAt ? new Date(session.revealedAt).getTime() : null,
    participants: {
      kowsalya: {
        joined: kowsalyaJoined,
        name: 'Kausalya',
        academy: "Salya's Dance Academy"
      },
      kowsika: {
        joined: kowsikaJoined,
        name: 'Kaushika',
        academy: 'Shrinrityalaya'
      }
    },
    bothJoined
  };

  // Only provide app gift URLs if server-authorized countdown has finished AND both joined
  // Strictly isolate gifts so each sister receives ONLY her own gift!
  if (isRevealed) {
    const kowsalyaUrl = process.env.KOWSALYA_APP_URL || session.gifts?.kowsalyaAppUrl || 'https://github.com/mohamedrifa/Salya-s-Dance-Academy/releases/download/Mobile_App/Salya.s.Academy.apk';
    const kowsalyaUsername = process.env.KOWSALYA_APP_USERNAME || session.gifts?.kowsalyaUsername || 'teacher@salyasacademy.com';
    const kowsalyaPassword = process.env.KOWSALYA_APP_PASSWORD || session.gifts?.kowsalyaPassword || 'Teacher123!';

    const kowsikaUrl = process.env.KOWSIKA_APP_URL || session.gifts?.kowsikaAppUrl || 'https://github.com/mohamedrifa/ShriNrityalaya/releases/download/Mobile_App/shrinrityalaya.apk';
    const kowsikaUsername = process.env.KOWSIKA_APP_USERNAME || session.gifts?.kowsikaUsername || 'teacher@shrinrityalaya.com';
    const kowsikaPassword = process.env.KOWSIKA_APP_PASSWORD || session.gifts?.kowsikaPassword || 'Teacher@123!';

    clientPayload.gifts = {};
    if (currentParticipant === 'kowsalya') {
      clientPayload.gifts.kowsalyaAppUrl = kowsalyaUrl;
      clientPayload.gifts.username = kowsalyaUsername;
      clientPayload.gifts.password = kowsalyaPassword;
    } else if (currentParticipant === 'kowsika') {
      clientPayload.gifts.kowsikaAppUrl = kowsikaUrl;
      clientPayload.gifts.username = kowsikaUsername;
      clientPayload.gifts.password = kowsikaPassword;
    } else {
      // Admin / unauthenticated fallback
      clientPayload.gifts.kowsalyaAppUrl = kowsalyaUrl;
      clientPayload.gifts.kowsalyaUsername = kowsalyaUsername;
      clientPayload.gifts.kowsalyaPassword = kowsalyaPassword;
      clientPayload.gifts.kowsikaAppUrl = kowsikaUrl;
      clientPayload.gifts.kowsikaUsername = kowsikaUsername;
      clientPayload.gifts.kowsikaPassword = kowsikaPassword;
    }
  }

  return clientPayload;
}

// Reset session state completely back to initial WAITING state
async function resetSessionState(sessionId = DEFAULT_SESSION_ID) {
  const currentKowsalyaUrl = process.env.KOWSALYA_APP_URL || 'https://github.com/mohamedrifa/Salya-s-Dance-Academy/releases/download/Mobile_App/Salya.s.Academy.apk';
  const currentKowsalyaUsername = process.env.KOWSALYA_APP_USERNAME || 'teacher@salyasacademy.com';
  const currentKowsalyaPassword = process.env.KOWSALYA_APP_PASSWORD || 'Teacher123!';

  const currentKowsikaUrl = process.env.KOWSIKA_APP_URL || 'https://github.com/mohamedrifa/ShriNrityalaya/releases/download/Mobile_App/shrinrityalaya.apk';
  const currentKowsikaUsername = process.env.KOWSIKA_APP_USERNAME || 'teacher@shrinrityalaya.com';
  const currentKowsikaPassword = process.env.KOWSIKA_APP_PASSWORD || 'Teacher@123!';

  const resetData = {
    status: 'WAITING',
    participants: {
      kowsalya: { joined: false, socketId: null, joinedAt: null, consentToRecord: false },
      kowsika: { joined: false, socketId: null, joinedAt: null, consentToRecord: false }
    },
    gifts: {
      kowsalyaAppUrl: currentKowsalyaUrl,
      kowsalyaUsername: currentKowsalyaUsername,
      kowsalyaPassword: currentKowsalyaPassword,
      kowsikaAppUrl: currentKowsikaUrl,
      kowsikaUsername: currentKowsikaUsername,
      kowsikaPassword: currentKowsikaPassword
    },
    countdownEndsAt: null,
    revealedAt: null
  };

  await Celebration.findOneAndUpdate(
    { sessionId },
    { $set: resetData },
    { upsert: true }
  );

  return await Celebration.findOne({ sessionId });
}

module.exports = {
  verifyAccessCode,
  getOrCreateSession,
  recordParticipantJoin,
  checkAndAuthorizeReveal,
  serializeClientState,
  resetSessionState
};
