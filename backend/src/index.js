/**
 * Watermark Remover API - Express Server
 */
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./db');
const entitlementsRouter = require('./routes/entitlements');
const editRouter = require('./routes/edit');
const iapRouter = require('./routes/iap');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize database
initDatabase();

// Routes
app.use('/v1', entitlementsRouter);
app.use('/v1', editRouter);
app.use('/v1', iapRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', version: '1.0.0' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    code: err.code || 'INTERNAL_ERROR',
    message: err.message || 'Internal server error',
  });
});

// Start server - listen on all interfaces (0.0.0.0) for real device access
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📱 For real device, use: http://192.168.18.234:${PORT}`);
});

