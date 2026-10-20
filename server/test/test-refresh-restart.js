const assert = require('assert');
const http = require('http');
const { Server } = require('socket.io');
const { io: ClientIo } = require('../../client/node_modules/socket.io-client');

const createApp = require('../src/app');
const { connectDB, closeDB } = require('../src/services/db');
const authenticateSocket = require('../src/middleware/authenticateSocket');
const { setupCelebrationHandlers } = require('../src/socket/celebrationHandlers');
const Celebration = require('../src/models/Celebration');

async function testRefreshRestart() {
  console.log('🧪 Testing: Refresh on one user restarts session for BOTH...');

  await connectDB();
  const app = createApp();
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });
  app.set('io', io);
  io.use(authenticateSocket);
  setupCelebrationHandlers(io);

  await new Promise(r => server.listen(5001, r));
  const SERVER_URL = 'http://localhost:5001';

  // 1. Reset celebration in DB
  await Celebration.updateOne(
    { sessionId: 'birthday-2026' },
    {
      $set: {
        status: 'WAITING',
        'participants.kowsalya.joined': false,
        'participants.kowsika.joined': false,
        countdownEndsAt: null,
        revealedAt: null
      }
    },
    { upsert: true }
  );

  // 2. Connect Kowsalya socket
  const socketKowsalya = ClientIo(SERVER_URL, {
    transports: ['websocket'],
    forceNew: true
  });

  // 3. Connect Kowsika socket
  const socketKowsika = ClientIo(SERVER_URL, {
    transports: ['websocket'],
    forceNew: true
  });

  await Promise.all([
    new Promise(r => socketKowsalya.on('connect', r)),
    new Promise(r => socketKowsika.on('connect', r))
  ]);

  console.log('Both test sockets connected to test server.');

  // 4. Authenticate Kowsalya with SALYA2026
  await new Promise(resolve => {
    socketKowsalya.emit('join_celebration', { code: 'SALYA2026', sessionId: 'birthday-2026' }, resolve);
  });
  console.log('Kowsalya joined successfully.');

  // 5. Authenticate Kowsika with SHRIN2026
  await new Promise(resolve => {
    socketKowsika.emit('join_celebration', { code: 'SHRIN2026', sessionId: 'birthday-2026' }, resolve);
  });
  console.log('Kowsika joined successfully. Both joined!');

  // Verify both joined in DB
  let session = await Celebration.findOne({ sessionId: 'birthday-2026' });
  assert.strictEqual(session.status, 'COUNTDOWN');
  assert.strictEqual(session.participants.kowsalya.joined, true);
  assert.strictEqual(session.participants.kowsika.joined, true);
  console.log('Countdown is active in DB.');

  // 6. NOW SIMULATE KOWSALYA REFRESHING HER BROWSER
  // (Browser closes WebSocket connection on refresh)
  console.log('\n--- Simulating Kowsalya refreshing / closing screen ---');
  
  // Set up expectation on Kowsika's socket for `session_restarted`
  const kowsikaRestartPromise = new Promise((resolve) => {
    socketKowsika.on('session_restarted', (data) => {
      console.log('✅ Kowsika received session_restarted event:', data.message);
      resolve(data);
    });
  });

  // Kowsalya refreshes (disconnects)
  socketKowsalya.disconnect();

  const restartEvent = await kowsikaRestartPromise;
  assert.ok(restartEvent, 'session_restarted event must be received by Kowsika');
  assert.strictEqual(restartEvent.participant, 'kowsalya');

  // 7. Verify session was reset in Database
  session = await Celebration.findOne({ sessionId: 'birthday-2026' });
  assert.strictEqual(session.status, 'WAITING', 'Session must be reset to WAITING');
  assert.strictEqual(session.participants.kowsalya.joined, false, 'Kowsalya must be reset to not joined');
  assert.strictEqual(session.participants.kowsika.joined, false, 'Kowsika must be reset to not joined');
  assert.strictEqual(session.countdownEndsAt, null, 'Countdown deadline must be cleared');
  console.log('✅ Database verified: Session completely reset back to initial WAITING state.');

  // Cleanup
  socketKowsika.disconnect();
  await new Promise(r => setTimeout(r, 100));
  server.close();
  await closeDB();

  console.log('\n🎉 ALL REFRESH-RESTART TESTS PASSED FLAWLESSLY!\n');
}

testRefreshRestart().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
