const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { verifyParticipantToken } = require('../services/tokenService');
const {
  appendVideoChunk,
  finalizeRecording,
  getRecordingFile,
  RECORDINGS_BASE_DIR
} = require('../services/recordingStorage');
const Recording = require('../models/Recording');

// Multer memory storage with 15MB chunk limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    // Permissive check for standard video mime types
    if (file.mimetype.startsWith('video/') || file.mimetype === 'application/octet-stream') {
      cb(null, true);
    } else {
      cb(null, true); // accept chunks from mobile devices that send generic octet-stream
    }
  }
});

// Middleware to authenticate participant for recording operations
function requireParticipant(req, res, next) {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : req.query?.token || req.body?.token;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Recording operations require authorized session token' });
  }

  const verified = verifyParticipantToken(token);
  if (!verified) {
    return res.status(401).json({ success: false, message: 'Invalid or expired recording token' });
  }

  req.auth = verified;
  next();
}

// 1. Upload video chunk
router.post('/chunk', uploadLimiter, upload.single('chunk'), requireParticipant, async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'No chunk file provided' });
    }

    const { participant, sessionId } = req.auth;
    const mimeType = req.body?.mimeType || req.file?.mimetype || 'video/webm';

    const result = await appendVideoChunk({
      sessionId,
      participant,
      chunkBuffer: req.file.buffer,
      mimeType
    });

    return res.json({
      success: true,
      message: 'Chunk uploaded successfully',
      totalBytes: result.totalBytes,
      totalChunks: result.totalChunks
    });
  } catch (err) {
    console.error('Error uploading recording chunk:', err);
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message || 'Chunk upload failed' });
  }
});

// 2. Finalize recording and transcode to universal MP4
router.post('/finalize', requireParticipant, async (req, res) => {
  try {
    const { participant, sessionId } = req.auth;
    const record = await finalizeRecording({ sessionId, participant });

    return res.json({
      success: true,
      message: 'Recording saved securely to private vault in universal MP4 format',
      totalChunks: record?.totalChunks || 0,
      totalBytes: record?.totalBytes || 0,
      fileKey: record?.fileKey,
      mp4FileKey: record?.mp4FileKey,
      status: 'completed'
    });
  } catch (err) {
    console.error('Error finalizing recording:', err);
    return res.status(500).json({ success: false, message: 'Failed to finalize recording' });
  }
});

// 3. List recordings for current session
router.get('/list', requireParticipant, async (req, res) => {
  try {
    const { sessionId } = req.auth;
    const recordings = await Recording.find({ sessionId }).sort({ createdAt: -1 });

    const safeList = recordings.map(r => ({
      participant: r.participant,
      status: r.status,
      totalBytes: r.totalBytes,
      totalChunks: r.totalChunks,
      fileKey: r.mp4FileKey || r.fileKey,
      hasMp4: Boolean(r.mp4FileKey),
      createdAt: r.createdAt,
      completedAt: r.completedAt
    }));

    return res.json({ success: true, recordings: safeList });
  } catch (err) {
    console.error('Error listing recordings:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve recordings' });
  }
});

// 4. Stream recording with HTTP 206 Partial Content support for HTML5 Video
router.get('/stream/:fileKey', requireParticipant, async (req, res) => {
  try {
    const { fileKey } = req.params;
    const filePath = await getRecordingFile(fileKey);

    if (!filePath) {
      return res.status(404).json({ success: false, message: 'Video recording not found' });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    const isMp4 = filePath.endsWith('.mp4');
    const contentType = isMp4 ? 'video/mp4' : 'video/webm';

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType
      });
      fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes'
      });
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (err) {
    console.error('Streaming error:', err);
    return res.status(500).json({ success: false, message: 'Error streaming video' });
  }
});

// 5. Download recording attachment
router.get('/download/:fileKey', requireParticipant, async (req, res) => {
  try {
    const { fileKey } = req.params;
    const filePath = await getRecordingFile(fileKey);

    if (!filePath) {
      return res.status(404).json({ success: false, message: 'Video recording not found' });
    }

    const isMp4 = filePath.endsWith('.mp4');
    const downloadName = isMp4 ? `birthday_reaction_${fileKey}` : fileKey;
    res.download(filePath, downloadName);
  } catch (err) {
    console.error('Download error:', err);
    return res.status(500).json({ success: false, message: 'Download failed' });
  }
});

module.exports = router;
