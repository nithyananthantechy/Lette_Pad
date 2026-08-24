// routes/verify.js — Public Document Verification (no auth needed)
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// ── GET /api/verify/:documentId ───────────────────────────────
// Public route to verify if a letter is authentic
router.get('/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;

    const result = await db.query(
      `SELECT gl.document_id, gl.status, gl.language,
              gl.subject_en, gl.subject_ta,
              gl.created_at, gl.finalized_at, gl.revoked_at, gl.revoked_reason,
              gl.document_hash,
              lp.profile_name_en, lp.profile_name_ta,
              lp.designation_en, lp.designation_ta, lp.party_role,
              p.name_en AS party_name_en, p.name_ta AS party_name_ta,
              p.abbreviation, p.primary_color
       FROM generated_letters gl
       JOIN letter_profiles lp ON gl.letter_profile_id = lp.id
       LEFT JOIN parties p ON lp.party_id = p.id
       WHERE gl.document_id = $1`,
      [documentId]
    );

    if (!result.rows[0]) {
      return res.json({
        success: true,
        valid: false,
        message: 'Document not found. This letter may be fake or the ID is incorrect.',
      });
    }

    const doc = result.rows[0];

    const isRevoked  = doc.status === 'revoked';
    const isFinalized = doc.status === 'finalized' || doc.status === 'draft';

    res.json({
      success: true,
      valid: !isRevoked,
      status: doc.status,
      document: {
        document_id:     doc.document_id,
        subject:         doc.language === 'ta' ? doc.subject_ta : doc.subject_en,
        issued_by_en:    doc.profile_name_en,
        issued_by_ta:    doc.profile_name_ta,
        designation:     doc.party_role || doc.designation_en,
        party_en:        doc.party_name_en,
        party_ta:        doc.party_name_ta,
        abbreviation:    doc.abbreviation,
        primary_color:   doc.primary_color,
        created_at:      doc.created_at,
        finalized_at:    doc.finalized_at,
        revoked_at:      doc.revoked_at,
        revoked_reason:  doc.revoked_reason,
        document_hash:   doc.document_hash,
      },
      message: isRevoked
        ? `⚠️ This document has been REVOKED. Reason: ${doc.revoked_reason || 'Not specified'}`
        : isFinalized
        ? '✅ This document is AUTHENTIC and verified.'
        : '⚠️ This document is in DRAFT state and not yet finalized.',
    });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ success: false, message: 'Verification failed.' });
  }
});

module.exports = router;
