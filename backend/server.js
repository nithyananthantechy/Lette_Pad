// ============================================================
// server.js — Express App Entry Point
// AI Letter Pad Platform
// ============================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const app = express();

// ── Create required directories ──────────────────────────────
['uploads', 'pdfs'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ── Security Middleware ───────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// ── Rate Limiting ─────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
});

app.use(globalLimiter);
app.use(morgan('combined'));

// ── Body Parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Static Files ──────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ────────────────────────────────────────────────────
const authRoutes    = require('./routes/auth');
const partiesRoutes = require('./routes/parties');
const profileRoutes = require('./routes/profiles');
const letterRoutes  = require('./routes/letters');
const auditRoutes   = require('./routes/audit');
const verifyRoutes  = require('./routes/verify');
const intelligenceRoutes = require('./routes/intelligence');
const subscriptionRoutes = require('./routes/subscription');

app.use('/api/auth',    authLimiter, authRoutes);
app.use('/api/parties', partiesRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/letters',  letterRoutes);
app.use('/api/audit',    auditRoutes);
app.use('/api/verify',   verifyRoutes);
app.use('/api/intelligence', intelligenceRoutes);
app.use('/api/subscription', subscriptionRoutes);

// ── Health Check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'AI Letter Pad API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ── 404 Handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global Error Handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message }),
  });
});

// ── Start Server ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║   🏛️  AI Letter Pad Platform — Backend Server     ║
║   📍 http://localhost:${PORT}                        ║
║   🌐 Tamil Nadu Political & Govt Officials        ║
╚═══════════════════════════════════════════════════╝
  `);
});

module.exports = app;
