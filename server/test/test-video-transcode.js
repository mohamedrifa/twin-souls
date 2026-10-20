const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

const { appendVideoChunk, finalizeRecording, RECORDINGS_BASE_DIR } = require('../src/services/recordingStorage');
const { connectDB, closeDB } = require('../src/services/db');

async function testVideoProcessing() {
  console.log('🧪 Testing video transcode & universal MP4 pipeline...');

  await connectDB();

  const testSessionId = 'test-session-' + Date.now();
  const testParticipant = 'kowsalya';

  // 1. Generate a small real WebM clip using ffmpeg-static (1 second test video)
  const tempWebm = path.join(RECORDINGS_BASE_DIR, 'test_input.webm');
  console.log('Generating test input WebM clip via ffmpeg...');
  execFileSync(ffmpegPath, [
    '-y',
    '-f', 'lavfi',
    '-i', 'testsrc=duration=1.5:size=320x240:rate=24',
    '-f', 'lavfi',
    '-i', 'sine=frequency=1000:duration=1.5',
    '-c:v', 'libvpx-vp9',
    '-c:a', 'libopus',
    tempWebm
  ]);

  const webmBytes = fs.readFileSync(tempWebm);
  console.log(`Generated test WebM clip (${webmBytes.length} bytes)`);

  // 2. Simulate chunk upload
  console.log('Simulating chunk append...');
  await appendVideoChunk({
    sessionId: testSessionId,
    participant: testParticipant,
    chunkBuffer: webmBytes,
    mimeType: 'video/webm'
  });

  // 3. Finalize recording (should trigger convertToUniversalMp4)
  console.log('Finalizing recording and converting to universal MP4...');
  const record = await finalizeRecording({
    sessionId: testSessionId,
    participant: testParticipant
  });

  assert.strictEqual(record.status, 'completed');
  assert.ok(record.mp4FileKey, 'mp4FileKey must be populated');
  assert.ok(record.mp4FilePath, 'mp4FilePath must be populated');
  assert.ok(fs.existsSync(record.mp4FilePath), 'MP4 output file must exist on disk');

  const mp4Stats = fs.statSync(record.mp4FilePath);
  console.log(`✅ Universal MP4 successfully generated! Size: ${mp4Stats.size} bytes`);
  assert.ok(mp4Stats.size > 0, 'MP4 file size must be > 0');

  // 4. Verify MP4 format compatibility using ffmpeg probe
  console.log('Verifying MP4 stream metadata...');
  const probeOutput = execFileSync(ffmpegPath, ['-i', record.mp4FilePath]).toString();
  // stderr contains format information in ffmpeg
  // When ffmpeg exits with code 1 due to no output specified, stderr has the stream info
  console.log('✅ Video successfully encoded with universal compatibility!');

  // Cleanup temp files
  try {
    fs.unlinkSync(tempWebm);
    if (record.filePath && fs.existsSync(record.filePath)) fs.unlinkSync(record.filePath);
    if (record.mp4FilePath && fs.existsSync(record.mp4FilePath)) fs.unlinkSync(record.mp4FilePath);
  } catch (e) {}

  await closeDB();
  console.log('🎉 VIDEO PROCESSING & COMPATIBILITY TEST PASSED!\n');
}

testVideoProcessing().catch(err => {
  // ffmpeg with -i only prints to stderr and exits with 1, which is expected for stream inspection
  if (err.stderr && err.stderr.toString().includes('Video: h264')) {
    console.log('Stream inspection verified: Video: h264 detected!');
    console.log('🎉 VIDEO PROCESSING & COMPATIBILITY TEST PASSED!\n');
    process.exit(0);
  }
  console.error('Test error:', err);
  process.exit(1);
});
