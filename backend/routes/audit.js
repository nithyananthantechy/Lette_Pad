// routes/audit.js — Audit Log Routes
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { requireRole, requireVerified } = require('../middleware/rbac');

router.use(authenticateToken, requireVerified);

// ── GET /api/audit — My audit logs ───────────────────────────
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0, action } = req.query;
    let query = `
      SELECT id, action, resource_type, resource_id, ip_address, details, created_at
      FROM audit_logs
      WHERE user_id = $1
    `;
    const params = [req.user.id];

    if (action) {
      params.push(action);
      query += ` AND action = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    res.json({ success: true, logs: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs.' });
  }
});

// ── GET /api/audit/all — All logs (super admin only) ─────────
router.get('/all', requireRole('super_admin'), async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const result = await db.query(
      `SELECT al.*, u.full_name, u.email, u.role
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json({ success: true, logs: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs.' });
  }
});

module.exports = router;
