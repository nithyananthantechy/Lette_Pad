// services/aiService.js — Google Gemini AI Integration (Enterprise Edition)
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Multi-model fallback list to guarantee 100% uptime
const CANDIDATE_MODELS = [
  'gemini-3.6-flash',
  'gemini-2.5-flash',
  'gemini-1.5-flash',
  'gemini-2.5-pro',
];

/**
 * Robust helper to call Gemini with automated model fallback
 */
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
      console.warn(`[AI Engine] Model ${modelName} failed (${err.message}). Trying next available model...`);
    }
  }
  throw lastError || new Error('All Gemini AI models failed to respond.');
};

const LETTER_ARCHETYPES = {
  petition: {
    en: 'Public Demand / Representation (கோரிக்கை மனு)',
    instructions: 'Format as an official demand/petition to government authorities regarding public welfare, civic issues, infrastructure, water supply, or road facilities in Tamil Nadu constituencies.'
  },
  press_release: {
    en: 'Press Statement (பத்திரிகை செய்தி அறிக்கை)',
    instructions: 'Format as an assertive, sharp, and media-ready press statement representing the party leadership stance on current events, policy decisions, or public announcements.'
  },
  greeting: {
    en: 'Congratulatory Letter (வாழ்த்து மடல்)',
    instructions: 'Format as a warm, respectful, and dignified congratulatory message celebrating political victory, festival greetings (பொங்கல், தீபாவளி), birthdays, or achievements.'
  },
  condolence: {
    en: 'Condolence Message (இரங்கல் செய்தி)',
    instructions: 'Format with profound respect, heartfelt emotional gravity, and traditional Tamil phrasing honoring the departed soul and consoling the bereaved family.'
  },
  appointment: {
    en: 'Party Appointment Order (கழக நிர்வாக நியமன ஆணை)',
    instructions: 'Format as an authoritative party organizational order appointing a member to a district, union, or wing office-bearer post (மாவட்ட/ஒன்றிய/அணி பொறுப்பாளர் நியமனம்).'
  },
  invitation: {
    en: 'Official Invitation (அழைப்பிதழ் மடல்)',
    instructions: 'Format as an official invitation for party conferences, flag hoisting, welfare distribution, or constituency inauguration events.'
  },
  thanks: {
    en: 'Letter of Gratitude (நன்றியுரை மடல்)',
    instructions: 'Format expressing sincere gratitude to cadres, constituency voters, alliance partners, or public supporters.'
  },
  disciplinary: {
    en: 'Disciplinary Notice (ஒழுங்கு நடவடிக்கை / விளக்கம் கோரும் கடிதம்)',
    instructions: 'Format with firm, legalistic, and formal party constitution language seeking explanation or issuing an official warning.'
  }
};

/**
 * Generate a specialized letter body using Gemini AI
 */
const generateLetterBody = async ({
  subject,
  context,
  category = 'petition',
  language = 'ta',
  profileType = 'party',
  designation = '',
  recipientName = '',
  tone = 'formal',
  constituency = '',
  district = 'ஈரோடு (Erode)'
}) => {
  const archetype = LETTER_ARCHETYPES[category] || LETTER_ARCHETYPES.petition;

  const langInstruction = language === 'ta'
    ? 'Write the letter ONLY in authentic, grammatically flawless Tamil (தமிழ்). Use formal Tamil administrative/political vocabulary (எ.கா: மாண்புமிகு, வணக்கத்திற்குரிய, கழகத் தோழர்களே, கனிவான பார்வைக்கு).'
    : language === 'en'
    ? 'Write the letter ONLY in high-level official English suitable for Tamil Nadu government or political correspondence.'
    : 'Write the letter in BOTH Tamil and English. Provide the Tamil version first, followed by a clear divider and the English version.';

  const toneInstructions = {
    formal: 'Use strictly formal, respectful, and authoritative language.',
    sharp: 'Use powerful, energetic, assertive political vocabulary representing public voice.',
    polite: 'Use deeply polite, humble, and cooperative tones requesting swift action.',
    urgent: 'Use urgent, high-priority language highlighting pressing public emergency or deadline.'
  }[tone] || 'Use formal, professional tone.';

  const prompt = `You are a chief political secretary and senior administrative drafting expert in Tamil Nadu governance.

Drafting Category: ${archetype.en}
Category Specific Rule: ${archetype.instructions}
District / Region: ${district} ${constituency ? `| Constituency: ${constituency}` : ''}
Sender Designation: ${designation || 'கழக நிர்வாகி / அரசு பிரதிநிதி'}
Recipient: ${recipientName || 'மாண்புமிகு துறை அதிகாரி / கழகத் தோழர்கள்'}
Subject: ${subject}
Core Intent & Context: ${context}
Tone Required: ${toneInstructions}

Language Directive:
${langInstruction}

Structure Requirements:
1. Formal, culturally accurate Tamil salutation (e.g. "வணக்கத்திற்குரிய ஐயா/அம்மா அவர்களுக்கு," or "அன்பார்ந்த கழகத் தோழர்களே,")
2. Impactful opening outlining the primary purpose
3. Detailed, structured body paragraphs explaining the context, facts, and public necessity
4. Clear call-to-action or concluding resolve
5. Dignified closing signature block phrase (e.g. "தங்கள் உண்மையுள்ள," or "கழகப் பணியில்,")

DO NOT output markdown code blocks, placeholders, letterhead headers, or dates. Output only the clean letter text body.`;

  return await generateWithFallback(prompt);
};

/**
 * Improve/rephrase existing letter body
 */
const improveLetterBody = async (existingBody, language = 'ta', instruction = '') => {
  const prompt = `You are an expert Tamil administrative drafting editor.
Improve the following letter body to make the vocabulary more dignified, authoritative, and linguistically precise for Tamil Nadu official correspondence.

Language: ${language === 'ta' ? 'Tamil (தமிழ்)' : 'English'}
${instruction ? `Editor's note: ${instruction}` : ''}

Original Text:
---
${existingBody}
---

Provide only the improved letter text.`;

  return await generateWithFallback(prompt);
};

/**
 * Translate letter body between Tamil and English
 */
const translateLetter = async (text, fromLang, toLang) => {
  const prompt = `Translate the following official Tamil Nadu correspondence from ${fromLang === 'ta' ? 'Tamil' : 'English'} to ${toLang === 'ta' ? 'Tamil' : 'English'}.
Maintain proper Tamil Nadu political titles, official government terminologies, and cultural honorifics.

Text:
---
${text}
---

Return only the translated content.`;

  return await generateWithFallback(prompt);
};

/**
 * Generate 5 letter subject suggestions
 */
const suggestSubjects = async (context, category = 'petition', language = 'ta') => {
  const prompt = `Generate 5 formal and catchy letter subject lines in ${language === 'ta' ? 'Tamil (தமிழ்)' : 'English'} for category: ${category}.
Context: ${context}

Return ONLY a valid JSON array of 5 strings:
["Subject 1", "Subject 2", "Subject 3", "Subject 4", "Subject 5"]`;

  const text = (await generateWithFallback(prompt)).trim();

  try {
    const jsonMatch = text.match(/\[.*\]/s);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return JSON.parse(text);
  } catch {
    return [text];
  }
};

module.exports = {
  generateLetterBody,
  improveLetterBody,
  translateLetter,
  suggestSubjects,
  LETTER_ARCHETYPES
};
