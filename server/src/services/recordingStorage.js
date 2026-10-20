const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const util = require('util');
const { execFile } = require('child_process');
const execFileAsync = util.promisify(execFile);

let ffmpegPath = null;
try {
  ffmpegPath = require('ffmpeg-static');
} catch (e) {
  console.warn('ffmpeg-static not found, raw recording will be saved without MP4 transcode:', e.message);
}

const Recording = require('../models/Recording');

const RECORDINGS_BASE_DIR = path.resolve(
  process.env.RECORDINGS_DIR || path.join(__dirname, '../../private-recordings')
);

// Ensure base storage directory exists
if (!fs.existsSync(RECORDINGS_BASE_DIR)) {
  fs.mkdirSync(RECORDINGS_BASE_DIR, { recursive: true });
}

// Generate secure random server-side filename
function generateSecureFileKey(sessionId, participant, extension = 'webm') {
  const randomSuffix = crypto.randomBytes(8).toString('hex');
  const safeSession = sessionId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeParticipant = participant.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${safeSession}_${safeParticipant}_${Date.now()}_${randomSuffix}.${extension}`;
}

// Get or initialize recording record
async function getOrCreateRecordingRecord({ sessionId, participant, mimeType = 'video/webm' }) {
  let record = await Recording.findOne({
    sessionId,
    participant,
    status: { $in: ['recording', 'uploading'] }
  });

  if (!record) {
    const ext = mimeType.toLowerCase().includes('mp4') ? 'mp4' : 'webm';
    const fileKey = generateSecureFileKey(sessionId, participant, ext);
    const filePath = path.join(RECORDINGS_BASE_DIR, fileKey);

    record = await Recording.create({
      sessionId,
      participant,
      status: 'recording',
      fileKey,
      filePath,
      mimeType,
      totalBytes: 0,
      totalChunks: 0,
      consentGranted: true,
      consentGivenAt: new Date(),
      startedAt: new Date()
    });
  }

  return record;
}

// Append uploaded chunk to private file
async function appendVideoChunk({ sessionId, participant, chunkBuffer, mimeType }) {
  const maxBytes = parseInt(process.env.MAX_RECORDING_BYTES || '104857600', 10); // 100MB default

  const record = await getOrCreateRecordingRecord({ sessionId, participant, mimeType });

  if (record.totalBytes + chunkBuffer.length > maxBytes) {
    const err = new Error('Maximum recording upload limit reached for session');
    err.status = 413;
    throw err;
  }

  // Append chunk to the private destination file
  await fs.promises.appendFile(record.filePath, chunkBuffer);

  // Update recording metadata in database
  record.totalBytes += chunkBuffer.length;
  record.totalChunks += 1;
  record.status = 'uploading';
  await record.save();

  return {
    fileKey: record.fileKey,
    totalBytes: record.totalBytes,
    totalChunks: record.totalChunks
  };
}

// Convert video to universally playable standard MP4 (H.264 + AAC + faststart)
async function convertToUniversalMp4(inputPath, outputFileKey) {
  if (!ffmpegPath) {
    console.warn('FFmpeg binary not available; skipping transcode.');
    return null;
  }

  const outputPath = path.join(RECORDINGS_BASE_DIR, outputFileKey);

  try {
    console.log(`Starting conversion to universal MP4: ${inputPath} -> ${outputPath}`);
    
    // FFmpeg arguments for crystal-clear HD MP4:
    // -y: overwrite
    // -i inputPath: input video file
    // -c:v libx264: encode to universally compatible H.264
    // -crf 20: crisp, high-definition clear video quality
    // -preset fast: clean balance of quality and encoding efficiency
    // -pix_fmt yuv420p: critical for Windows Media Player & iOS/QuickTime universal playback
    // -c:a aac: universal AAC audio
    // -b:a 128k: audio bitrate
    // -movflags +faststart: relocate moov atom to beginning of MP4 for instant streaming & seeking
    await execFileAsync(ffmpegPath, [
      '-y',
      '-i', inputPath,
      '-c:v', 'libx264',
      '-crf', '20',
      '-preset', 'fast',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      outputPath
    ]);

    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      console.log(`Successfully converted to universal MP4 (${stats.size} bytes): ${outputFileKey}`);

      // Delete raw input file (e.g. .webm) so ONLY the final .mp4 is stored in the folder!
      if (inputPath !== outputPath && fs.existsSync(inputPath)) {
        try {
          fs.unlinkSync(inputPath);
          console.log(`Removed raw temporary recording file: ${path.basename(inputPath)}`);
        } catch (unlinkErr) {
          console.warn('Could not delete raw input file:', unlinkErr.message);
        }
      }

      return { mp4FileKey: outputFileKey, mp4FilePath: outputPath };
    }
  } catch (err) {
    console.error('Error during MP4 transcode:', err.message);
  }

  return null;
}

// Finalize recording and transcode to universal MP4
async function finalizeRecording({ sessionId, participant }) {
  const record = await Recording.findOne({
    sessionId,
    participant,
    status: { $in: ['recording', 'uploading'] }
  });

  if (!record) {
    return await Recording.findOne({ sessionId, participant }).sort({ createdAt: -1 });
  }

  record.status = 'completed';
  record.completedAt = new Date();

  // If video file has content, convert to universally playable MP4 and delete raw file
  if (record.totalBytes > 0 && fs.existsSync(record.filePath)) {
    const mp4FileKey = generateSecureFileKey(sessionId, participant, 'mp4');
    const transcodeResult = await convertToUniversalMp4(record.filePath, mp4FileKey);
    if (transcodeResult) {
      record.mp4FileKey = transcodeResult.mp4FileKey;
      record.mp4FilePath = transcodeResult.mp4FilePath;
      record.fileKey = transcodeResult.mp4FileKey;
      record.filePath = transcodeResult.mp4FilePath;
      record.mimeType = 'video/mp4';
      if (fs.existsSync(transcodeResult.mp4FilePath)) {
        record.totalBytes = fs.statSync(transcodeResult.mp4FilePath).size;
      }
    }
  }

  await record.save();
  return record;
}

// Safe file lookup for authorized streaming/download
async function getRecordingFile(fileKey) {
  // Sanitize fileKey to avoid directory traversal attacks
  const safeName = path.basename(fileKey);
  const targetPath = path.join(RECORDINGS_BASE_DIR, safeName);

  if (fs.existsSync(targetPath)) {
    return targetPath;
  }
  return null;
}

module.exports = {
  RECORDINGS_BASE_DIR,
  appendVideoChunk,
  finalizeRecording,
  getOrCreateRecordingRecord,
  getRecordingFile
};
