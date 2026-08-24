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
              trial_ends_at, subscription_status, subscription_plan, subscription_ends_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (!userRes.rows[0]) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const u = userRes.rows[0];
    const now = new Date();

    let is_expired = false;
    let days_remaining = 0;
    let current_plan = u.subscription_plan || 'starter';
    let status = u.subscription_status || 'trial';

    if (status === 'active' && u.subscription_ends_at) {
      const ends = new Date(u.subscription_ends_at);
      const diffTime = ends - now;
      days_remaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      if (diffTime <= 0) {
        is_expired = true;
        status = 'expired';
      }
    } else {
      // Trial calculation
      const trialEnds = u.trial_ends_at ? new Date(u.trial_ends_at) : new Date(new Date(u.created_at).getTime() + 7 * 24 * 60 * 60 * 1000);
      const diffTime = trialEnds - now;
      days_remaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      if (diffTime <= 0) {
        is_expired = true;
        status = 'expired';
      } else {
        status = 'trial';
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

// ── POST /api/subscription/submit-payment — Submit UPI Payment UTR ──
router.post('/submit-payment', authenticateToken, async (req, res) => {
  const { plan_id, upi_ref_no, payment_screenshot } = req.body;

  const plan = PLANS[plan_id] || PLANS.simple;
  const amount = plan.amount;
  const duration_days = plan.duration_days;

  try {
    const ends_at = new Date(Date.now() + duration_days * 24 * 60 * 60 * 1000);

    // Save transaction
    const subRes = await db.query(
      `INSERT INTO subscriptions (user_id, plan_id, amount, upi_ref_no, payment_screenshot, status, starts_at, ends_at)
       VALUES ($1, $2, $3, $4, $5, 'active', NOW(), $6)
       RETURNING *`,
      [req.user.id, plan.id, amount, upi_ref_no || 'MANUAL_UPI_SCAN', payment_screenshot || null, ends_at]
    );

    // Update user subscription state
    await db.query(
      `UPDATE users
       SET subscription_status = 'active',
           subscription_plan = $1,
           subscription_ends_at = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [plan.id, ends_at, req.user.id]
    );

    await logAction({
      userId: req.user.id,
      action: 'SUBMIT_PAYMENT',
      resourceType: 'subscription',
      resourceId: subRes.rows[0].id,
      ipAddress: getClientIP(req),
      details: { plan_id: plan.id, amount, upi_ref_no },
    });

    res.json({
      success: true,
      message: '✅ உங்கள் கட்டணம் மற்றும் சந்தா வெற்றிகரமாக செயல்படுத்தப்பட்டது! (Subscription Activated Successfully!)',
      subscription: subRes.rows[0],
    });
  } catch (err) {
    console.error('Submit payment error:', err);
    res.status(500).json({ success: false, message: 'Failed to record payment' });
  }
});

module.exports = router;
