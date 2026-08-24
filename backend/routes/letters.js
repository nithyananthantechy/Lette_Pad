// routes/letters.js — Letter Generation Routes
const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const db      = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { requireVerified }   = require('../middleware/rbac');
const { logAction, getClientIP } = require('../services/auditService');
const { generateLetterBody, improveLetterBody, translateLetter, suggestSubjects } = require('../services/aiService');
const { buildLetterHTML } = require('../services/pdfService');

router.use(authenticateToken, requireVerified);

// ── Helper: Generate unique document ID ──────────────────────
const generateDocumentId = async (partyAbbr = 'TN') => {
  const year  = new Date().getFullYear();
  const prefix = `${process.env.DOC_ID_PREFIX || 'TN'}-${partyAbbr.toUpperCase()}-${year}`;
  const countResult = await db.query(
    "SELECT COUNT(*) FROM generated_letters WHERE document_id LIKE $1",
    [`${prefix}-%`]
  );
  const seq = (parseInt(countResult.rows[0].count) + 1).toString().padStart(5, '0');
  return `${prefix}-${seq}`;
};

// ── POST /api/letters/ai/generate — AI draft a letter ────────
router.post('/ai/generate', async (req, res) => {
  const { subject, context, language, profileId, recipientName, tone } = req.body;

  if (!subject || !context) {
    return res.status(400).json({ success: false, message: 'Subject and context are required.' });
  }

  try {
    const { subject, context, language, profileId, recipientName, tone, category, constituency, district } = req.body;
    let designation = '';
    let profileConstituency = constituency || '';
    if (profileId) {
      const profileResult = await db.query(
        `SELECT lp.designation_en, lp.designation_ta, lp.party_role, lp.constituency,
                p.name_en, p.name_ta, p.abbreviation
         FROM letter_profiles lp
         LEFT JOIN parties p ON lp.party_id = p.id
         WHERE lp.id = $1 AND lp.user_id = $2`,
        [profileId, req.user.id]
      );
      if (profileResult.rows[0]) {
        const p = profileResult.rows[0];
        if (!profileConstituency && p.constituency) profileConstituency = p.constituency;
        designation = language === 'ta'
          ? `${p.party_role || p.designation_ta || p.designation_en || ''}, ${p.name_ta || p.name_en || ''}`
          : `${p.party_role || p.designation_en || ''}, ${p.name_en || ''}`;
      }
    }

    const body = await generateLetterBody({
      subject,
      context,
      category: category || 'petition',
      language: language || 'ta',
      profileType: 'party',
      designation,
      recipientName,
      tone: tone || 'formal',
      constituency: profileConstituency,
      district: district || 'ஈரோடு (Erode)',
    });

    await logAction({
      userId: req.user.id,
      action: 'AI_GENERATE_LETTER',
      ipAddress: getClientIP(req),
      details: { subject, language, profileId },
    });

    res.json({ success: true, body });
  } catch (err) {
    console.error('AI generate error:', err);
    res.status(500).json({ success: false, message: 'AI letter generation failed. Please try again.' });
  }
});

// ── POST /api/letters/ai/improve ─────────────────────────────
router.post('/ai/improve', async (req, res) => {
  const { body, language, instruction } = req.body;
  if (!body) return res.status(400).json({ success: false, message: 'Letter body required.' });

  try {
    const improved = await improveLetterBody(body, language || 'ta', instruction);
    res.json({ success: true, body: improved });
  } catch (err) {
    res.status(500).json({ success: false, message: 'AI improve failed.' });
  }
});

// ── POST /api/letters/ai/translate ───────────────────────────
router.post('/ai/translate', async (req, res) => {
  const { text, fromLang, toLang } = req.body;
  if (!text) return res.status(400).json({ success: false, message: 'Text required.' });

  try {
    const translated = await translateLetter(text, fromLang || 'ta', toLang || 'en');
    res.json({ success: true, text: translated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Translation failed.' });
  }
});

// ── POST /api/letters/ai/suggest-subjects ────────────────────
router.post('/ai/suggest-subjects', async (req, res) => {
  const { context, language } = req.body;
  if (!context) return res.status(400).json({ success: false, message: 'Context required.' });

  try {
    const subjects = await suggestSubjects(context, language || 'ta');
    res.json({ success: true, subjects });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Subject suggestions failed.' });
  }
});

// ── POST /api/letters — Save a letter (draft) ─────────────────
router.post('/', async (req, res) => {
  const {
    profile_id, subject_en, subject_ta, body_en, body_ta,
    recipient_name, recipient_address, language,
  } = req.body;

  if (!profile_id) {
    return res.status(400).json({ success: false, message: 'Profile ID required.' });
  }

  try {
    // Verify profile ownership
    const profileResult = await db.query(
      `SELECT lp.*, p.abbreviation, p.name_en, p.name_ta,
              p.primary_color, p.secondary_color, p.symbol_description
       FROM letter_profiles lp
       LEFT JOIN parties p ON lp.party_id = p.id
       WHERE lp.id = $1 AND lp.user_id = $2 AND lp.is_active = TRUE`,
      [profile_id, req.user.id]
    );

    if (!profileResult.rows[0]) {
      return res.status(403).json({ success: false, message: 'Profile not found or access denied.' });
    }

    const profile = profileResult.rows[0];
    const abbreviation = profile.abbreviation || 'GEN';
    const documentId = await generateDocumentId(abbreviation);

    // Create hash for integrity
    const content = JSON.stringify({ subject_en, subject_ta, body_en, body_ta, documentId });
    const document_hash = crypto.createHash('sha256').update(content).digest('hex');
    const qr_code_data = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${documentId}`;

    const result = await db.query(
      `INSERT INTO generated_letters
         (letter_profile_id, generated_by, document_id, subject_en, subject_ta,
          body_en, body_ta, recipient_name, recipient_address,
          document_hash, qr_code_data, language, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'draft')
       RETURNING *`,
      [
        profile_id, req.user.id, documentId,
        subject_en || null, subject_ta || null,
        body_en || null, body_ta || null,
        recipient_name || null, recipient_address || null,
        document_hash, qr_code_data, language || 'ta',
      ]
    );

    await logAction({
      userId: req.user.id,
      action: 'SAVE_LETTER_DRAFT',
      resourceType: 'letter',
      resourceId: result.rows[0].id,
      ipAddress: getClientIP(req),
      details: { documentId, profile_id },
    });

    res.status(201).json({ success: true, letter: result.rows[0] });
  } catch (err) {
    console.error('Save letter error:', err);
    res.status(500).json({ success: false, message: 'Failed to save letter.' });
  }
});

// ── GET /api/letters — My letters ─────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    let query = `
      SELECT gl.*, lp.profile_name_en, lp.profile_name_ta,
             p.name_en AS party_name, p.abbreviation
      FROM generated_letters gl
      JOIN letter_profiles lp ON gl.letter_profile_id = lp.id
      LEFT JOIN parties p ON lp.party_id = p.id
      WHERE lp.user_id = $1
    `;
    const params = [req.user.id];

    if (status) {
      params.push(status);
      query += ` AND gl.status = $${params.length}`;
    }

    query += ` ORDER BY gl.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    res.json({ success: true, letters: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch letters.' });
  }
});

// ── GET /api/letters/:id ──────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT gl.*, lp.*, p.name_en AS party_name_en, p.name_ta AS party_name_ta,
              p.abbreviation, p.primary_color, p.secondary_color, p.symbol_description
       FROM generated_letters gl
       JOIN letter_profiles lp ON gl.letter_profile_id = lp.id
       LEFT JOIN parties p ON lp.party_id = p.id
       WHERE gl.id = $1 AND lp.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Letter not found.' });
    }
    res.json({ success: true, letter: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch letter.' });
  }
});

// ── POST /api/letters/:id/export-pdf (Get HTML + finalize) ─────
router.post('/:id/export-pdf', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT gl.*, lp.*, p.name_en AS party_name_en, p.name_ta AS party_name_ta,
              p.abbreviation, p.primary_color, p.secondary_color, p.symbol_description
       FROM generated_letters gl
       JOIN letter_profiles lp ON gl.letter_profile_id = lp.id
       LEFT JOIN parties p ON lp.party_id = p.id
       WHERE gl.id = $1 AND lp.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Letter not found.' });
    }

    const letter = result.rows[0];
    const { layoutStyle, watermark, hasSeal, dispatchRef } = req.body || {};

    const { html, hash, qrDataUrl, verifyUrl } = await buildLetterHTML({
      documentId:      letter.document_id,
      profile:         letter,
      party: {
        name_en:          letter.party_name_en,
        name_ta:          letter.party_name_ta,
        abbreviation:     letter.abbreviation,
        primary_color:    letter.primary_color,
        secondary_color:  letter.secondary_color,
        symbol_description: letter.symbol_description,
      },
      subject:         letter.language === 'ta' ? letter.subject_ta : letter.subject_en,
      body:            letter.language === 'ta' ? letter.body_ta    : letter.body_en,
      recipientName:   letter.recipient_name,
      recipientAddress: letter.recipient_address,
      language:        letter.language,
      layoutStyle:     layoutStyle || letter.layout_style || 'classic',
      watermark:       watermark || 'none',
      hasSeal:         hasSeal !== undefined ? hasSeal : true,
      dispatchRef:     dispatchRef || '',
    });

    // Update letter to finalized
    await db.query(
      `UPDATE generated_letters 
       SET status = 'finalized', finalized_at = NOW(), document_hash = $1
       WHERE id = $2`,
      [hash, letter.id]
    );

    await logAction({
      userId: req.user.id,
      action: 'EXPORT_PDF',
      resourceType: 'letter',
      resourceId: letter.id,
      ipAddress: getClientIP(req),
      details: { documentId: letter.document_id },
    });

    res.json({
      success: true,
      html,
      hash,
      qrDataUrl,
      verifyUrl,
      documentId: letter.document_id,
    });
  } catch (err) {
    console.error('Export HTML/PDF error:', err);
    res.status(500).json({ success: false, message: 'Letter template generation failed.' });
  }
});

// ── POST /api/letters/:id/revoke ─────────────────────────────
router.post('/:id/revoke', async (req, res) => {
  const { reason } = req.body;
  try {
    const result = await db.query(
      `UPDATE generated_letters SET status = 'revoked', revoked_at = NOW(), revoked_reason = $1
       WHERE id = $2 AND generated_by = $3 RETURNING id, document_id`,
      [reason || 'Revoked by user', req.params.id, req.user.id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Letter not found.' });
    }

    await logAction({
      userId: req.user.id,
      action: 'REVOKE_LETTER',
      resourceType: 'letter',
      resourceId: req.params.id,
      ipAddress: getClientIP(req),
      details: { documentId: result.rows[0].document_id, reason },
    });

// ── DELETE /api/letters/:id ────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query(
      `DELETE FROM generated_letters 
       WHERE id = $1 AND generated_by = $2 
       RETURNING id, document_id`,
      [req.params.id, req.user.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Letter not found or access denied.' });
    }

    await logAction({
      userId: req.user.id,
      action: 'DELETE_LETTER',
      resourceType: 'letter',
      resourceId: req.params.id,
      ipAddress: getClientIP(req),
      details: { documentId: result.rows[0].document_id },
    });

    res.json({ success: true, message: 'Letter deleted successfully.' });
  } catch (err) {
    console.error('Delete letter error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete letter.' });
  }
});

module.exports = router;
