const crypto = require('crypto');

const SECRET_KEY = process.env.TOKEN_SECRET || crypto.randomBytes(32).toString('hex');

// Generate an HMAC signature for participant authentication token
function generateParticipantToken(participant, sessionId) {
  const timestamp = Date.now();
  const payload = `${participant}:${sessionId}:${timestamp}`;
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('hex');
  return Buffer.from(JSON.stringify({ participant, sessionId, timestamp, signature })).toString('base64');
}

// Verify an authentication token
function verifyParticipantToken(tokenString) {
  try {
    if (!tokenString) return null;
    const decoded = JSON.parse(Buffer.from(tokenString, 'base64').toString('utf8'));
    const { participant, sessionId, timestamp, signature } = decoded;

    if (!participant || !sessionId || !timestamp || !signature) return null;

    // Check token freshness (valid for 24 hours)
    if (Date.now() - timestamp > 24 * 60 * 60 * 1000) return null;

    const expectedPayload = `${participant}:${sessionId}:${timestamp}`;
    const expectedSig = crypto.createHmac('sha256', SECRET_KEY).update(expectedPayload).digest('hex');

    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return { participant, sessionId };
    }
  } catch (err) {
    return null;
  }
  return null;
}

module.exports = {
  generateParticipantToken,
  verifyParticipantToken
};
