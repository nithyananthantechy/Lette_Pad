// routes/admin.js — Super Admin Master Control & Payment Approval API
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { logAction, getClientIP } = require('../services/auditService');

// Middleware: Require Super Admin Role strictly from server-authenticated user
const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      error: 'ACCESS_DENIED',
      message: 'Super Admin access required. Normal users cannot perform administrative actions.',
    });
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
      details: { target_user: req.params.id, new_role: role },
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
      `SELECT s.*, u.full_name as user_name, u.email as user_email, u.phone as user_phone,
              admin_user.full_name as approved_by_name
       FROM subscriptions s
       LEFT JOIN users u ON s.user_id = u.id
       LEFT JOIN users admin_user ON s.approved_by = admin_user.id
       ORDER BY s.created_at DESC`
    );
    res.json({ success: true, subscriptions: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch subscriptions' });
  }
});

// ── 6. PUT /api/admin/subscriptions/:id/approve — Atomic Payment Approval ─
router.put('/subscriptions/:id/approve', async (req, res) => {
  const { daysToAdd = 30 } = req.body;

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch and Lock Subscription Record
    const subRes = await client.query(
      'SELECT * FROM subscriptions WHERE id = $1 FOR UPDATE',
      [req.params.id]
    );

    if (!subRes.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Subscription record not found' });
    }

    const sub = subRes.rows[0];
    if (sub.status === 'approved' && sub.ends_at && new Date(sub.ends_at) > new Date()) {
      // Already active, extension mode
    }

    const starts_at = new Date();
    const ends_at = new Date(Date.now() + Number(daysToAdd) * 24 * 60 * 60 * 1000);

    // 2. Update Subscription Record to 'approved'
    await client.query(
      `UPDATE subscriptions 
       SET status = 'approved',
           approved_by = $1,
           approved_at = NOW(),
           starts_at = $2,
           ends_at = $3
       WHERE id = $4`,
      [req.user.id, starts_at, ends_at, req.params.id]
    );

    // 3. Atomically Activate User Subscription
    await client.query(
      `UPDATE users
       SET subscription_status = 'active',
           subscription_plan = $1,
           subscription_ends_at = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [sub.plan_id, ends_at, sub.user_id]
    );

    await client.query('COMMIT');

    // 4. Record Audit Trail
    await logAction({
      userId: req.user.id,
      action: 'PAYMENT_APPROVED',
      resourceType: 'subscription',
      resourceId: req.params.id,
      ipAddress: getClientIP(req),
      details: {
        approving_admin: req.user.id,
        user_id: sub.user_id,
        plan_id: sub.plan_id,
        amount: sub.amount,
        upi_ref_no: sub.upi_ref_no,
        days_granted: daysToAdd,
        ends_at: ends_at.toISOString(),
      },
    });

    await logAction({
      userId: sub.user_id,
      action: 'SUBSCRIPTION_ACTIVATED',
      resourceType: 'subscription',
      resourceId: req.params.id,
      ipAddress: getClientIP(req),
      details: {
        plan_id: sub.plan_id,
        start_date: starts_at.toISOString(),
        expiry_date: ends_at.toISOString(),
        approving_admin: req.user.id,
      },
    });

    res.json({
      success: true,
      message: `✅ Payment approved! Subscription activated and extended by ${daysToAdd} days.`,
      ends_at,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Approve payment transaction error:', err);
    res.status(500).json({ success: false, message: 'Failed to approve payment atomically.' });
  } finally {
    client.release();
  }
});

// ── 7. PUT /api/admin/subscriptions/:id/reject — Atomic Payment Rejection ─
router.put('/subscriptions/:id/reject', async (req, res) => {
  const { reason } = req.body;
  if (!reason || !reason.trim()) {
    return res.status(400).json({
      success: false,
      message: 'A rejection reason is required to reject a payment submission.',
    });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const subRes = await client.query(
      'SELECT * FROM subscriptions WHERE id = $1 FOR UPDATE',
      [req.params.id]
    );

    if (!subRes.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Subscription record not found' });
    }

    const sub = subRes.rows[0];

    // 1. Mark subscription as 'rejected'
    await client.query(
      `UPDATE subscriptions
       SET status = 'rejected',
           rejection_reason = $1,
           rejected_at = NOW(),
           approved_by = $2
       WHERE id = $3`,
      [reason.trim(), req.user.id, req.params.id]
    );

    // 2. Ensure User subscription status is set to expired if no other active sub
    await client.query(
      `UPDATE users
       SET subscription_status = 'expired',
           updated_at = NOW()
       WHERE id = $1 AND subscription_status = 'pending_approval'`,
      [sub.user_id]
    );

    await client.query('COMMIT');

    // 3. Record Audit Trail
    await logAction({
      userId: req.user.id,
      action: 'PAYMENT_REJECTED',
      resourceType: 'subscription',
      resourceId: req.params.id,
      ipAddress: getClientIP(req),
      details: {
        approving_admin: req.user.id,
        user_id: sub.user_id,
        rejection_reason: reason.trim(),
        upi_ref_no: sub.upi_ref_no,
      },
    });

    res.json({
      success: true,
      message: '❌ Payment rejected and recorded. Subscription remains inactive.',
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Reject payment error:', err);
    res.status(500).json({ success: false, message: 'Failed to reject payment.' });
  } finally {
    client.release();
  }
});

// ── 8. GET /api/admin/profiles — List all letterhead profiles ─────
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
