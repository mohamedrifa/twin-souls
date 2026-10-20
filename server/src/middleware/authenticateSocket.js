const { verifyParticipantToken } = require('../services/tokenService');
const { verifyAccessCode } = require('../services/sessionService');

function authenticateSocket(socket, next) {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  const accessCode = socket.handshake.auth?.accessCode || socket.handshake.query?.accessCode;

  if (token) {
    const verified = verifyParticipantToken(token);
    if (verified) {
      socket.participant = verified.participant;
      socket.sessionId = verified.sessionId;
      return next();
    }
  }

  if (accessCode) {
    const result = verifyAccessCode(accessCode);
    if (result.valid) {
      socket.participant = result.participant;
      socket.sessionId = socket.handshake.auth?.sessionId || process.env.SESSION_ID || 'birthday-2026';
      return next();
    }
  }

  // Allow unauthenticated connection initially, but block access to celebration room events
  // unless explicit code or token is supplied in `join_celebration`.
  socket.participant = null;
  return next();
}

module.exports = authenticateSocket;
