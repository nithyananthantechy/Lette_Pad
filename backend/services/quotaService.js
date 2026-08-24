// services/quotaService.js — Server-side Monthly Letter Quota Engine
const db = require('../config/db');

const PLAN_QUOTAS = {
  starter: 50,
  simple:  50,
  medium:  null, // Unlimited (Constituency Pro)
  custom:  null, // Unlimited (State Enterprise)
};

/**
 * Calculates current month's letter usage & quota details for a user directly from DB
 */
const getUserMonthlyQuota = async (userId) => {
  const userRes = await db.query(
    `SELECT id, role, subscription_plan, subscription_status FROM users WHERE id = $1`,
    [userId]
  );

  if (!userRes.rows[0]) {
    throw new Error('User not found');
  }

  const user = userRes.rows[0];
  const plan = user.subscription_plan || 'starter';
  const isSuperAdmin = user.role === 'super_admin';

  // Super Admin or Pro/Custom plans are Unlimited
  const rawQuota = PLAN_QUOTAS[plan] !== undefined ? PLAN_QUOTAS[plan] : 50;
  const isUnlimited = isSuperAdmin || rawQuota === null;
  const quota = isUnlimited ? null : rawQuota;

  // Count persistent letters created in the current calendar month
  const countRes = await db.query(
    `SELECT COUNT(*)::int as used_count,
            DATE_TRUNC('month', NOW()) as period_start,
            (DATE_TRUNC('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 millisecond') as period_end
     FROM generated_letters
     WHERE generated_by = $1 AND created_at >= DATE_TRUNC('month', NOW())`,
    [userId]
  );

  const used = countRes.rows[0]?.used_count || 0;
  const remaining = isUnlimited ? null : Math.max(0, quota - used);
  const period_start = countRes.rows[0]?.period_start;
  const period_end = countRes.rows[0]?.period_end;

  return {
    plan,
    quota,
    used,
    remaining,
    unlimited: isUnlimited,
    period_start,
    period_end,
  };
};

module.exports = {
  PLAN_QUOTAS,
  getUserMonthlyQuota,
};
