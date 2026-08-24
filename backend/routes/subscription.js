// routes/subscription.js — Enterprise Subscription & UPI Payment Management
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { logAction, getClientIP } = require('../services/auditService');

const UPI_DETAILS = {
  upi_id: 'nithyananthannagarajan092@oksbi',
  payee_name: 'Nithyananthan Nagarajan',
  merchant_code: 'LeadPad AI',
};

const PLANS = {
  simple: {
    id: 'simple',
    name_ta: 'எளிய திட்டம் (Starter)',
    name_en: 'Starter Plan',
    amount: 999,
    duration_days: 30,
    features: ['1 சுயவிவரம்', 'மாதம் 50 கடிதங்கள்', 'QR சரிபார்ப்பு'],
  },
  medium: {
    id: 'medium',
    name_ta: 'தொகுதி திட்டம் (Constituency Pro)',
    name_en: 'Constituency Pro Plan',
    amount: 2999,
    duration_days: 30,
    features: ['5 சுயவிவரங்கள்', 'வரம்பற்ற கடிதங்கள் & உரைகள்', '5 உதவியாளர் கணக்குகள்'],
  },
  custom: {
    id: 'custom',
    name_ta: 'மாநில நிர்வாகம் (State Enterprise)',
    name_en: 'State Enterprise Plan',
    amount: 14999,
    duration_days: 365,
    features: ['வரம்பற்ற தொகுதிகள்', 'பிரத்யேக தனி கிளவுட்', '24/7 நேரடி உதவி'],
  },
};

// ── GET /api/subscription/status — Current User's Subscription & Trial Status ──
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userRes = await db.query(
      `SELECT id, full_name, email, role, created_at,
              trial_ends_at, subscription_status, subscription_plan, subscription_ends_at,
              NOW() as server_now
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (!userRes.rows[0]) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const u = userRes.rows[0];
    const serverNow = new Date(u.server_now);

    let is_expired = false;
    let days_remaining = 0;
    let current_plan = u.subscription_plan || 'starter';
    let status = u.subscription_status || 'trial';

    if (status === 'active' && u.subscription_ends_at) {
      const ends = new Date(u.subscription_ends_at);
      const diffTime = ends - serverNow;
      days_remaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      if (diffTime <= 0) {
        is_expired = true;
        status = 'expired';
      }
    } else {
      // Trial calculation
      const trialEnds = u.trial_ends_at
        ? new Date(u.trial_ends_at)
        : new Date(new Date(u.created_at).getTime() + 7 * 24 * 60 * 60 * 1000);
      const diffTime = trialEnds - serverNow;
      days_remaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      if (diffTime <= 0) {
        is_expired = true;
        if (status !== 'pending_approval') {
          status = 'expired';
        }
      } else {
        if (status !== 'pending_approval') {
          status = 'trial';
        }
      }
    }

    res.json({
      success: true,
      subscription: {
        status,
        plan: current_plan,
        is_expired,
        days_remaining,
        trial_ends_at: u.trial_ends_at,
        subscription_ends_at: u.subscription_ends_at,
      },
      upi: UPI_DETAILS,
      plans: PLANS,
    });
  } catch (err) {
    console.error('Subscription status error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch subscription status' });
  }
});

// ── POST /api/subscription/submit-payment — Submit UPI Payment UTR (Pending Approval) ──
router.post('/submit-payment', authenticateToken, async (req, res) => {
  const { plan_id, upi_ref_no, payment_screenshot } = req.body;

  const plan = PLANS[plan_id] || PLANS.simple;
  const amount = plan.amount;
  const duration_days = plan.duration_days;

  const cleanUTR = (upi_ref_no || '').trim();
  if (!cleanUTR) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_UTR',
      message: '12-digit UPI Transaction Ref / UTR number is required.',
    });
  }

  try {
    // 1. Check for Duplicate UTR
    const dupCheck = await db.query(
      `SELECT id, user_id, plan_id, status, created_at FROM subscriptions WHERE upi_ref_no = $1`,
      [cleanUTR]
    );

    if (dupCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'DUPLICATE_UTR',
        message: 'This UPI Transaction Ref / UTR number has already been submitted.',
      });
    }

    const requested_ends_at = new Date(Date.now() + duration_days * 24 * 60 * 60 * 1000);

    // 2. Insert Payment Record with status = 'pending_approval' (Do NOT activate immediately!)
    const subRes = await db.query(
      `INSERT INTO subscriptions (user_id, plan_id, amount, upi_ref_no, payment_screenshot, status, starts_at, ends_at)
       VALUES ($1, $2, $3, $4, $5, 'pending_approval', NOW(), $6)
       RETURNING *`,
      [req.user.id, plan.id, amount, cleanUTR, payment_screenshot || null, requested_ends_at]
    );

    // 3. Mark User subscription_status as 'pending_approval'
    await db.query(
      `UPDATE users
       SET subscription_status = 'pending_approval',
           subscription_plan = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [plan.id, req.user.id]
    );

    // 4. Record Audit Trail
    await logAction({
      userId: req.user.id,
      action: 'PAYMENT_SUBMITTED',
      resourceType: 'subscription',
      resourceId: subRes.rows[0].id,
      ipAddress: getClientIP(req),
      details: {
        payment_id: subRes.rows[0].id,
        plan_id: plan.id,
        amount,
        upi_ref_no: cleanUTR,
        status: 'pending_approval',
      },
    });

    res.json({
      success: true,
      message: '✅ உங்கள் கட்டணப் பதிவு பெறப்பட்டது! முதன்மை நிர்வாகியின் சரிபார்ப்பிற்குப் பிறகு (Approval) சந்தா உடனடியாக செயல்படுத்தப்படும்.',
      subscription: subRes.rows[0],
    });
  } catch (err) {
    if (err.code === '23505') { // Postgres Unique Violation
      return res.status(400).json({
        success: false,
        error: 'DUPLICATE_UTR',
        message: 'This UPI Transaction Ref / UTR number has already been submitted.',
      });
    }
    console.error('Submit payment error:', err);
    res.status(500).json({ success: false, message: 'Failed to record payment submission.' });
  }
});

module.exports = router;
