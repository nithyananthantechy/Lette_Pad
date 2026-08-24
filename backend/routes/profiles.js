// routes/profiles.js — Letter Profile (Letterhead) Routes
const express = require('express');
const router  = express.Router();
const { body, validationResult } = require('express-validator');
const db      = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { requireVerified }   = require('../middleware/rbac');
const { logAction, getClientIP } = require('../services/auditService');

// All profile routes require auth
router.use(authenticateToken, requireVerified);

// ── GET /api/profiles — My profiles ──────────────────────────
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT lp.*, 
              p.name_en AS party_name_en, p.name_ta AS party_name_ta,
              p.abbreviation, p.primary_color, p.secondary_color,
              p.symbol_description
       FROM letter_profiles lp
       LEFT JOIN parties p ON lp.party_id = p.id
       WHERE lp.user_id = $1
       ORDER BY lp.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, profiles: result.rows });
  } catch (err) {
    console.error('Get profiles error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch profiles.' });
  }
});

// ── GET /api/profiles/:id ─────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT lp.*, 
              p.name_en AS party_name_en, p.name_ta AS party_name_ta,
              p.abbreviation, p.primary_color, p.secondary_color,
              p.symbol_description
       FROM letter_profiles lp
       LEFT JOIN parties p ON lp.party_id = p.id
       WHERE lp.id = $1 AND (lp.user_id = $2 OR $3 = 'super_admin')`,
      [req.params.id, req.user.id, req.user.role]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    res.json({ success: true, profile: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
});

// ── POST /api/profiles — Create letterhead profile ────────────
router.post('/', [
  body('profile_type').isIn(['party_profile', 'govt_profile']),
  body('profile_name_en').trim().notEmpty().withMessage('Profile name in English is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const {
    profile_type,
    party_id,
    party_role,
    department_id,
    designation_en,
    designation_ta,
    constituency,
    profile_name_en,
    profile_name_ta,
    address_en,
    address_ta,
    phone,
    email,
    website,
    layout_style,
  } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO letter_profiles
         (user_id, profile_type, party_id, party_role, department_id,
          designation_en, designation_ta, constituency,
          profile_name_en, profile_name_ta,
          address_en, address_ta, phone, email, website, layout_style)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        req.user.id, profile_type, party_id || null, party_role || null,
        department_id || null, designation_en || null, designation_ta || null,
        constituency || null, profile_name_en, profile_name_ta || null,
        address_en || null, address_ta || null,
        phone || null, email || null, website || null,
        layout_style || 'classic',
      ]
    );

    await logAction({
      userId: req.user.id,
      action: 'CREATE_PROFILE',
      resourceType: 'profile',
      resourceId: result.rows[0].id,
      ipAddress: getClientIP(req),
      details: { profile_type, profile_name_en },
    });

    res.status(201).json({ success: true, profile: result.rows[0] });
  } catch (err) {
    console.error('Create profile error:', err);
    res.status(500).json({ success: false, message: 'Failed to create profile.' });
  }
});

// ── PUT /api/profiles/:id — Update profile ────────────────────
router.put('/:id', async (req, res) => {
  try {
    // Verify ownership
    const existing = await db.query(
      'SELECT id FROM letter_profiles WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!existing.rows[0] && req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const {
      profile_name_en, profile_name_ta, party_role,
      designation_en, designation_ta, constituency,
      address_en, address_ta, phone, email, website, layout_style,
    } = req.body;

    const result = await db.query(
      `UPDATE letter_profiles SET
         profile_name_en = COALESCE($1, profile_name_en),
         profile_name_ta = COALESCE($2, profile_name_ta),
         party_role      = COALESCE($3, party_role),
         designation_en  = COALESCE($4, designation_en),
         designation_ta  = COALESCE($5, designation_ta),
         constituency    = COALESCE($6, constituency),
         address_en      = COALESCE($7, address_en),
         address_ta      = COALESCE($8, address_ta),
         phone           = COALESCE($9, phone),
         email           = COALESCE($10, email),
         website         = COALESCE($11, website),
         layout_style    = COALESCE($12, layout_style),
         updated_at      = NOW()
       WHERE id = $13
       RETURNING *`,
      [
        profile_name_en, profile_name_ta, party_role,
        designation_en, designation_ta, constituency,
        address_en, address_ta, phone, email, website, layout_style,
        req.params.id,
      ]
    );

    await logAction({
      userId: req.user.id,
      action: 'UPDATE_PROFILE',
      resourceType: 'profile',
      resourceId: req.params.id,
      ipAddress: getClientIP(req),
    });

    res.json({ success: true, profile: result.rows[0] });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

// ── DELETE /api/profiles/:id — Soft delete ────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE letter_profiles SET is_active = FALSE, updated_at = NOW()
       WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    await logAction({
      userId: req.user.id,
      action: 'DEACTIVATE_PROFILE',
      resourceType: 'profile',
      resourceId: req.params.id,
      ipAddress: getClientIP(req),
    });

    res.json({ success: true, message: 'Profile deactivated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to deactivate profile.' });
  }
});

module.exports = router;
