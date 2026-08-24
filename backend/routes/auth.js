// routes/auth.js — Authentication Routes
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const { sendAndSaveOTP, verifyOTP } = require('../services/otpService');
const { logAction, getClientIP } = require('../services/auditService');
const { authenticateToken } = require('../middleware/auth');

// ── Token generation helpers ──────────────────────────────────
const signAccessToken = (userId, role) =>
  jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });

const signRefreshToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

// ── POST /api/auth/register ───────────────────────────────────
router.post('/register', [
  body('full_name').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit Indian phone number required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').isIn(['party_admin', 'party_member', 'govt_official', 'govt_staff'])
    .withMessage('Invalid role'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { full_name, email, phone, password, role } = req.body;

  try {
    // Check duplicates
    const existing = await db.query(
      'SELECT id, full_name, email, is_verified FROM users WHERE email = $1 OR phone = $2',
      [email, phone]
    );
    if (existing.rows.length > 0) {
      const existingUser = existing.rows[0];
      if (!existingUser.is_verified) {
        const password_hash = await bcrypt.hash(password, 12);
        await db.query(
          `UPDATE users SET full_name = $1, password_hash = $2, role = $3, phone = $4, updated_at = NOW()
           WHERE id = $5`,
          [full_name, password_hash, role, phone, existingUser.id]
        );
        await sendAndSaveOTP(email, 'email_verification', full_name);
        return res.status(200).json({
          success: true,
          message: 'Account was already registered but unverified. A fresh verification OTP has been sent to your email!',
          userId: existingUser.id,
        });
      }
      return res.status(409).json({
        success: false,
        message: 'An account with this email or phone already exists. Please log in.',
      });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const result = await db.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, email, phone, role, is_verified, created_at`,
      [full_name, email, phone, password_hash, role]
    );

    const user = result.rows[0];

    // Send verification OTP
    await sendAndSaveOTP(email, 'email_verification', full_name);

    await logAction({
      userId: user.id,
      action: 'REGISTER',
      resourceType: 'user',
      resourceId: user.id,
      ipAddress: getClientIP(req),
      userAgent: req.headers['user-agent'],
      details: { email, role },
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email for the verification OTP.',
      userId: user.id,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
});

// ── POST /api/auth/verify-email ───────────────────────────────
router.post('/verify-email', [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, otp } = req.body;

  try {
    const { valid, message } = await verifyOTP(email, otp, 'email_verification');
    if (!valid) {
      return res.status(400).json({ success: false, message });
    }

    const result = await db.query(
      `UPDATE users SET is_verified = TRUE, updated_at = NOW()
       WHERE email = $1 RETURNING id, full_name, email, role`,
      [email]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = result.rows[0];

    await logAction({
      userId: user.id,
      action: 'EMAIL_VERIFIED',
      resourceType: 'user',
      resourceId: user.id,
      ipAddress: getClientIP(req),
      details: { email },
    });

    res.json({ success: true, message: 'Email verified successfully! You can now log in.' });
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ success: false, message: 'Verification failed.' });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      await logAction({
        action: 'LOGIN_FAILED',
        ipAddress: getClientIP(req),
        details: { email, reason: 'invalid_credentials' },
      });
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact support.' });
    }

    if (!user.is_verified) {
      // Resend OTP
      await sendAndSaveOTP(email, 'email_verification', user.full_name);
      return res.status(403).json({
        success: false,
        message: 'Email not verified. A new OTP has been sent to your email.',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    // Send MFA OTP
    await sendAndSaveOTP(email, 'login_mfa', user.full_name);

    await logAction({
      userId: user.id,
      action: 'LOGIN_OTP_SENT',
      ipAddress: getClientIP(req),
      details: { email },
    });

    res.json({
      success: true,
      message: 'OTP sent to your email. Please verify to complete login.',
      requiresOTP: true,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
});

// ── POST /api/auth/login/verify-otp ──────────────────────────
router.post('/login/verify-otp', [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, otp } = req.body;

  try {
    const { valid, message } = await verifyOTP(email, otp, 'login_mfa');
    if (!valid) {
      return res.status(400).json({ success: false, message });
    }

    const result = await db.query(
      `SELECT id, full_name, email, phone, role, is_verified, is_active 
       FROM users WHERE email = $1`,
      [email]
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const accessToken  = signAccessToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id);

    await logAction({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      ipAddress: getClientIP(req),
      userAgent: req.headers['user-agent'],
      details: { email, role: user.role },
    });

    res.json({
      success: true,
      message: 'Login successful!',
      accessToken,
      refreshToken,
      user: {
        id:        user.id,
        full_name: user.full_name,
        email:     user.email,
        phone:     user.phone,
        role:      user.role,
      },
    });
  } catch (err) {
    console.error('OTP verify error:', err);
    res.status(500).json({ success: false, message: 'OTP verification failed.' });
  }
});

// ── POST /api/auth/refresh ────────────────────────────────────
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'Refresh token required' });
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );
    const result = await db.query(
      'SELECT id, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );
    const user = result.rows[0];
    if (!user || !user.is_active) {
      return res.status(403).json({ success: false, message: 'Account not found or inactive' });
    }

    const newAccessToken = signAccessToken(user.id, user.role);
    res.json({ success: true, accessToken: newAccessToken });
  } catch {
    res.status(403).json({ success: false, message: 'Invalid or expired refresh token' });
  }
});

// ── POST /api/auth/forgot-password ───────────────────────────
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail(),
], async (req, res) => {
  const { email } = req.body;
  try {
    const result = await db.query('SELECT id, full_name FROM users WHERE email = $1', [email]);
    if (result.rows[0]) {
      await sendAndSaveOTP(email, 'password_reset', result.rows[0].full_name);
    }
    // Always respond success to prevent email enumeration
    res.json({ success: true, message: 'If that email exists, an OTP has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, message: 'Failed to process request.' });
  }
});

// ── POST /api/auth/reset-password ────────────────────────────
router.post('/reset-password', [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }),
  body('newPassword').isLength({ min: 8 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, otp, newPassword } = req.body;
  try {
    const { valid, message } = await verifyOTP(email, otp, 'password_reset');
    if (!valid) return res.status(400).json({ success: false, message });

    const hash = await bcrypt.hash(newPassword, 12);
    const result = await db.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2 RETURNING id',
      [hash, email]
    );

    if (result.rows[0]) {
      await logAction({
        userId: result.rows[0].id,
        action: 'PASSWORD_RESET',
        ipAddress: getClientIP(req),
        details: { email },
      });
    }

    res.json({ success: true, message: 'Password reset successful! Please log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, message: 'Password reset failed.' });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────
router.get('/me', authenticateToken, async (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;
