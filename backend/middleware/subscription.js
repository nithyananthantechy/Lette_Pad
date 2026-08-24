// middleware/subscription.js — Subscription & 7-Day Trial Enforcement Middleware
const db = require('../config/db');

const requireActiveSubscription = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  // Super Admin always has unrestricted access
  if (req.user.role === 'super_admin') {
    return next();
  }

  try {
    const userRes = await db.query(
      `SELECT id, created_at, trial_ends_at, subscription_status, subscription_plan, subscription_ends_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (!userRes.rows[0]) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const u = userRes.rows[0];
    const now = new Date();

    // 1. Check Active Paid Subscription
    if (u.subscription_status === 'active') {
      if (u.subscription_ends_at && new Date(u.subscription_ends_at) < now) {
        // Expired active subscription
        await db.query(`UPDATE users SET subscription_status = 'expired' WHERE id = $1`, [u.id]);
        return res.status(402).json({
          success: false,
          code: 'SUBSCRIPTION_EXPIRED',
          message: 'உங்கள் சந்தாக் காலம் முடிவடைந்தது. தொடர்ந்து பயன்படுத்த Google Pay மூலம் புதுப்பிக்கவும்.',
        });
      }
      return next();
    }

    // 2. Check 7-Day Free Trial
    const trialEnds = u.trial_ends_at
      ? new Date(u.trial_ends_at)
      : new Date(new Date(u.created_at).getTime() + 7 * 24 * 60 * 60 * 1000);

    if (now > trialEnds) {
      // Trial expired
      await db.query(`UPDATE users SET subscription_status = 'expired' WHERE id = $1`, [u.id]);
      return res.status(402).json({
        success: false,
        code: 'SUBSCRIPTION_EXPIRED',
        message: 'உங்கள் 7 நாள் இலவச சோதனைக் காலம் முடிவடைந்தது. தொடர்ந்து பயன்படுத்த சந்தாவைத் தேர்ந்தெடுக்கவும்.',
      });
    }

    // Trial is still active
    next();
  } catch (err) {
    console.error('Subscription middleware error:', err);
    return res.status(500).json({ success: false, message: 'Subscription verification error' });
  }
};

module.exports = { requireActiveSubscription };
