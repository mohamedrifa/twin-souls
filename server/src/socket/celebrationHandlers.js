const mongoose = require('mongoose');
const {
  verifyAccessCode,
  getOrCreateSession,
  recordParticipantJoin,
  checkAndAuthorizeReveal,
  serializeClientState,
  resetSessionState
} = require('../services/sessionService');
const { verifyParticipantToken, generateParticipantToken } = require('../services/tokenService');

// Active countdown timer reference per session to trigger reveal broadcast
const activeTimers = new Map();

function setupCelebrationHandlers(io) {
  io.on('connection', (socket) => {
    let currentParticipant = socket.participant || null;
    let currentSessionId = socket.sessionId || process.env.SESSION_ID || 'birthday-2026';

    const getRoomName = (sessionId) => `celebration-${sessionId}`;

    // Handle join_celebration
    socket.on('join_celebration', async (data, callback) => {
      try {
        const { code, token, sessionId = process.env.SESSION_ID || 'birthday-2026', consentToRecord = false } = data || {};
        let participant = null;
        let displayName = null;
        let academy = null;
        let twinName = null;

        // 1. Authenticate via token if present
        if (token) {
          const verified = verifyParticipantToken(token);
          if (verified) {
            participant = verified.participant;
            displayName = participant === 'kowsalya' ? 'Kowsalya' : 'Kowsika';
            academy = participant === 'kowsalya' ? "Salya's Dance Academy" : 'Shrinrityalaya';
            twinName = participant === 'kowsalya' ? 'Kowsika' : 'Kowsalya';
          }
        }

        // 2. Or authenticate via access code
        if (!participant && code) {
          const result = verifyAccessCode(code);
          if (result.valid) {
            participant = result.participant;
            displayName = result.displayName;
            academy = result.academy;
            twinName = result.twinName;
          }
        }

        if (!participant) {
          if (typeof callback === 'function') {
            callback({ success: false, message: 'Invalid access credentials' });
          }
          socket.emit('auth_error', { message: 'Invalid access credentials. Please enter your code.' });
          return;
        }

        // Store identity on socket
        currentParticipant = participant;
        currentSessionId = sessionId;
        socket.participant = participant;
        socket.sessionId = sessionId;

        // Join the celebration room
        const roomName = getRoomName(sessionId);
        socket.join(roomName);

        // Record participant join in database
        const { session, justStartedCountdown } = await recordParticipantJoin(sessionId, participant, {
          socketId: socket.id,
          consentToRecord
        });

        // Issue token for reconnects
        const sessionToken = generateParticipantToken(participant, sessionId);

        const clientState = serializeClientState(session, participant);

        // Send join success to the caller
        socket.emit('join_success', {
          participant,
          displayName,
          academy,
          twinName,
          token: sessionToken,
          sessionState: clientState
        });

        if (typeof callback === 'function') {
          callback({
            success: true,
            participant,
            displayName,
            academy,
            twinName,
            token: sessionToken,
            sessionState: clientState
          });
        }

        const bothJoined = Boolean(session.participants?.kowsalya?.joined && session.participants?.kowsika?.joined);

        // Countdown can ONLY run if BOTH sisters have joined
        if (bothJoined && session.status === 'COUNTDOWN' && session.countdownEndsAt) {
          const endsAtMs = new Date(session.countdownEndsAt).getTime();
          const remainingMs = Math.max(0, endsAtMs - Date.now());

          // Broadcast both_ready AND session_state to both participants in room
          io.to(roomName).emit('both_ready', {
            countdownEndsAt: endsAtMs,
            serverTime: Date.now()
          });

          // Broadcast updated session_state so both phones have bothJoined: true
          io.to(roomName).emit('session_state', clientState);

          // Ensure server schedule for gift reveal
          scheduleServerReveal(io, sessionId, remainingMs);
        } else if (bothJoined && session.status === 'REVEALED') {
          // Already revealed AND both joined
          socket.emit('gift_revealed', {
            revealedAt: session.revealedAt ? new Date(session.revealedAt).getTime() : Date.now(),
            gifts: clientState.gifts
          });
          io.to(roomName).emit('session_state', clientState);
        } else {
          // Only one sister has joined so far -> STRICTLY WAITING ROOM
          socket.emit('waiting_for_twin', {
            sisterName: twinName,
            participant
          });

          // Notify room of waiting state
          io.to(roomName).emit('session_state', clientState);
        }
      } catch (err) {
        console.error('Socket join_celebration error:', err);
        if (typeof callback === 'function') {
          callback({ success: false, message: 'Server error processing join request' });
        }
      }
    });

    // Handle state recovery request (reconnect / refresh)
    socket.on('request_state', async (data) => {
      try {
        const sessionId = currentSessionId || data?.sessionId || process.env.SESSION_ID || 'birthday-2026';
        const session = await checkAndAuthorizeReveal(sessionId);
        if (!session) return;

        const clientState = serializeClientState(session, currentParticipant);
        socket.emit('session_state', clientState);

        if (clientState.status === 'REVEALED' && clientState.bothJoined) {
          socket.emit('gift_revealed', {
            revealedAt: clientState.revealedAt,
            gifts: clientState.gifts
          });
        }
      } catch (err) {
        console.error('Socket request_state error:', err);
      }
    });

    // Handle client countdown completion ping (verifies server authority)
    socket.on('countdown_complete', async () => {
      try {
        const session = await checkAndAuthorizeReveal(currentSessionId);
        if (session && session.status === 'REVEALED') {
          const clientState = serializeClientState(session, currentParticipant);
          io.to(getRoomName(currentSessionId)).emit('gift_revealed', {
            revealedAt: clientState.revealedAt,
            gifts: clientState.gifts
          });
        }
      } catch (err) {
        console.error('Error handling countdown_complete:', err);
      }
    });

    // Handle recording status updates
    socket.on('recording_status', (data) => {
      if (currentParticipant) {
        // Broadcast non-sensitive recording indicator to sibling
        socket.to(getRoomName(currentSessionId)).emit('twin_recording_status', {
          participant: currentParticipant,
          isRecording: Boolean(data?.isRecording)
        });
      }
    });

    socket.on('disconnect', async () => {
      // If an authenticated participant refreshes or closes the page, restart celebration for both
      if (currentParticipant && mongoose.connection.readyState === 1) {
        console.log(`Participant ${currentParticipant} disconnected/refreshed. Resetting celebration for both...`);
        
        // Cancel any pending countdown timer
        if (activeTimers.has(currentSessionId)) {
          clearTimeout(activeTimers.get(currentSessionId));
          activeTimers.delete(currentSessionId);
        }

        // Reset database state back to WAITING
        await resetSessionState(currentSessionId);

        const sisterName = currentParticipant === 'kowsalya' ? 'Kowsalya' : 'Kowsika';
        
        // Broadcast to both that session has restarted
        io.to(getRoomName(currentSessionId)).emit('session_restarted', {
          participant: currentParticipant,
          message: `${sisterName}'s screen was refreshed or disconnected. Restarting the celebration for both of you so you can experience it together!`
        });
      }
    });
  });
}

// Ensure server automatically broadcasts gift_revealed exactly when deadline finishes
function scheduleServerReveal(io, sessionId, delayMs) {
  if (activeTimers.has(sessionId)) {
    return;
  }

  const timer = setTimeout(async () => {
    try {
      activeTimers.delete(sessionId);
      const session = await checkAndAuthorizeReveal(sessionId);
      if (session && session.status === 'REVEALED') {
        const clientState = serializeClientState(session, null);
        io.to(`celebration-${sessionId}`).emit('gift_revealed', {
          revealedAt: clientState.revealedAt || Date.now(),
          gifts: clientState.gifts
        });
        io.to(`celebration-${sessionId}`).emit('session_state', clientState);
      }
    } catch (err) {
      console.error('Error in scheduled server reveal:', err);
    }
  }, Math.max(50, delayMs));

  activeTimers.set(sessionId, timer);
}

module.exports = { setupCelebrationHandlers };
