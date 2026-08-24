// services/intelligenceService.js — AI News & Area Intelligence + Political Speech Engine
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const CANDIDATE_MODELS = [
  'gemini-3.6-flash',
  'gemini-2.5-flash',
  'gemini-1.5-flash',
];

const generateWithFallback = async (prompt) => {
  let lastError = null;
  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (err) {
      lastError = err;
      console.warn(`[Intelligence Engine] Model ${modelName} failed. Trying fallback...`);
    }
  }
  throw lastError || new Error('All AI models failed to respond.');
};

/**
 * Curate and analyze area intelligence, news, civic issues, and government schemes
 */
const fetchAreaIntelligence = async ({ district = 'ஈரோடு', constituency = 'ஈரோடு கிழக்கு', topic = '', category = 'all', language = 'ta' }) => {
  const prompt = `You are a Chief Political Intelligence Analyst and Government Affairs Specialist for Tamil Nadu governance.

Analyze and synthesize comprehensive, realistic, and up-to-date regional intelligence for:
District: ${district}
Constituency: ${constituency || 'All Constituencies'}
Category Filter: ${category}
${topic ? `Specific Focus Topic: ${topic}` : ''}

Generate a structured JSON intelligence report covering critical local issues, civic demands, government schemes, political developments, and agricultural/industrial status in this area.

Return ONLY a valid JSON object with the following format (no markdown code fences outside JSON):
{
  "location": "${district} - ${constituency}",
  "summary_ta": "2-3 sentences executive summary in Tamil of the current political & public pulse in this region.",
  "summary_en": "2-3 sentences executive summary in English.",
  "overall_sentiment": "public_demand_high" (or "content_with_schemes", "civic_unrest", "election_buzz"),
  "key_metrics": {
    "total_grievances_identified": 14,
    "priority_level": "High",
    "top_focus_sector": "குடிநீர் & சாலை உள்கட்டமைப்பு"
  },
  "intelligence_items": [
    {
      "id": "item-1",
      "category": "civic_issue",
      "title_ta": "ஈரோடு மாநகர குடிநீர் பகிர்மானக் கட்டமைப்பு மற்றும் பாதாள சாக்கடை பணிகளால் சாலைகள் சேதம்",
      "title_en": "Erode City drinking water distribution & damaged roads due to underground drainage works",
      "description_ta": "ஈரோடு கிழக்கு மற்றும் பெருந்துறை முக்கிய சாலைகளில் குடிநீர் குழாய் பதிப்பு மற்றும் பாதாள சாக்கடை பணிகளால் பொதுமக்கள் போக்குவரத்து நெரிசலில் அவதிப்படுகின்றனர்.",
      "severity": "critical",
      "verified_source": "தினத்தந்தி / The Hindu Tamil / மாவட்ட ஆட்சியர் கூட்டறிக்கை",
      "date": "24 ஆகஸ்ட் 2026",
      "public_impact": "50,000+ பொதுமக்கள் & வர்த்தகர்கள் பாதிப்பு",
      "suggested_action": "மாவட்ட ஆட்சியருக்கு உடனடி கோரிக்கை மனு மற்றும் சட்டமன்றத்தில் கேள்வி எழுப்புதல்"
    },
    {
      "id": "item-2",
      "category": "govt_scheme",
      "title_ta": "கலைஞர் மகளிர் உரிமைத் தொகை மற்றும் புதுமைப் பெண் திட்ட பயனாளிகள் விரிவாக்கம்",
      "title_en": "Expansion of Kalaignar Magalir Urimai Thogai & Pudhumai Penn beneficiaries",
      "description_ta": "ஈரோடு மாவட்டத்தில் மகளிர் உரிமைத் தொகை திட்டத்தின் கீழ் விடுபட்ட குடும்பங்களுக்கான மறு ஆய்வு முகாம்கள் தொடக்கம்.",
      "severity": "positive",
      "verified_source": "தகவல் & மக்கள் தொடர்புத் துறை (DIPR TN)",
      "date": "22 ஆகஸ்ட் 2026",
      "public_impact": "1.2 லட்சம் மகளிர் பயனடைவு",
      "suggested_action": "கழகத் தோழர்கள் மூலம் பொதுமக்களுக்கு முகாம்கள் வழிகாட்டல் வாழ்த்து அறிக்கை"
    },
    {
      "id": "item-3",
      "category": "agriculture_industry",
      "title_ta": "ஈரோடு மஞ்சள் சந்தை விலை நிலவரம் & விசைத்தறி நெசவாளர்கள் மின்கட்டண மானியக் கோரிக்கை",
      "title_en": "Erode Turmeric market prices & Powerloom weavers electricity subsidy demand",
      "description_ta": "பெருந்துறை மற்றும் பவானி பகுதி விசைத்தறி நெசவாளர்களுக்கு கூடுதல் இலவச மின்சார யூனிட்டுகள் மற்றும் மஞ்சள் கொள்முதல் விலை உயர்வு கோரிக்கை.",
      "severity": "high",
      "verified_source": "தினமலர் / மாலைமலர் வணிகச் செய்தி",
      "date": "23 ஆகஸ்ட் 2026",
      "public_impact": "40,000+ நெசவாளர் & விவசாய குடும்பங்கள்",
      "suggested_action": "விவசாயிகள் மற்றும் நெசவாளர் ஆதரவு மாபெரும் பொதுக்கூட்ட மேடைப் பேச்சு"
    },
    {
      "id": "item-4",
      "category": "politics_events",
      "title_ta": "ஈரோடு மண்டல கழக இளைஞரணி மற்றும் பூத் கமிட்டி களப்பணிகள் தீவிரம்",
      "title_en": "Erode regional youth wing & booth committee ground operations intensifies",
      "description_ta": "வரவிருக்கும் தேர்தலை முன்னிட்டு ஈரோடு மேற்கு மற்றும் மொடக்குறிச்சி ஒன்றியங்களில் தீவிர வாக்குச்சாவடி முகவர்கள் கலந்தாய்வு.",
      "severity": "medium",
      "verified_source": "கழக தலைமை செய்தி அறிக்கை",
      "date": "21 ஆகஸ்ட் 2026",
      "public_impact": "களப்பணியாளர்கள் உற்சாகம்",
      "suggested_action": "கழக நிர்வாக நியமன ஆணை மற்றும் நிர்வாகிகளுக்கு வாழ்த்து மடல்"
    }
  ]
}`;

  const raw = await generateWithFallback(prompt);
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse JSON intelligence report:', raw);
    throw new Error('AI Intelligence parsing failed. Please retry.');
  }
};

/**
 * Generate Speeches, Press Statements, Meeting Briefs, or Social Media Campaigns
 */
const generatePoliticalSpeech = async ({
  topic,
  context = '',
  intelligenceItem = null,
  speechType = 'rally_speech', // rally_speech, press_statement, social_media, meeting_points, govt_letter
  speakerRole = 'கழக பேச்சாளர் / மக்கள் பிரதிநிதி',
  partyName = '',
  constituency = 'ஈரோடு கிழக்கு',
  district = 'ஈரோடு',
  tone = 'high_energy', // high_energy, formal, emotional, assertive
  duration = '5_mins', // 2_mins, 5_mins, 10_mins
  language = 'ta'
}) => {
  const typeInstructions = {
    rally_speech: {
      ta: 'அனல் பறக்கும் மேடைப் பேச்சு (Mass Rally Campaign Speech)',
      rule: 'Write a powerful, charismatic, and rhythmic Tamil public campaign speech. Include rousing greetings (அன்பார்ந்த கழகத் தோழர்களே, தாய்மார்களே), historical/ideological references, sharp fact-based critique, crowd-cheering punchlines, local constituency issues, and a triumphant call to vote/support.'
    },
    press_statement: {
      ta: 'பத்திரிகை செய்தி அறிக்கை (Media Statement)',
      rule: 'Write an authoritative, headline-worthy press statement quoting the speaker, addressing journalists directly, stating the party stance clearly with supporting data.'
    },
    social_media: {
      ta: 'வைரல் சமூக வலைத்தள பதிவுகள் (Twitter/X & WhatsApp Campaign)',
      rule: 'Generate: 1. A 3-tweet viral X/Twitter thread with trending Tamil hashtags (#Erode, #TamilNadu, #TNPolitics). 2. A WhatsApp cadre broadcast message with emojis.'
    },
    meeting_points: {
      ta: 'உள்கட்சி கூட்ட உரைக் குறிப்புகள் (Talking Points & Briefing)',
      rule: 'Provide structured bullet points for booth agents and office-bearers with key facts, opponent weaknesses, public demands to highlight, and immediate field tasks.'
    },
    govt_letter: {
      ta: 'அரசு கோரிக்கை மனு வரைவு (Official Representation)',
      rule: 'Format as an official, highly structured Tamil administrative petition body ready for letterhead export.'
    }
  }[speechType] || {
    ta: 'பொது உரை',
    rule: 'Write a formal political speech.'
  };

  const prompt = `You are the Chief Speechwriter and Communications Director for top political leadership in Tamil Nadu.

Task: Draft ${typeInstructions.ta}
Guidelines: ${typeInstructions.rule}

Speaker: ${speakerRole} ${partyName ? `(${partyName})` : ''}
Region: ${district} | Constituency: ${constituency}
Topic: ${topic}
Additional Context: ${context}
${intelligenceItem ? `Ground Intelligence Data: ${JSON.stringify(intelligenceItem)}` : ''}
Tone: ${tone}
Target Duration / Length: ${duration}
Language: ${language === 'ta' ? 'Tamil (தமிழ்) - Authentic, poetic, rhetorical, and impactful Tamil oratory' : 'English - High-level professional political oratory'}

Format instructions:
- Output clean, ready-to-read / ready-to-speak text.
- If speech: Include stage cues in brackets like [கைதட்டல்], [உற்சாக முழக்கம்], [குரல் உயர்த்தி] to guide the speaker.
- Do NOT output markdown code blocks.`;

  return await generateWithFallback(prompt);
};

module.exports = {
  fetchAreaIntelligence,
  generatePoliticalSpeech,
};
