const assert = require('assert');
const http = require('http');
const { Server } = require('socket.io');
const { io: ClientIo } = require('../../client/node_modules/socket.io-client');

const createApp = require('../src/app');
const { connectDB, closeDB } = require('../src/services/db');
const authenticateSocket = require('../src/middleware/authenticateSocket');
const { setupCelebrationHandlers } = require('../src/socket/celebrationHandlers');
const { resetSessionState } = require('../src/services/sessionService');

async function testWaitingAndCountdownFlow() {
  console.log('🧪 Testing: Waiting Room and 10-Second Synchronized Countdown flow...');

  await connectDB();
  const app = createApp();
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });
  app.set('io', io);
  io.use(authenticateSocket);
  setupCelebrationHandlers(io);

  await new Promise(r => server.listen(5002, r));
  const SERVER_URL = 'http://localhost:5002';

  // 1. Reset celebration in DB
  await resetSessionState('birthday-2026');

  // 2. Connect Kowsalya socket
  const socketKowsalya = ClientIo(SERVER_URL, {
    transports: ['websocket'],
    forceNew: true
  });

  await new Promise(r => socketKowsalya.on('connect', r));
  console.log('Kowsalya socket connected.');

  // 3. Kowsalya authenticates with SALYA2026
  let kowsalyaWaitingEventReceived = false;
  socketKowsalya.on('waiting_for_twin', (data) => {
    kowsalyaWaitingEventReceived = true;
    assert.strictEqual(data.sisterName, 'Kowsika');
    console.log('✅ Kowsalya received waiting_for_twin event: waiting for Kowsika');
  });

  const kowsalyaJoinRes = await new Promise(resolve => {
    socketKowsalya.emit('join_celebration', { code: 'SALYA2026', sessionId: 'birthday-2026' }, resolve);
  });

  assert.strictEqual(kowsalyaJoinRes.success, true);
  assert.strictEqual(kowsalyaJoinRes.sessionState.status, 'WAITING', 'Status MUST be WAITING when only Kowsalya has joined');
  assert.strictEqual(kowsalyaJoinRes.sessionState.bothJoined, false, 'bothJoined MUST be false');
  assert.strictEqual(kowsalyaJoinRes.sessionState.gifts, undefined, 'Gifts MUST NOT be revealed');
  assert.strictEqual(kowsalyaJoinRes.sessionState.countdownEndsAt, null, 'countdownEndsAt MUST be null');
  console.log('✅ Kowsalya verified in WAITING room. Countdown and gifts are locked.');

  // Give 500ms to verify no premature countdown or reveal is sent
  await new Promise(r => setTimeout(r, 500));
  assert.strictEqual(kowsalyaWaitingEventReceived, true, 'waiting_for_twin event should have been emitted');

  // 4. NOW KOWSIKA CONNECTS AND JOINS
  console.log('\n--- Kowsika joins now with SHRIN2026 ---');
  const socketKowsika = ClientIo(SERVER_URL, {
    transports: ['websocket'],
    forceNew: true
  });
  await new Promise(r => socketKowsika.on('connect', r));

  let bothReadyReceivedByKowsalya = false;
  let bothReadyReceivedByKowsika = false;
  let countdownDeadline = null;

  socketKowsalya.on('both_ready', (data) => {
    bothReadyReceivedByKowsalya = true;
    countdownDeadline = data.countdownEndsAt;
    console.log('✅ Kowsalya received both_ready event! Shared deadline:', new Date(data.countdownEndsAt).toISOString());
  });

  socketKowsika.on('both_ready', (data) => {
    bothReadyReceivedByKowsika = true;
    console.log('✅ Kowsika received both_ready event! Shared deadline:', new Date(data.countdownEndsAt).toISOString());
  });

  const kowsikaJoinRes = await new Promise(resolve => {
    socketKowsika.emit('join_celebration', { code: 'SHRIN2026', sessionId: 'birthday-2026' }, resolve);
  });

  assert.strictEqual(kowsikaJoinRes.success, true);
  assert.strictEqual(kowsikaJoinRes.sessionState.status, 'COUNTDOWN', 'Status MUST now be COUNTDOWN');
  assert.strictEqual(kowsikaJoinRes.sessionState.bothJoined, true, 'bothJoined MUST now be true');
  assert.strictEqual(kowsikaJoinRes.sessionState.gifts, undefined, 'Gifts MUST STILL be locked during countdown');

  // Verify both phones received both_ready event with valid 10s deadline
  await new Promise(r => setTimeout(r, 200));
  assert.strictEqual(bothReadyReceivedByKowsalya, true, 'Kowsalya must receive both_ready');
  assert.strictEqual(bothReadyReceivedByKowsika, true, 'Kowsika must receive both_ready');
  assert.ok(countdownDeadline, 'Countdown deadline must exist');
  const msToDeadline = countdownDeadline - Date.now();
  console.log(`Countdown deadline is in ${Math.round(msToDeadline / 1000)} seconds.`);
  assert.ok(msToDeadline > 8000 && msToDeadline <= 10500, 'Countdown must be ~10 seconds');

  // Cleanup
  socketKowsalya.disconnect();
  socketKowsika.disconnect();
  await new Promise(r => setTimeout(r, 100));
  server.close();
  await closeDB();

  console.log('\n🎉 ALL WAITING & COUNTDOWN TESTS PASSED FLAWLESSLY!\n');
}

testWaitingAndCountdownFlow().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
