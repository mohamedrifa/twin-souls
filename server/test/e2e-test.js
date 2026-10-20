const assert = require('assert');
const http = require('http');
const { Server } = require('socket.io');

const BASE_URL = 'http://localhost:5000';

async function ensureServerRunning() {
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (res.ok) return null;
  } catch (e) {
    // Server not running, start it
  }

  console.log('Starting internal test server on port 5000...');
  const createApp = require('../src/app');
  const { connectDB } = require('../src/services/db');
  const authenticateSocket = require('../src/middleware/authenticateSocket');
  const { setupCelebrationHandlers } = require('../src/socket/celebrationHandlers');

  await connectDB();
  const app = createApp();
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });
  app.set('io', io);
  io.use(authenticateSocket);
  setupCelebrationHandlers(io);

  await new Promise(resolve => server.listen(5000, resolve));
  return server;
}

async function runTests() {
  const internalServer = await ensureServerRunning();
  console.log('🧪 Starting End-to-End Suite for Two Souls. One Celebration...\n');

  // Test 0: Reset session to clean state
  console.log('Test 0: Resetting session to WAITING state...');
  const resetRes = await fetch(`${BASE_URL}/api/celebration/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: 'birthday-2026' })
  });
  const resetData = await resetRes.json();
  assert.strictEqual(resetData.success, true, 'Reset should succeed');
  console.log('✅ Session reset successfully\n');

  // Test 1: Health check
  console.log('Test 1: Verifying Health endpoint...');
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  const healthData = await healthRes.json();
  assert.strictEqual(healthData.status, 'ok');
  console.log('✅ Health check passed\n');

  // Test 2: Invalid code rejection
  console.log('Test 2: Submitting invalid code...');
  const invalidRes = await fetch(`${BASE_URL}/api/celebration/verify-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'WRONG_CODE_999' })
  });
  assert.strictEqual(invalidRes.status, 401, 'Invalid code must be rejected with 401');
  const invalidData = await invalidRes.json();
  assert.strictEqual(invalidData.success, false);
  console.log('✅ Invalid code correctly rejected with 401\n');

  // Test 3: Kowsalya joins with SALYA2026
  console.log('Test 3: Kowsalya authenticates with SALYA2026...');
  const kowsalyaRes = await fetch(`${BASE_URL}/api/celebration/verify-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'SALYA2026' })
  });
  assert.strictEqual(kowsalyaRes.status, 200);
  const kowsalyaData = await kowsalyaRes.json();
  assert.strictEqual(kowsalyaData.success, true);
  assert.strictEqual(kowsalyaData.participant, 'kowsalya');
  assert.strictEqual(kowsalyaData.displayName, 'Kowsalya');
  assert.strictEqual(kowsalyaData.twinName, 'Kowsika');
  assert.strictEqual(kowsalyaData.sessionState.status, 'WAITING');
  assert.strictEqual(kowsalyaData.sessionState.gifts, undefined, 'Gifts MUST NOT be exposed during WAITING');
  const kowsalyaToken = kowsalyaData.token;
  assert.ok(kowsalyaToken, 'Token should be issued for Kowsalya');
  console.log('✅ Kowsalya authenticated. State is WAITING for Kowsika. Gifts remain concealed.\n');

  // Test 4: Check state before second sister joins
  console.log('Test 4: Checking session state via Kowsalya token...');
  const checkState1 = await fetch(`${BASE_URL}/api/celebration/session/birthday-2026`, {
    headers: { Authorization: `Bearer ${kowsalyaToken}` }
  });
  const state1Data = await checkState1.json();
  assert.strictEqual(state1Data.sessionState.status, 'WAITING');
  assert.strictEqual(state1Data.sessionState.gifts, undefined, 'Gifts still concealed');
  console.log('✅ Kowsalya state verified as WAITING\n');

  // Test 5: Kowsika joins with SHRIN2026 -> Triggers atomic COUNTDOWN
  console.log('Test 5: Kowsika authenticates with SHRIN2026 (Both have now joined)...');
  const kowsikaRes = await fetch(`${BASE_URL}/api/celebration/verify-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'SHRIN2026' })
  });
  assert.strictEqual(kowsikaRes.status, 200);
  const kowsikaData = await kowsikaRes.json();
  assert.strictEqual(kowsikaData.success, true);
  assert.strictEqual(kowsikaData.participant, 'kowsika');
  assert.strictEqual(kowsikaData.displayName, 'Kowsika');
  assert.strictEqual(kowsikaData.sessionState.status, 'COUNTDOWN');
  assert.ok(kowsikaData.sessionState.countdownEndsAt, 'countdownEndsAt must be populated');
  assert.strictEqual(kowsikaData.sessionState.gifts, undefined, 'Gifts MUST NOT be exposed during COUNTDOWN');
  const kowsikaToken = kowsikaData.token;
  const originalCountdownEndsAt = kowsikaData.sessionState.countdownEndsAt;
  console.log(`✅ Both joined! Countdown started. Deadline ends at: ${new Date(originalCountdownEndsAt).toISOString()}\n`);

  // Test 6: Reconnection / Refresh test during countdown
  console.log('Test 6: Refresh/reconnect simulation for Kowsalya during countdown...');
  const reconnectRes = await fetch(`${BASE_URL}/api/celebration/session/birthday-2026`, {
    headers: { Authorization: `Bearer ${kowsalyaToken}` }
  });
  const reconnectData = await reconnectRes.json();
  assert.strictEqual(reconnectData.sessionState.status, 'COUNTDOWN');
  assert.strictEqual(reconnectData.sessionState.countdownEndsAt, originalCountdownEndsAt, 'Countdown deadline MUST NOT reset on refresh!');
  assert.strictEqual(reconnectData.sessionState.gifts, undefined, 'Gifts still concealed during refresh');
  console.log('✅ Countdown deadline preserved on refresh/reconnect without restarting!\n');

  // Test 7: Recording chunk upload test
  console.log('Test 7: Uploading video reaction chunks to private backend storage...');
  const chunkBlob = Buffer.from('mock-video-chunk-data-123456');
  const formData = new FormData();
  formData.append('mimeType', 'video/webm');
  formData.append('chunk', new Blob([chunkBlob], { type: 'video/webm' }), 'chunk.webm');

  const uploadRes = await fetch(`${BASE_URL}/api/recordings/chunk`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${kowsalyaToken}` },
    body: formData
  });
  assert.strictEqual(uploadRes.status, 200);
  const uploadData = await uploadRes.json();
  assert.strictEqual(uploadData.success, true);
  assert.ok(uploadData.totalBytes > 0);
  console.log(`✅ Chunk uploaded securely to private storage: ${uploadData.totalBytes} bytes recorded\n`);

  // Test 8: Finalize recording
  console.log('Test 8: Finalizing recording...');
  const finalizeRes = await fetch(`${BASE_URL}/api/recordings/finalize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${kowsalyaToken}`
    }
  });
  const finalizeData = await finalizeRes.json();
  assert.strictEqual(finalizeData.success, true);
  assert.strictEqual(finalizeData.status, 'completed');
  console.log('✅ Recording finalized in private vault\n');

  // Test 9: Wait for countdown deadline and verify reveal
  const msRemaining = Math.max(0, originalCountdownEndsAt - Date.now());
  console.log(`Test 9: Waiting ${Math.ceil(msRemaining / 1000)} seconds for server countdown deadline to finish...`);
  await new Promise(r => setTimeout(r, msRemaining + 500));

  console.log('Calling /api/celebration/authorize-reveal...');
  const revealRes = await fetch(`${BASE_URL}/api/celebration/authorize-reveal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${kowsikaToken}`
    },
    body: JSON.stringify({ sessionId: 'birthday-2026' })
  });
  const revealData = await revealRes.json();
  assert.strictEqual(revealData.success, true);
  assert.strictEqual(revealData.revealed, true);
  assert.strictEqual(revealData.sessionState.status, 'REVEALED');
  assert.ok(revealData.sessionState.gifts, 'Gifts must now be revealed');
  assert.ok(revealData.sessionState.gifts.kowsalyaAppUrl, 'Kowsalya app URL revealed');
  assert.ok(revealData.sessionState.gifts.kowsikaAppUrl, 'Kowsika app URL revealed');
  console.log('🎁 Gift URLs successfully and safely authorized:');
  console.log('   Salya Dance Academy:', revealData.sessionState.gifts.kowsalyaAppUrl);
  console.log('   Shrinrityalaya:', revealData.sessionState.gifts.kowsikaAppUrl);
  console.log('\n🎉 ALL 9 END-TO-END TESTS PASSED FLAWLESSLY!\n');

  if (internalServer) {
    internalServer.close();
  }
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
