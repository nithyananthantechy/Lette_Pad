// middleware/subscription.js — Subscription & 7-Day Trial Backend Enforcement Middleware
const db = require('../config/db');

/**
 * Reusable backend middleware that verifies the authenticated user's
 * subscription/trial status directly from the database using server time (NOW()).
 * 
 * Order of application:
 * authenticateToken -> requireVerified -> requireActiveSubscription -> route handler
 */
const requireActiveSubscription = async (req, res, next) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      success: false,
      error: 'AUTHENTICATION_REQUIRED',
      message: 'Authentication is required before subscription verification.',
    });
  }

  // Super Admin role has unrestricted governance access
  if (req.user.role === 'super_admin') {
    return next();
  }

  try {
    // Fetch fresh subscription details and server timestamp
    const result = await db.query(
      `SELECT id, created_at, trial_ends_at, subscription_status, subscription_plan, subscription_ends_at,
              NOW() as current_server_time
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User account not found.',
      });
    }

    const u = result.rows[0];
    const serverNow = new Date(u.current_server_time);

    // 1. ACTIVE PAID SUBSCRIPTION CHECK
    if (u.subscription_status === 'active') {
      if (u.subscription_ends_at && new Date(u.subscription_ends_at) < serverNow) {
        // Subscription has expired
        await db.query(
          `UPDATE users SET subscription_status = 'expired', updated_at = NOW() WHERE id = $1`,
          [u.id]
        );
        return res.status(402).json({
          error: 'SUBSCRIPTION_REQUIRED',
          message: 'Your paid subscription has expired. Please renew your subscription to continue.',
          subscription_required: true,
        });
      }
      // Active paid subscription is valid
      return next();
    }

    // 2. 7-DAY FREE TRIAL CHECK
    const trialEnds = u.trial_ends_at
      ? new Date(u.trial_ends_at)
      : new Date(new Date(u.created_at).getTime() + 7 * 24 * 60 * 60 * 1000);

    if (serverNow <= trialEnds) {
      // User is within valid 7-day trial window
      return next();
    }

    // 3. EXPIRED / PENDING APPROVAL / CANCELLED / UNPAID
    // Ensure DB status is set to expired if trial period has passed
    if (u.subscription_status === 'trial') {
      await db.query(
        `UPDATE users SET subscription_status = 'expired', updated_at = NOW() WHERE id = $1`,
        [u.id]
      );
    }

    let message = 'Your 7-day free trial has expired. Please subscribe to continue using LeadPad AI.';
    if (u.subscription_status === 'pending_approval') {
      message = 'Your payment is currently pending approval by the administrator. Access will be activated shortly.';
    } else if (u.subscription_status === 'cancelled') {
      message = 'Your subscription has been cancelled. Please choose a plan to reactivate.';
    }

    return res.status(402).json({
      error: 'SUBSCRIPTION_REQUIRED',
      message,
      subscription_required: true,
    });
  } catch (err) {
    console.error('[Subscription Middleware] Verification error:', err);
    return res.status(500).json({
      error: 'SUBSCRIPTION_CHECK_FAILED',
      message: 'Failed to verify subscription status. Please try again.',
    });
  }
};

module.exports = { requireActiveSubscription };
