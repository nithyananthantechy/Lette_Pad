// src/pages/LetterDesigner.jsx — Enterprise AI Letterpad Studio
import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sparkles, Download, Save, Eye, X, RefreshCw, Languages,
  ShieldCheck, Stamp, Layout, FileText, CheckCircle2, Lock,
  ChevronRight, MapPin, Building2, User
} from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../lib/api';
import toast from 'react-hot-toast';

const LETTER_CATEGORIES = [
  { id: 'petition',      icon: '📝', label_ta: 'கோரிக்கை மனு / பிரதிநிதித்துவம்', label_en: 'Petition / Representation' },
  { id: 'press_release', icon: '📢', label_ta: 'பத்திரிகை செய்தி அறிக்கை',          label_en: 'Press Statement' },
  { id: 'greeting',      icon: '💐', label_ta: 'வாழ்த்து மடல் (வெற்றி/விழா)',      label_en: 'Congratulatory Letter' },
  { id: 'condolence',    icon: '🕊️', label_ta: 'இரங்கல் செய்தி மடல்',                label_en: 'Condolence Message' },
  { id: 'appointment',   icon: '📜', label_ta: 'கழக நிர்வாக நியமன ஆணை',           label_en: 'Party Appointment Order' },
  { id: 'invitation',    icon: '✉️', label_ta: 'அதிகாரப்பூர்வ அழைப்பிதழ்',         label_en: 'Official Invitation' },
  { id: 'thanks',        icon: '🙏', label_ta: 'நன்றியுரை மடல்',                    label_en: 'Letter of Thanks' },
  { id: 'disciplinary',  icon: '⚖️', label_ta: 'விளக்கம் கோரும் கடிதம் / ஒழுங்கு',  label_en: 'Disciplinary Notice' },
];

const TONES = [
  { id: 'formal', label_ta: 'அதிகாரப்பூர்வ அரசு நடை', label_en: 'Strict Formal' },
  { id: 'sharp',  label_ta: 'அரசியல் வீச்சு & அழுத்தம்', label_en: 'Sharp Political' },
  { id: 'polite', label_ta: 'பணிவான கோரிக்கை',         label_en: 'Polite Request' },
  { id: 'urgent', label_ta: 'அவசர கால நடவடிக்கை',      label_en: 'Urgent Priority' },
];

const LAYOUT_STYLES = [
  { id: 'classic',     name_ta: 'கழக பிரம்மாண்டம்',  name_en: 'Party High-Impact', icon: '🏳️' },
  { id: 'mla_govt',    name_ta: 'சட்டமன்ற/அரசு நடை', name_en: 'MLA / Govt Emblem', icon: '🏛️' },
  { id: 'press_release', name_ta: 'செய்தி அறிக்கை',    name_en: 'Media Statement',   icon: '📢' },
  { id: 'minimal',     name_ta: 'நிர்வாக சுருக்கம்',  name_en: 'Executive Minimal', icon: '📄' },
];

const ERODE_CONSTITUENCIES = [
  'ஈரோடு கிழக்கு (Erode East)',
  'ஈரோடு மேற்கு (Erode West)',
  'மொடக்குறிச்சி (Modakkurichi)',
  'பெருந்துறை (Perundurai)',
  'பவானி (Bhavani)',
  'அந்தியூர் (Anthiyur)',
  'கோபிசெட்டிபாளையம் (Gobichettipalayam)',
  'பவானிசாகர் (Bhavanisagar)',
  'ஈரோடு நாடாளுமன்றத் தொகுதி (Erode MP)',
];

const LetterDesigner = () => {
  const { i18n } = useTranslation();
  const { id }   = useParams();
  const ta = i18n.language === 'ta';

  const [profiles, setProfiles]               = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [letterLang, setLetterLang]           = useState('ta');

  // Form states
  const [mobileTab, setMobileTab]       = useState('editor'); // 'editor' | 'preview'
  const [category, setCategory]         = useState('petition');
  const [tone, setTone]                 = useState('formal');
  const [constituency, setConstituency] = useState('ஈரோடு கிழக்கு (Erode East)');
  const [layoutStyle, setLayoutStyle]   = useState('classic');
  const [watermark, setWatermark]       = useState('none');
  const [hasSeal, setHasSeal]           = useState(true);
  const [dispatchRef, setDispatchRef]   = useState('');

  const [subject, setSubject]           = useState('');
  const [body, setBody]                 = useState('');
  const [recipient, setRecipient]       = useState('');
  const [recipientAddr, setRecipientAddr] = useState('');
  const [aiContext, setAiContext]       = useState('');
  const [subjects, setSubjects]         = useState([]);

  // Control states
  const [aiLoading, setAiLoading]       = useState(false);
  const [saving, setSaving]             = useState(false);
  const [exporting, setExporting]       = useState(false);
  const [letterId, setLetterId]         = useState(id || null);
  const [showSubjectSuggest, setShowSubjectSuggest] = useState(false);

  useEffect(() => {
    // Check if imported from Intelligence Studio
    const importedContent = localStorage.getItem('imported_speech_content');
    const importedSubject = localStorage.getItem('imported_speech_subject');
    if (importedContent) {
      setBody(importedContent);
      if (importedSubject) setSubject(importedSubject);
      localStorage.removeItem('imported_speech_content');
      localStorage.removeItem('imported_speech_subject');
      toast.success(ta ? '📥 AI புலனாய்வு உரை இறக்குமதி செய்யப்பட்டது!' : '📥 Imported from Intelligence Studio!');
    }

    api.get('/profiles').then(r => {
      const list = r.data.profiles || [];
      setProfiles(list);
      if (list.length > 0) {
        setSelectedProfile(list[0]);
        if (list[0].layout_style) setLayoutStyle(list[0].layout_style);
        if (list[0].constituency) setConstituency(list[0].constituency);
      }
    }).catch(() => toast.error(ta ? 'சுயவிவரங்கள் ஏற்றுவதில் பிழை' : 'Failed to load profiles'));

    // If edit mode (:id exists)
    if (id) {
      api.get(`/letters/${id}`).then(r => {
        const l = r.data.letter;
        if (l) {
          setLetterId(l.id);
          setSubject(l.subject_ta || l.subject_en || '');
          setBody(l.body_ta || l.body_en || '');
          setRecipient(l.recipient_name || '');
          setRecipientAddr(l.recipient_address || '');
          if (l.language) setLetterLang(l.language);
          if (l.layout_style) setLayoutStyle(l.layout_style);
          toast.success(ta ? '📝 கடிதம் திருத்துவதற்காக திறக்கப்பட்டது' : '📝 Letter loaded for editing');
        }
      }).catch(() => {});
    }
  }, [id]);

  // Update dispatch reference on profile selection
  useEffect(() => {
    if (selectedProfile) {
      const abbr = selectedProfile.abbreviation || 'TN';
      const year = new Date().getFullYear();
      const rand = Math.floor(1000 + Math.random() * 9000);
      setDispatchRef(`க.எண்: ஈரோடு/${abbr}/${year}/${rand}`);
    }
  }, [selectedProfile]);

  const generateAI = async () => {
    if (!aiContext.trim()) {
      toast.error(ta ? 'கடிதத்தின் நோக்கத்தை சில வரிகளில் குறிப்பிடவும்' : 'Please provide letter context');
      return;
    }
    setAiLoading(true);
    try {
      const res = await api.post('/letters/ai/generate', {
        subject: subject || 'பொது நலன் சார்ந்த மனு',
        context: aiContext,
        category,
        language: letterLang,
        profileId: selectedProfile?.id,
        recipientName: recipient,
        tone,
        constituency,
        district: 'ஈரோடு (Erode)',
      });
      setBody(res.data.body);
      toast.success(ta ? '✨ தொழில்முறை கடிதம் உருவாக்கப்பட்டது!' : '✨ Letter drafted successfully!');
    } catch {
      toast.error(ta ? 'AI தயாரிப்பு தோல்வி' : 'AI generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  const improveAI = async () => {
    if (!body) return toast.error(ta ? 'முதலில் கடிதத்தை எழுதவும்' : 'Write letter body first');
    setAiLoading(true);
    try {
      const res = await api.post('/letters/ai/improve', { body, language: letterLang });
      setBody(res.data.body);
      toast.success(ta ? '✅ வார்த்தை நடை மேம்படுத்தப்பட்டது!' : '✅ Vocabulary improved!');
    } catch {
      toast.error(ta ? 'மேம்படுத்தல் தோல்வி' : 'Improvement failed');
    } finally {
      setAiLoading(false);
    }
  };

  const translateAI = async () => {
    if (!body) return;
    setAiLoading(true);
    try {
      const toLang = letterLang === 'ta' ? 'en' : 'ta';
      const res = await api.post('/letters/ai/translate', { text: body, fromLang: letterLang, toLang });
      setBody(res.data.text);
      setLetterLang(toLang);
      toast.success(ta ? '🔄 மொழிபெயர்ப்பு நிறைவடைந்தது' : '🔄 Translation complete');
    } catch {
      toast.error(ta ? 'மொழிபெயர்ப்பு தோல்வி' : 'Translation failed');
    } finally {
      setAiLoading(false);
    }
  };

  const suggestSubjects = async () => {
    if (!aiContext && !body) {
      toast.error(ta ? 'சூழலை உள்ளிடவும்' : 'Provide context first');
      return;
    }
    try {
      const res = await api.post('/letters/ai/suggest-subjects', {
        context: aiContext || body.substring(0, 200),
        category,
        language: letterLang,
      });
      setSubjects(res.data.subjects || []);
      setShowSubjectSuggest(true);
    } catch {}
  };

  const saveDraft = async () => {
    if (!selectedProfile) return toast.error(ta ? 'சுயவிவரம் தேர்ந்தெடுக்கவும்' : 'Select a profile');
    setSaving(true);
    try {
      const payload = {
        profile_id: selectedProfile.id,
        subject_ta: letterLang === 'ta' ? subject : null,
        subject_en: letterLang === 'en' ? subject : null,
        body_ta:    letterLang === 'ta' ? body : null,
        body_en:    letterLang === 'en' ? body : null,
        recipient_name: recipient,
        recipient_address: recipientAddr,
        language: letterLang,
      };

      let currentId = letterId;
      if (currentId) {
        try {
          await api.put(`/letters/${currentId}`, payload);
          toast.success(ta ? '💾 வரைவு வெற்றிகரமாக புதுப்பிக்கப்பட்டது' : '💾 Draft updated');
          return currentId;
        } catch (err) {
          if (err.response?.status === 404) {
            const res = await api.post('/letters', payload);
            currentId = res.data.letter.id;
            setLetterId(currentId);
            toast.success(ta ? '💾 வரைவு பாதுகாப்பாக சேமிக்கப்பட்டது' : '💾 Draft saved securely');
            return currentId;
          }
          throw err;
        }
      } else {
        const res = await api.post('/letters', payload);
        currentId = res.data.letter.id;
        setLetterId(currentId);
        toast.success(ta ? '💾 வரைவு பாதுகாப்பாக சேமிக்கப்பட்டது' : '💾 Draft saved securely');
        return currentId;
      }
    } catch (err) {
      console.error(err);
      toast.error(ta ? 'சேமிப்பு தோல்வி' : 'Save failed');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const exportPDF = async () => {
    let currentId = letterId;
    if (!currentId) {
      currentId = await saveDraft();
      if (!currentId) return;
    }

    setExporting(true);
    try {
      const res = await api.post(`/letters/${currentId}/export-pdf`, {
        layoutStyle,
        watermark,
        hasSeal,
        dispatchRef,
      });

      if (res.data?.html) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(res.data.html);
          printWindow.document.close();
          setTimeout(() => {
            printWindow.focus();
            printWindow.print();
          }, 600);
          toast.success(ta ? '📄 ஆவணம் தயாராகியுள்ளது! (Print/Save as PDF)' : '📄 Document ready! (Print/Save as PDF)');
        } else {
          toast.error(ta ? 'Popup அனுமதிக்கவும்.' : 'Please allow popups.');
        }
      }
    } catch {
      toast.error(ta ? 'PDF ஏற்றுமதி தோல்வி' : 'PDF export failed');
    } finally {
      setExporting(false);
    }
  };

  const profileColor = selectedProfile?.primary_color || '#0f172a';

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Action Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 font-tamil flex items-center gap-2">
              <span>🏛️</span>
              {ta ? 'அதிகாரப்பூர்வ கடிதத் தயாரிப்புக்கூடம்' : 'Enterprise Letter Studio'}
            </h1>
            <p className="text-slate-500 font-tamil text-xs mt-1">
              {ta ? 'தமிழ்நாடு அரசியல் கட்சிகள் மற்றும் அரசு பிரதிநிதிகளுக்கான உயர்நிலை மடல் வடிவமைப்பு'
                  : 'High-precision letterhead drafting for political leaders and public representatives'}
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <button onClick={saveDraft} disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold font-tamil hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50">
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              {ta ? 'வரைவாக சேமி' : 'Save Draft'}
            </button>
            <button onClick={exportPDF} disabled={exporting}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold font-tamil transition-all shadow-md hover:shadow-blue-500/20 disabled:opacity-50">
              {exporting ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
              {ta ? 'அச்சு / PDF பதிவிறக்கு' : 'Print / Export PDF'}
            </button>
          </div>
        </div>

        {/* Mobile View Switcher Tab (Visible on mobile/tablet) */}
        <div className="lg:hidden flex items-center bg-slate-200/90 p-1 rounded-2xl mb-4 font-tamil shadow-inner">
          <button
            onClick={() => setMobileTab('editor')}
            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5
              ${mobileTab === 'editor' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-700 hover:text-slate-900'}`}
          >
            <FileText size={15} /> {ta ? '✏️ கடிதம் திருத்து' : 'Editor'}
          </button>
          <button
            onClick={() => setMobileTab('preview')}
            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5
              ${mobileTab === 'preview' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-700 hover:text-slate-900'}`}
          >
            <Eye size={15} /> {ta ? '👁️ மடல் முன்னோட்டம்' : 'Live Preview'}
          </button>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">

          {/* LEFT COLUMN: Controls & Editor (7 Cols) */}
          <div className={`lg:col-span-7 space-y-5 ${mobileTab === 'editor' ? 'block' : 'hidden lg:block'}`}>

            {/* 1. Profile & Constituency Selector */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold font-tamil text-slate-900 text-sm flex items-center gap-2">
                  <User size={16} className="text-blue-600" />
                  {ta ? 'கடிதத் தலைப்பு சுயவிவரம்' : 'Letterhead Profile'}
                </h3>
                <Link to="/profiles" className="text-xs text-blue-600 hover:underline font-tamil">
                  {ta ? '+ புதிய சுயவிவரம்' : '+ New Profile'}
                </Link>
              </div>

              {profiles.length === 0 ? (
                <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center">
                  <p className="text-xs text-slate-500 font-tamil mb-2">
                    {ta ? 'சுயவிவரங்கள் இல்லை. முதலில் உருவாக்கவும்.' : 'No profiles created yet.'}
                  </p>
                  <Link to="/profiles" className="btn-primary text-xs py-2 px-4 inline-block font-tamil">
                    {ta ? 'சுயவிவரம் உருவாக்கு' : 'Create Profile'}
                  </Link>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {profiles.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedProfile(p);
                        if (p.layout_style) setLayoutStyle(p.layout_style);
                        if (p.constituency) setConstituency(p.constituency);
                      }}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all
                        ${selectedProfile?.id === p.id
                          ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-1 ring-blue-600'
                          : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                    >
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm"
                        style={{ background: p.primary_color || '#0f172a' }}>
                        {(p.abbreviation || 'TN').substring(0, 3)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs font-tamil text-slate-900 truncate">
                          {p.profile_name_ta || p.profile_name_en}
                        </div>
                        <div className="text-[11px] text-slate-500 font-tamil truncate">
                          {p.party_role || p.designation_en || 'கழகப் பொறுப்பாளர்'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Category & Tone Matrix */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <h3 className="font-bold font-tamil text-slate-900 text-sm mb-3 flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" />
                {ta ? 'மடல் வகை & தொனித் தேர்வு' : 'Letter Archetype & Tone'}
              </h3>

              {/* Archetypes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {LETTER_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between text-xs font-tamil
                      ${category === cat.id
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50/50'}`}
                  >
                    <span className="text-base mb-1">{cat.icon}</span>
                    <span className="leading-tight line-clamp-2">{ta ? cat.label_ta : cat.label_en}</span>
                  </button>
                ))}
              </div>

              {/* Tone & Constituency Bar */}
              <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 font-tamil mb-1">
                    {ta ? 'தொனி நடை (Tone Style)' : 'Tone Style'}
                  </label>
                  <select
                    value={tone}
                    onChange={e => setTone(e.target.value)}
                    className="input-field text-xs py-2 bg-slate-50"
                  >
                    {TONES.map(t => (
                      <option key={t.id} value={t.id}>{ta ? t.label_ta : t.label_en}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 font-tamil mb-1">
                    {ta ? 'ஈரோடு / தொகுதி தேர்வு' : 'Constituency'}
                  </label>
                  <select
                    value={constituency}
                    onChange={e => setConstituency(e.target.value)}
                    className="input-field text-xs py-2 bg-slate-50"
                  >
                    {ERODE_CONSTITUENCIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 3. AI Drafting Engine Panel */}
            <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 p-5 rounded-2xl text-white shadow-md border border-indigo-800/40">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold font-tamil text-sm">{ta ? 'Gemini AI அறிவார்ந்த வரைவு' : 'AI Drafting Studio'}</h3>
                    <p className="text-[10px] text-indigo-300 font-tamil">தமிழ் இலக்கண சுத்தமான அதிகாரப்பூர்வ உரை</p>
                  </div>
                </div>
                <div className="flex rounded-lg overflow-hidden border border-white/20 text-xs">
                  {['ta', 'en'].map(lang => (
                    <button key={lang} onClick={() => setLetterLang(lang)}
                      className={`px-3 py-1 font-tamil transition-colors
                        ${letterLang === lang ? 'bg-blue-600 text-white font-bold' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
                      {lang === 'ta' ? 'தமிழ்' : 'English'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-indigo-200 font-tamil mb-1">
                    {ta ? 'கடிதத்தின் முக்கிய நோக்கம் / விவரம் (1-2 வரிகள்)' : 'Core Intent & Context'}
                  </label>
                  <textarea
                    value={aiContext}
                    onChange={e => setAiContext(e.target.value)}
                    rows={2}
                    className="w-full bg-black/30 border border-indigo-700/60 rounded-xl p-3 text-xs text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-tamil leading-relaxed"
                    placeholder={ta
                      ? 'எ.கா: ஈரோடு பெருந்துறை சாலையில் புதிய நிழற்குடை மற்றும் குடிநீர் வசதி ஏற்படுத்தி தர மாவட்ட ஆட்சியருக்கு கோரிக்கை...'
                      : 'E.g.: Requesting District Collector to set up drinking water and bus shelter on Perundurai road, Erode...'}
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button onClick={generateAI} disabled={aiLoading}
                    className="flex-1 min-w-[160px] flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold font-tamil transition-all shadow-lg disabled:opacity-50">
                    {aiLoading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    {ta ? 'முழு கடிதம் தயாரிக்க' : 'Generate Full Draft'}
                  </button>
                  <button onClick={improveAI} disabled={aiLoading || !body}
                    className="flex items-center gap-1.5 py-2.5 px-3 bg-indigo-700/60 hover:bg-indigo-700 text-white rounded-xl text-xs font-tamil transition-colors disabled:opacity-50">
                    <RefreshCw size={13} /> {ta ? 'நடை மேம்படுத்து' : 'Polish Tone'}
                  </button>
                  <button onClick={translateAI} disabled={aiLoading || !body}
                    className="flex items-center gap-1.5 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-tamil transition-colors disabled:opacity-50">
                    <Languages size={13} /> {ta ? 'மொழிபெயர்' : 'Translate'}
                  </button>
                </div>
              </div>
            </div>

            {/* 4. Subject, Recipient & Body Editor */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              
              {/* Subject */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 font-tamil">
                    {ta ? 'பொருள் (Subject)' : 'Subject'}
                  </label>
                  <button onClick={suggestSubjects} className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-tamil">
                    <Sparkles size={12} /> {ta ? 'AI பரிந்துரைகள்' : 'AI Suggestions'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="input-field text-xs py-2.5 font-tamil font-semibold"
                    placeholder={ta ? 'கடிதத்தின் பொருள் வரி...' : 'Enter letter subject...'}
                  />
                  {showSubjectSuggest && subjects.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-20 bg-white border border-slate-200 rounded-xl shadow-xl mt-1 overflow-hidden">
                      <div className="p-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center text-[11px] font-bold text-slate-700 font-tamil">
                        <span>{ta ? 'பொருத்தமான தலைப்பைத் தேர்ந்தெடுக்கவும்:' : 'Select a subject:'}</span>
                        <button onClick={() => setShowSubjectSuggest(false)}><X size={14} /></button>
                      </div>
                      {subjects.map((s, i) => (
                        <button key={i} onClick={() => { setSubject(s); setShowSubjectSuggest(false); }}
                          className="w-full text-left px-3 py-2.5 hover:bg-blue-50 text-xs font-tamil border-b border-slate-50 last:border-0">
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Recipient */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 font-tamil mb-1">
                    {ta ? 'பெறுநர் பெயர் / பதவி' : 'Recipient Name / Role'}
                  </label>
                  <input value={recipient} onChange={e => setRecipient(e.target.value)}
                    className="input-field text-xs py-2" placeholder={ta ? 'மாண்புமிகு மாவட்ட ஆட்சியர் அவர்கள்' : 'District Collector, Erode'} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 font-tamil mb-1">
                    {ta ? 'பெறுநர் முகவரி' : 'Recipient Address'}
                  </label>
                  <input value={recipientAddr} onChange={e => setRecipientAddr(e.target.value)}
                    className="input-field text-xs py-2" placeholder={ta ? 'மாவட்ட ஆட்சியர் அலுவலகம், ஈரோடு.' : 'Collectorate Complex, Erode.'} />
                </div>
              </div>

              {/* Letter Body */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 font-tamil">
                    {ta ? 'கடித உள்ளடக்கம் (Letter Body)' : 'Letter Body Content'}
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">{body.length} எழுத்துக்கள்</span>
                </div>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={12}
                  className="input-field font-tamil text-xs leading-relaxed"
                  placeholder={ta
                    ? 'இங்கே கடிதத்தின் உள்ளடக்கத்தை எழுதவும் அல்லது மேலே உள்ள AI பொத்தானை அழுத்தவும்...'
                    : 'Write letter body here or use AI generator above...'}
                />
              </div>

            </div>

            {/* 5. Enterprise Customizer Controls */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="font-bold font-tamil text-slate-900 text-sm flex items-center gap-2">
                <Layout size={16} className="text-indigo-600" />
                {ta ? 'மடல் வடிவமைப்பு & முத்திரை கட்டுப்பாடுகள்' : 'Letterhead Design & Security Controls'}
              </h3>

              {/* Template Styles */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 font-tamil mb-1.5">
                  {ta ? 'தலைப்பு வடிவமைப்பு பாணி (Layout Style)' : 'Letterhead Style'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {LAYOUT_STYLES.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setLayoutStyle(s.id)}
                      className={`p-2.5 rounded-xl border text-center font-tamil text-xs transition-all flex flex-col items-center gap-1
                        ${layoutStyle === s.id
                          ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'}`}
                    >
                      <span className="text-base">{s.icon}</span>
                      <span className="text-[11px]">{ta ? s.name_ta : s.name_en}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Watermark & Seal Controls */}
              <div className="grid sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 font-tamil mb-1">
                    {ta ? 'வாட்டர்மார்க் (Watermark)' : 'Watermark'}
                  </label>
                  <select value={watermark} onChange={e => setWatermark(e.target.value)} className="input-field text-xs py-2 bg-slate-50">
                    <option value="none">இல்லை (None)</option>
                    <option value="party_symbol">கட்சி சின்னம் / கட்சி பெயர்</option>
                    <option value="emblem">அரசு முத்திரை (Emblem)</option>
                    <option value="confidential">ரகசியமானது (Confidential)</option>
                    <option value="draft">வரைவு நகல் (Draft)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 font-tamil mb-1">
                    {ta ? 'அதிகாரப்பூர்வ முத்திரை (Seal)' : 'Official Stamp'}
                  </label>
                  <button
                    onClick={() => setHasSeal(!hasSeal)}
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-tamil flex items-center justify-center gap-2 transition-all
                      ${hasSeal ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold' : 'border-slate-200 text-slate-500'}`}
                  >
                    <Stamp size={14} />
                    {hasSeal ? (ta ? 'முத்திரை ஆன் (Active)' : 'Seal ON') : (ta ? 'முத்திரை இல்லை' : 'Seal OFF')}
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 font-tamil mb-1">
                    {ta ? 'கடித குறிப்பு எண் (Dispatch Ref)' : 'Dispatch Ref No'}
                  </label>
                  <input
                    value={dispatchRef}
                    onChange={e => setDispatchRef(e.target.value)}
                    className="input-field text-xs py-2 font-mono"
                    placeholder="க.எண் / Ref No"
                  />
                </div>
              </div>

            </div>

          </div>

          {/* RIGHT COLUMN: Live Interactive A4 Letterhead Preview (5 Cols) */}
          <div className={`lg:col-span-5 ${mobileTab === 'preview' ? 'block' : 'hidden lg:block'}`}>
            <div className="sticky top-20">
              
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 font-tamil flex items-center gap-1.5">
                  <Eye size={14} className="text-blue-600" />
                  {ta ? 'நேரலை A4 முன்னோட்டம் (Live Preview)' : 'Live A4 Preview'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMobileTab('editor')}
                    className="lg:hidden text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 font-tamil"
                  >
                    ✏️ {ta ? 'திருத்து' : 'Edit'}
                  </button>
                  <span className="text-[10px] text-slate-400 font-mono">210mm × 297mm A4</span>
                </div>
              </div>

              {/* A4 Sheet Container */}
              <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-4 sm:p-6 min-h-[580px] sm:min-h-[620px] flex flex-col justify-between relative overflow-hidden overflow-x-auto">
                
                {/* Watermark layer */}
                {watermark !== 'none' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 rotate-[-35deg] text-3xl font-black uppercase tracking-widest text-slate-900 select-none">
                    {watermark === 'confidential' ? 'CONFIDENTIAL / ரகசியம்'
                      : watermark === 'draft' ? 'DRAFT / வரைவு'
                      : selectedProfile?.abbreviation || 'OFFICIAL'}
                  </div>
                )}

                <div>
                  {/* Header depending on party / layout */}
                  {(() => {
                    const abbr = (selectedProfile?.abbreviation || '').toUpperCase();
                    const isTVK = abbr.includes('TVK') || (selectedProfile?.party_name_ta || '').includes('வெற்றிக்');
                    const isDMK = abbr.includes('DMK') || (selectedProfile?.party_name_ta || '').includes('முன்னேற்ற');
                    const isADMK = abbr.includes('ADMK') || abbr.includes('AIADMK') || (selectedProfile?.party_name_ta || '').includes('அண்ணா திராவிட');

                    if (isTVK) {
                      return (
                        <div className="bg-gradient-to-b from-[#FDD835] to-[#FBC02D] border-2 border-[#C62828] rounded-md p-2 mb-4 shadow-xs">
                          <div className="flex items-center justify-between gap-2">
                            <div className="w-9 h-11 bg-white border border-[#C62828] rounded flex flex-col items-center justify-center flex-shrink-0">
                              <span className="text-base">👔</span>
                              <span className="text-[5px] font-bold text-[#C62828]">செயலாளர்</span>
                            </div>
                            <div className="text-center flex-1">
                              <div className="text-[7.5px] font-extrabold text-[#8B0000]">பிறப்பொக்கும் எல்லா உயிர்க்கும் !</div>
                              <div className="text-[9px] font-extrabold text-[#8B0000]">{constituency.split(' ')[0]} மாவட்டம்</div>
                              <div className="text-sm font-black text-[#B71C1C] leading-none my-0.5">தமிழக வெற்றிக் கழகம்</div>
                              <div className="text-[6.5px] text-[#4E342E] truncate">{selectedProfile?.address_ta || selectedProfile?.address_en || 'கழக தலைமை அலுவலகம்'}</div>
                            </div>
                            <div className="w-11 h-13 bg-gradient-to-br from-white to-amber-100 border border-[#C62828] rounded flex flex-col items-center justify-center flex-shrink-0">
                              <span className="text-lg">🌟</span>
                              <span className="text-[5.5px] font-black text-[#B71C1C]">தளபதி விஜய்</span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (isDMK) {
                      return (
                        <div className="bg-white border-t-4 border-t-[#D50000] border-b-2 border-b-black rounded p-2 mb-4 shadow-xs">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex gap-1">
                              <div className="w-6 h-8 border border-black rounded text-center text-[10px] flex flex-col items-center justify-center">👴<span className="text-[4px] font-bold">பெரியார்</span></div>
                              <div className="w-6 h-8 border border-black rounded text-center text-[10px] flex flex-col items-center justify-center">👓<span className="text-[4px] font-bold">அண்ணா</span></div>
                              <div className="w-6 h-8 border border-black rounded text-center text-[10px] flex flex-col items-center justify-center">🕶️<span className="text-[4px] font-bold">கலைஞர்</span></div>
                            </div>
                            <div className="text-center flex-1">
                              <div className="text-[7px] font-bold text-[#D50000]">கழகத் தலைவர் மு.க.ஸ்டாலின் வழியில்</div>
                              <div className="text-xs font-black text-black leading-none my-0.5">திராவிட முன்னேற்றக் கழகம்</div>
                              <div className="text-[8px] font-bold text-[#D50000]">{constituency}</div>
                            </div>
                            <div className="w-9 h-11 border border-[#D50000] rounded bg-white flex flex-col items-center justify-center">
                              <span className="text-base">🌅</span>
                              <span className="text-[5px] font-bold">மு.க.ஸ்டாலின்</span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (isADMK) {
                      return (
                        <div className="bg-white border-t-4 border-t-black border-b-2 border-b-[#008000] rounded p-2 mb-4 shadow-xs">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex gap-1">
                              <div className="w-7 h-9 border border-[#008000] rounded text-center text-[10px] flex flex-col items-center justify-center">👑<span className="text-[5px] font-bold text-[#008000]">MGR</span></div>
                              <div className="w-7 h-9 border border-[#008000] rounded text-center text-[10px] flex flex-col items-center justify-center">🌸<span className="text-[5px] font-bold text-[#008000]">அம்மா</span></div>
                            </div>
                            <div className="text-center flex-1">
                              <div className="text-[7px] font-bold text-[#008000]">புரட்சித் தலைவர் MGR - அம்மா ஆசியுடன்</div>
                              <div className="text-[11px] font-black text-black leading-none my-0.5">அனைத்திந்திய அண்ணா திராவிட முன்னேற்றக் கழகம்</div>
                              <div className="text-[8px] font-bold text-[#008000]">{constituency}</div>
                            </div>
                            <div className="w-9 h-11 border border-[#008000] rounded bg-white flex flex-col items-center justify-center">
                              <span className="text-base">🍃🍃</span>
                              <span className="text-[5px] font-bold text-[#008000]">இரட்டை இலை</span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (layoutStyle === 'mla_govt') {
                      return (
                        <div className="border-b-2 border-slate-900 pb-3 mb-4 flex items-center gap-3">
                          <div className="w-12 h-14 bg-amber-50 border border-amber-300 rounded flex flex-col items-center justify-center text-center flex-shrink-0">
                            <span className="text-2xl">🏛️</span>
                            <span className="text-[5.5px] font-black text-amber-900 leading-tight">GOVT OF TN</span>
                          </div>
                          <div className="flex-1">
                            <div className="text-[11px] font-extrabold text-slate-900 font-tamil leading-tight">{selectedProfile?.designation_ta || selectedProfile?.designation_en || 'சட்டமன்ற உறுப்பினர் (MLA)'}</div>
                            <div className="text-[10px] font-bold text-blue-900 font-tamil">{constituency}</div>
                            <div className="text-[8px] text-slate-500 font-tamil">{selectedProfile?.address_ta || selectedProfile?.address_en || 'தமிழ்நாடு சட்டமன்றப் பேரவை, தலைமைச் செயலகம், சென்னை'}</div>
                          </div>
                        </div>
                      );
                    }

                    // Default classic
                    return (
                      <div className="border-b-2 pb-3 mb-4 flex items-center justify-between gap-3" style={{ borderColor: profileColor }}>
                        <div className="flex-1">
                          <div className="text-[8px] font-bold uppercase tracking-wider" style={{ color: profileColor }}>
                            {selectedProfile?.party_name_ta || selectedProfile?.party_name_en || 'கழக அலுவலகம்'}
                          </div>
                          <div className="text-sm font-extrabold text-slate-900 font-tamil">
                            {selectedProfile?.profile_name_ta || selectedProfile?.profile_name_en}
                          </div>
                          <div className="text-[9.5px] font-semibold text-slate-600 font-tamil">
                            {selectedProfile?.party_role || selectedProfile?.designation_ta || selectedProfile?.designation_en} &bull; {constituency}
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-xs shadow-xs flex-shrink-0" style={{ backgroundColor: profileColor }}>
                          {abbr ? abbr.substring(0, 3) : '★'}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Ref & Date Bar */}
                  <div className="flex justify-between text-[10px] text-slate-600 font-semibold mb-3 font-tamil">
                    <span className="font-mono">{dispatchRef || 'க.எண் / Ref: TN-2026-001'}</span>
                    <span>{ta ? 'நாள்:' : 'Date:'} {new Date().toLocaleDateString(ta ? 'ta-IN' : 'en-IN')}</span>
                  </div>

                  {/* Recipient */}
                  {(recipient || recipientAddr) && (
                    <div className="text-[11px] font-tamil text-slate-800 mb-3 leading-snug">
                      <div className="text-slate-500 font-bold">{ta ? 'பெறுநர்:' : 'To:'}</div>
                      <div className="font-bold">{recipient}</div>
                      <div className="text-slate-600">{recipientAddr}</div>
                    </div>
                  )}

                  {/* Subject */}
                  {subject && (
                    <div className="text-[11.5px] font-bold font-tamil text-slate-900 mb-3 bg-slate-50 p-2 border-l-2 border-blue-600">
                      <u>{ta ? 'பொருள்:' : 'Subject:'} {subject}</u>
                    </div>
                  )}

                  {/* Content body */}
                  <div className="text-[11px] font-tamil text-slate-800 leading-relaxed text-justify whitespace-pre-wrap min-h-[140px]">
                    {body || (
                      <span className="text-slate-300 italic">
                        {ta ? 'கடிதத்தின் உரை இங்கே நேரலையாகக் காட்சியளிக்கும்...' : 'Letter text will appear here in real-time...'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Signatory & Stamp */}
                <div className="mt-6 pt-3 border-t border-slate-200 flex justify-between items-end">
                  
                  {/* Circular Seal Simulation */}
                  <div>
                    {hasSeal && (
                      <div className="w-16 h-16 rounded-full border-2 border-blue-900/60 flex flex-col items-center justify-center text-[6px] font-bold text-blue-950/80 rotate-[-10deg]">
                        <span>★ OFFICIAL ★</span>
                        <span className="text-[5px]">DISPATCH SEAL</span>
                        <span>{new Date().getFullYear()}</span>
                      </div>
                    )}
                  </div>

                  {/* Signatory */}
                  <div className="text-right font-tamil">
                    <div className="h-6 border-b border-dashed border-slate-300 w-28 ml-auto mb-1"></div>
                    <div className="font-bold text-xs text-slate-900">{selectedProfile?.profile_name_ta || selectedProfile?.profile_name_en}</div>
                    <div className="text-[10px] text-slate-600">{selectedProfile?.party_role || selectedProfile?.designation_en}</div>
                  </div>

                </div>

                {/* Footer with QR */}
                <div className="mt-4 pt-2 border-t border-slate-100 flex justify-between items-center text-[8.5px] text-slate-400 font-tamil">
                  <div>
                    <div className="font-mono font-bold text-blue-600 text-[9px]">{letterId ? `ID: ${letterId.substring(0,8)}...` : 'TN-VERIFIED-DOC'}</div>
                    <div>AI Letter Pad தமிழ்நாடு &bull; QR சரிபார்ப்பு கொண்டது</div>
                  </div>
                  <div className="w-10 h-10 border border-slate-200 bg-slate-50 flex items-center justify-center text-[7px] text-slate-400 font-mono text-center">
                    QR SEAL
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LetterDesigner;
