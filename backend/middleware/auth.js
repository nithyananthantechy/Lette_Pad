// middleware/auth.js — JWT Authentication Middleware
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user from DB to check if still active
    const result = await db.query(
      'SELECT id, full_name, email, phone, role, is_verified, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (!result.rows[0]) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({ success: false, message: 'Authentication error' });
  }
};

// Optional auth — doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await db.query(
      'SELECT id, full_name, email, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    req.user = result.rows[0] || null;
    next();
  } catch {
    req.user = null;
    next();
  }
};

module.exports = { authenticateToken, optionalAuth };
