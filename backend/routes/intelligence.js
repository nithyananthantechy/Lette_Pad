// routes/intelligence.js — Political Intelligence & Speech Generation API
const express = require('express');
const router  = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { requireVerified }   = require('../middleware/rbac');
const { fetchAreaIntelligence, generatePoliticalSpeech } = require('../services/intelligenceService');
const { logAction, getClientIP } = require('../services/auditService');

router.use(authenticateToken, requireVerified);

// ── POST /api/intelligence/analyze — Fetch Area News & Intelligence
router.post('/analyze', async (req, res) => {
  const { district, constituency, topic, category, language } = req.body;
  try {
    const report = await fetchAreaIntelligence({
      district: district || 'ஈரோடு',
      constituency: constituency || 'ஈரோடு கிழக்கு',
      topic: topic || '',
      category: category || 'all',
      language: language || 'ta',
    });

    await logAction({
      userId: req.user.id,
      action: 'AI_INTELLIGENCE_SEARCH',
      ipAddress: getClientIP(req),
      details: { district, constituency, topic },
    });

    res.json({ success: true, report });
  } catch (err) {
    console.error('Intelligence analyze error:', err);
    res.status(500).json({ success: false, message: 'Failed to synthesize area intelligence.' });
  }
});

// ── POST /api/intelligence/generate-speech — Generate Speech/Statement
router.post('/generate-speech', async (req, res) => {
  const {
    topic,
    context,
    intelligenceItem,
    speechType,
    speakerRole,
    partyName,
    constituency,
    district,
    tone,
    duration,
    language,
  } = req.body;

  if (!topic) {
    return res.status(400).json({ success: false, message: 'Topic is required.' });
  }

  try {
    const content = await generatePoliticalSpeech({
      topic,
      context,
      intelligenceItem,
      speechType: speechType || 'rally_speech',
      speakerRole: speakerRole || 'கழக பேச்சாளர்',
      partyName: partyName || '',
      constituency: constituency || 'ஈரோடு கிழக்கு',
      district: district || 'ஈரோடு',
      tone: tone || 'high_energy',
      duration: duration || '5_mins',
      language: language || 'ta',
    });

    await logAction({
      userId: req.user.id,
      action: 'AI_GENERATE_SPEECH',
      ipAddress: getClientIP(req),
      details: { topic, speechType, district },
    });

    res.json({ success: true, content });
  } catch (err) {
    console.error('Generate speech error:', err);
    res.status(500).json({ success: false, message: 'Speech generation failed.' });
  }
});

module.exports = router;
