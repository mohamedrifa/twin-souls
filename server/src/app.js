const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const celebrationRoutes = require('./routes/celebration');
const recordingRoutes = require('./routes/recordings');

function createApp() {
  const app = express();

  // Helmet with relaxed policy for camera / media feature permissions
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));

  // CORS configuration
  const allowedOrigins = process.env.CLIENT_ORIGIN
    ? process.env.CLIENT_ORIGIN.split(',').map(s => s.trim())
    : ['http://localhost:5173', 'http://127.0.0.1:5173'];

  app.use(cors({
    origin: (origin, callback) => {
      // Allow mobile apps, curl, or matched origins
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev/local network to allow phones on same LAN
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }));

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Two Souls. One Celebration API',
      timestamp: new Date().toISOString()
    });
  });

  // API Routes
  app.use('/api/celebration', celebrationRoutes);
  app.use('/api/recordings', recordingRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Endpoint not found' });
  });

  // Global error handler
  app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'An unexpected error occurred'
    });
  });

  return app;
}

module.exports = createApp;
