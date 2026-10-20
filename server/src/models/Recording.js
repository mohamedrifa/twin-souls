const mongoose = require('mongoose');

const RecordingSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  participant: {
    type: String,
    enum: ['kowsalya', 'kowsika'],
    required: true
  },
  status: {
    type: String,
    enum: ['recording', 'uploading', 'completed', 'failed'],
    default: 'recording'
  },
  fileKey: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  mp4FileKey: {
    type: String,
    default: null
  },
  mp4FilePath: {
    type: String,
    default: null
  },
  mimeType: {
    type: String,
    default: 'video/webm'
  },
  totalBytes: {
    type: Number,
    default: 0
  },
  totalChunks: {
    type: Number,
    default: 0
  },
  consentGranted: {
    type: Boolean,
    default: false
  },
  consentGivenAt: {
    type: Date,
    default: null
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

RecordingSchema.index({ sessionId: 1, participant: 1 });

module.exports = mongoose.model('Recording', RecordingSchema);
