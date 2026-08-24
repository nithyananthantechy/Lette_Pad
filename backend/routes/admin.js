// routes/admin.js — Super Admin Master Control & Payment Approval API
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { logAction, getClientIP } = require('../services/auditService');

// Middleware: Require Super Admin Role
const requireSuperAdmin = (req, res, next) => {
  if (req.user?.role !== 'super_admin') {
    return res.status(403).json({ success: false, message: 'Super Admin access required' });
  }
  next();
};

router.use(authenticateToken, requireSuperAdmin);

// ── 1. GET /api/admin/stats — High-level platform metrics ────────
router.get('/stats', async (req, res) => {
  try {
    const [usersRes, subsRes, lettersRes, profilesRes] = await Promise.all([
      db.query(`SELECT COUNT(*) as total_users,
                       COUNT(*) FILTER (WHERE subscription_status = 'active') as active_subscribers,
                       COUNT(*) FILTER (WHERE subscription_status = 'trial') as trial_users
                FROM users`),
      db.query(`SELECT COUNT(*) as total_payments,
                       COALESCE(SUM(amount), 0) as total_revenue,
                       COUNT(*) FILTER (WHERE status = 'pending_approval') as pending_approvals
                FROM subscriptions`),
      db.query(`SELECT COUNT(*) as total_letters,
                       COUNT(*) FILTER (WHERE status = 'finalized') as finalized_letters
                FROM generated_letters`),
      db.query(`SELECT COUNT(*) as total_profiles,
                       COUNT(*) FILTER (WHERE profile_type = 'party_profile') as party_profiles,
                       COUNT(*) FILTER (WHERE profile_type = 'govt_profile') as govt_profiles
                FROM letter_profiles`),
    ]);

    res.json({
      success: true,
      stats: {
        users: usersRes.rows[0],
        subscriptions: subsRes.rows[0],
        letters: lettersRes.rows[0],
        profiles: profilesRes.rows[0],
      },
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch admin stats' });
  }
});

// ── 2. GET /api/admin/users — List all registered users ──────────
router.get('/users', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, full_name, email, phone, role, is_verified, is_active,
              subscription_status, subscription_plan, subscription_ends_at, trial_ends_at,
              created_at, avatar_url
       FROM users
       ORDER BY created_at DESC`
    );
    res.json({ success: true, users: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// ── 3. PUT /api/admin/users/:id/role — Change user role ──────────
router.put('/users/:id/role', async (req, res) => {
  const { role } = req.body;
  const validRoles = ['super_admin', 'party_admin', 'party_member', 'govt_official', 'govt_staff'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }

  try {
    const result = await db.query(
      'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, full_name, email, role',
      [role, req.params.id]
    );

    await logAction({
      userId: req.user.id,
      action: 'ADMIN_CHANGE_USER_ROLE',
      resourceType: 'user',
      resourceId: req.params.id,
      ipAddress: getClientIP(req),
      details: { new_role: role },
    });

    res.json({ success: true, message: 'User role updated successfully', user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update user role' });
  }
});

// ── 4. PUT /api/admin/users/:id/status — Toggle user active/suspended ─
router.put('/users/:id/status', async (req, res) => {
  const { is_active } = req.body;
  try {
    const result = await db.query(
      'UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING id, full_name, email, is_active',
      [is_active, req.params.id]
    );
    res.json({ success: true, message: 'User status updated', user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
});

// ── 5. GET /api/admin/subscriptions — List all payment records ───
router.get('/subscriptions', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT s.*, u.full_name as user_name, u.email as user_email, u.phone as user_phone
       FROM subscriptions s
       LEFT JOIN users u ON s.user_id = u.id
       ORDER BY s.created_at DESC`
    );
    res.json({ success: true, subscriptions: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch subscriptions' });
  }
});

// ── 6. PUT /api/admin/subscriptions/:id/approve — 1-Click Approve Payment ─
router.put('/subscriptions/:id/approve', async (req, res) => {
  const { daysToAdd = 30 } = req.body;
  try {
    const subRes = await db.query('SELECT * FROM subscriptions WHERE id = $1', [req.params.id]);
    if (!subRes.rows[0]) {
      return res.status(404).json({ success: false, message: 'Subscription record not found' });
    }

    const sub = subRes.rows[0];
    const newEndsAt = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);

    await db.query(
      'UPDATE subscriptions SET status = $1, ends_at = $2 WHERE id = $3',
      ['active', newEndsAt, req.params.id]
    );

    await db.query(
      `UPDATE users
       SET subscription_status = 'active',
           subscription_plan = $1,
           subscription_ends_at = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [sub.plan_id, newEndsAt, sub.user_id]
    );

    await logAction({
      userId: req.user.id,
      action: 'ADMIN_APPROVE_PAYMENT',
      resourceType: 'subscription',
      resourceId: req.params.id,
      ipAddress: getClientIP(req),
      details: { user_id: sub.user_id, plan_id: sub.plan_id, days: daysToAdd },
    });

    res.json({ success: true, message: `✅ Payment approved! Subscription extended by ${daysToAdd} days.` });
  } catch (err) {
    console.error('Approve payment error:', err);
    res.status(500).json({ success: false, message: 'Failed to approve payment' });
  }
});

// ── 7. GET /api/admin/profiles — List all letterhead profiles ─────
router.get('/profiles', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT lp.*, u.full_name as user_name, u.email as user_email,
              p.name_ta as party_name_ta, p.abbreviation, p.primary_color
       FROM letter_profiles lp
       LEFT JOIN users u ON lp.user_id = u.id
       LEFT JOIN parties p ON lp.party_id = p.id
       ORDER BY lp.created_at DESC`
    );
    res.json({ success: true, profiles: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch profiles' });
  }
});

module.exports = router;
