const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema({
  joined: { type: Boolean, default: false },
  joinedAt: { type: Date, default: null },
  socketId: { type: String, default: null },
  consentToRecord: { type: Boolean, default: false },
  ip: { type: String, default: null }
}, { _id: false });

const CelebrationSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: 'birthday-2026'
  },
  status: {
    type: String,
    enum: ['WAITING', 'BOTH_JOINED', 'COUNTDOWN', 'REVEALED'],
    default: 'WAITING'
  },
  participants: {
    kowsalya: { type: ParticipantSchema, default: () => ({}) },
    kowsika: { type: ParticipantSchema, default: () => ({}) }
  },
  countdownEndsAt: {
    type: Date,
    default: null
  },
  revealedAt: {
    type: Date,
    default: null
  },
  gifts: {
    kowsalyaAppUrl: { type: String, default: '' },
    kowsikaAppUrl: { type: String, default: '' }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Celebration', CelebrationSchema);
