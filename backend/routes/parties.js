// routes/parties.js — Political Parties Routes
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// ── GET /api/parties — List all parties ───────────────────────
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = 'SELECT * FROM parties WHERE is_active = TRUE';
    const params = [];

    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name_en ILIKE $${params.length} OR name_ta ILIKE $${params.length} OR abbreviation ILIKE $${params.length})`;
    }
    query += ' ORDER BY category, name_en';

    const result = await db.query(query, params);
    res.json({ success: true, parties: result.rows, total: result.rowCount });
  } catch (err) {
    console.error('Get parties error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch parties.' });
  }
});

// ── GET /api/parties/:id — Single party ───────────────────────
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM parties WHERE id = $1 AND is_active = TRUE',
      [req.params.id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Party not found' });
    }
    res.json({ success: true, party: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch party.' });
  }
});

// ── POST /api/parties — Create party (admin only) ─────────────
router.post('/', authenticateToken, requireRole('super_admin'), async (req, res) => {
  const {
    name_en, name_ta, abbreviation, category,
    symbol_description, headquarters, founded_year,
    primary_color, secondary_color,
  } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO parties
         (name_en, name_ta, abbreviation, category, symbol_description,
          headquarters, founded_year, primary_color, secondary_color)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [name_en, name_ta, abbreviation, category, symbol_description,
       headquarters, founded_year, primary_color, secondary_color]
    );
    res.status(201).json({ success: true, party: result.rows[0] });
  } catch (err) {
    console.error('Create party error:', err);
    res.status(500).json({ success: false, message: 'Failed to create party.' });
  }
});

module.exports = router;
