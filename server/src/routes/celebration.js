const express = require('express');
const router = express.Router();
const { codeVerificationLimiter } = require('../middleware/rateLimiter');
const {
  verifyAccessCode,
  getOrCreateSession,
  recordParticipantJoin,
  checkAndAuthorizeReveal,
  serializeClientState,
  resetSessionState
} = require('../services/sessionService');
const { generateParticipantToken, verifyParticipantToken } = require('../services/tokenService');

// Middleware to extract participant from bearer token
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];
  const verified = verifyParticipantToken(token);
  if (!verified) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session token' });
  }

  req.auth = verified;
  next();
}

// 1. Verify access code (Rate-limited, timing-safe)
router.post('/verify-code', codeVerificationLimiter, async (req, res) => {
  try {
    const { code, sessionId = process.env.SESSION_ID || 'birthday-2026', consentToRecord = false } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please enter your unique access code.'
      });
    }

    const verification = verifyAccessCode(code);
    if (!verification.valid) {
      return res.status(401).json({
        success: false,
        message: 'That code does not match our records. Please verify your private access code.'
      });
    }

    const { participant, displayName, academy, twinName } = verification;
    const token = generateParticipantToken(participant, sessionId);

    // Record participant join in the session
    const ip = req.ip || req.headers['x-forwarded-for'];
    const { session, justStartedCountdown } = await recordParticipantJoin(sessionId, participant, {
      consentToRecord,
      ip
    });

    const clientState = serializeClientState(session, participant);

    return res.json({
      success: true,
      participant,
      displayName,
      academy,
      twinName,
      token,
      sessionState: clientState,
      justStartedCountdown
    });
  } catch (err) {
    console.error('Error in /verify-code:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// 2. Get current session state (requires participant auth)
router.get('/session/:sessionId', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await checkAndAuthorizeReveal(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Celebration session not found' });
    }

    const clientState = serializeClientState(session, req.auth.participant);
    return res.json({ success: true, sessionState: clientState });
  } catch (err) {
    console.error('Error fetching session:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve session state' });
  }
});

// 3. Authorize gift reveal (called after countdown deadline is reached)
router.post('/authorize-reveal', requireAuth, async (req, res) => {
  try {
    const { sessionId = process.env.SESSION_ID || 'birthday-2026' } = req.body;
    const session = await checkAndAuthorizeReveal(sessionId);
    const clientState = serializeClientState(session, req.auth.participant);

    return res.json({
      success: true,
      revealed: clientState.status === 'REVEALED',
      sessionState: clientState
    });
  } catch (err) {
    console.error('Error in /authorize-reveal:', err);
    return res.status(500).json({ success: false, message: 'Server authorization check failed' });
  }
});

// 4. Session reset helper (for rehearsing or resetting the surprise flow)
router.post('/reset', async (req, res) => {
  try {
    const { sessionId = process.env.SESSION_ID || 'birthday-2026', resetKey } = req.body;

    // Optional safety key check if provided in env
    if (process.env.RESET_KEY && resetKey !== process.env.RESET_KEY) {
      return res.status(403).json({ success: false, message: 'Invalid reset key' });
    }

    await resetSessionState(sessionId);

    // Notify any active sockets via IO if available
    const io = req.app.get('io');
    if (io) {
      io.to(`celebration-${sessionId}`).emit('session_restarted', {
        message: 'Celebration session was reset. Restarting for both...'
      });
      io.to(`celebration-${sessionId}`).emit('session_state', {
        status: 'WAITING',
        participants: {
          kowsalya: { joined: false, name: 'Kowsalya' },
          kowsika: { joined: false, name: 'Kowsika' }
        },
        bothJoined: false,
        countdownEndsAt: null
      });
    }

    return res.json({ success: true, message: 'Session reset to initial WAITING state for rehearsal.' });
  } catch (err) {
    console.error('Error in /reset:', err);
    return res.status(500).json({ success: false, message: 'Reset failed' });
  }
});

module.exports = router;
