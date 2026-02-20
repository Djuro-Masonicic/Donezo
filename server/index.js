require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const taskRoutes = require('./routes/tasks');
const projectRoutes = require('./routes/projects');
const tagRoutes = require('./routes/tags');
const analyticsRoutes = require('./routes/analytics');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
const allowedOrigins = [
  'http://localhost:5173',
  process.env.CLIENT_URL,
].filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());

// DB readiness guard — returns 503 with clear message if MongoDB is not connected
const requireDb = (req, res, next) => {
  const state = mongoose.connection.readyState;
  // 1 = connected, 2 = connecting
  if (state === 1 || state === 2) return next();
  res.status(503).json({
    message: 'Database not connected. Please start MongoDB and the server will reconnect automatically.',
    dbState: ['disconnected', 'connected', 'connecting', 'disconnecting'][state] || 'unknown',
  });
};

// Health check (always available)
app.get('/api/health', (req, res) => {
  const state = mongoose.connection.readyState;
  res.json({
    status: state === 1 ? 'ok' : 'degraded',
    db: ['disconnected', 'connected', 'connecting', 'disconnecting'][state] || 'unknown',
    timestamp: new Date(),
  });
});

// Routes (guarded by DB check)
app.use('/api/tasks', requireDb, taskRoutes);
app.use('/api/projects', requireDb, projectRoutes);
app.use('/api/tags', requireDb, tagRoutes);
app.use('/api/analytics', requireDb, analyticsRoutes);
app.use('/api/ai', requireDb, aiRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// Start HTTP server immediately — don't wait for MongoDB
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Connect to MongoDB with auto-reconnect
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smarttaskmanager';

const connectWithRetry = () => {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
      console.error('MongoDB connection failed, retrying in 5s...', err.message);
      setTimeout(connectWithRetry, 5000);
    });
};

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected, retrying in 5s...');
  setTimeout(connectWithRetry, 5000);
});

connectWithRetry();

module.exports = app;
