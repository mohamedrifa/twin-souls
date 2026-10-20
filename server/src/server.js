require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const createApp = require('./app');
const { connectDB, closeDB } = require('./services/db');
const { resetSessionState } = require('./services/sessionService');
const authenticateSocket = require('./middleware/authenticateSocket');
const { setupCelebrationHandlers } = require('./socket/celebrationHandlers');

const PORT = parseInt(process.env.PORT || '5000', 10);

async function startServer() {
  try {
    // 1. Connect Database
    await connectDB();

    // 2. Initialize Clean Session State (WAITING for both participants)
    await resetSessionState(process.env.SESSION_ID || 'birthday-2026');
    console.log('🔄 Session initialized to clean WAITING state.');

    // 3. Initialize Express App
    const app = createApp();
    const server = http.createServer(app);

    // 3. Initialize Socket.IO
    const io = new Server(server, {
      cors: {
        origin: '*', // Allow connections from phone testing
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingTimeout: 30000,
      pingInterval: 15000
    });

    // Make io accessible to Express route handlers if needed
    app.set('io', io);

    // Socket middleware & event handlers
    io.use(authenticateSocket);
    setupCelebrationHandlers(io);

    // 4. Start listening
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`====================================================`);
      console.log(`✨ Two Souls. One Celebration Server is Running!`);
      console.log(`🚀 Port: ${PORT}`);
      console.log(`🔒 Kausalya Code: ${process.env.KOWSALYA_CODE || 'SALYA2026'}`);
      console.log(`🔒 Kaushika Code: ${process.env.KOWSIKA_CODE || 'SHRIN2026'}`);
      console.log(`🎁 Kausalya App: ${process.env.KOWSALYA_APP_URL || 'Configured'}`);
      console.log(`🎁 Kaushika App: ${process.env.KOWSIKA_APP_URL || 'Configured'}`);
      console.log(`====================================================`);
    });

    // Handle shutdown
    const handleShutdown = async (signal) => {
      console.log(`Received ${signal}. Gracefully closing server...`);
      server.close(async () => {
        await closeDB();
        console.log('Database and server closed cleanly.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));

  } catch (err) {
    console.error('Fatal startup error:', err);
    process.exit(1);
  }
}

startServer();
