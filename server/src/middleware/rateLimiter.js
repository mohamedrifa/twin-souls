const rateLimit = require('express-rate-limit');

const codeVerificationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 15, // limit each IP to 15 verification attempts per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many verification attempts from this connection. Please wait a few moments before trying again.'
  }
});

const uploadLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // allow up to 60 chunk uploads per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Upload rate limit reached. Retrying automatically in a moment.'
  }
});

module.exports = {
  codeVerificationLimiter,
  uploadLimiter
};
