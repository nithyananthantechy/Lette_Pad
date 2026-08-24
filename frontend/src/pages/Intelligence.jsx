// src/pages/Intelligence.jsx — AI Political Intelligence, Speech Studio & AI Voice
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sparkles, Search, MapPin, Newspaper, Volume2, VolumeX, Play, Pause,
  Square, RefreshCw, Copy, Check, Share2, ArrowRight, ExternalLink,
  Building2, Users, AlertTriangle, TrendingUp, ShieldCheck, Flame,
  FileText, MessageSquare, Twitter, Layers, Mic, Sliders
} from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../lib/api';
import toast from 'react-hot-toast';

const TN_DISTRICTS = [
  'ஈரோடு (Erode)',
  'சென்னை (Chennai)',
  'கோயம்புத்தூர் (Coimbatore)',
  'மதுரை (Madurai)',
  'சேலம் (Salem)',
  'திருச்சிராப்பள்ளி (Trichy)',
  'திருப்பூர் (Tiruppur)',
  'திண்டுக்கல் (Dindigul)',
  'திருநெல்வேலி (Tirunelveli)',
  'வேலூர் (Vellore)',
  'தஞ்சாவூர் (Thanjavur)',
  'நாமக்கல் (Namakkal)',
  'கன்னியாகுமரி (Kanyakumari)'
];

const ERODE_CONSTITUENCIES = [
  'அனைத்து தொகுதிகள் (All Constituencies)',
  'ஈரோடு கிழக்கு (Erode East)',
  'ஈரோடு மேற்கு (Erode West)',
  'மொடக்குறிச்சி (Modakkurichi)',
  'பெருந்துறை (Perundurai)',
  'பவானி (Bhavani)',
  'அந்தியூர் (Anthiyur)',
  'கோபிசெட்டிபாளையம் (Gobichettipalayam)',
  'பவானிசாகர் (Bhavanisagar)'
];

const CATEGORIES = [
  { id: 'all',                  label_ta: 'அனைத்து தகவல்கள்',   icon: '🌐' },
  { id: 'civic_issue',          label_ta: 'மக்கள் பிரச்சினைகள்', icon: '💧' },
  { id: 'govt_scheme',          label_ta: 'அரசு நலத்திட்டங்கள்', icon: '🏛️' },
  { id: 'agriculture_industry', label_ta: 'விவசாயம் & தொழில்',    icon: '🌾' },
  { id: 'politics_events',      label_ta: 'அரசியல் நிகழ்வுகள்',  icon: '⚖️' },
];

const SPEECH_TYPES = [
  { id: 'rally_speech',    label_ta: '🎙️ அனல் பறக்கும் மேடைப் பேச்சு',  desc: 'பிரசார பொதுக்கூட்ட உரை' },
  { id: 'press_statement', label_ta: '📢 பத்திரிகை செய்தி அறிக்கை',     desc: 'ஊடக அறிக்கை' },
  { id: 'social_media',    label_ta: '📱 X (Twitter) & WhatsApp பதிவு', desc: 'வைரல் சமூக ஊடகப் பதிவு' },
  { id: 'meeting_points',  label_ta: '📋 உள்கட்சி கூட்டக் குறிப்புகள்',     desc: 'நிர்வாகிகள் வழிகாட்டல்' },
  { id: 'govt_letter',     label_ta: '🏛️ அரசு கோரிக்கை மனு',          desc: 'மடல் வரைவு' },
];

const TONES = [
  { id: 'high_energy', label_ta: 'அனல் பறக்கும் அரசியல் வீச்சு (High Energy)' },
  { id: 'formal',      label_ta: 'அதிகாரப்பூர்வ அரசு நடை (Formal Official)' },
  { id: 'emotional',   label_ta: 'உணர்ச்சிபூர்வ மக்கள் பாசம் (Emotional Connect)' },
  { id: 'assertive',   label_ta: 'உறுதியான உரிமை முழக்கம் (Assertive Demand)' },
];

const Intelligence = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const ta = i18n.language === 'ta';

  // Filters
  const [district, setDistrict]         = useState('ஈரோடு (Erode)');
  const [constituency, setConstituency] = useState('ஈரோடு கிழக்கு (Erode East)');
  const [category, setCategory]         = useState('all');
  const [searchTopic, setSearchTopic]   = useState('');

  // Intelligence Data State
  const [loading, setLoading]         = useState(false);
  const [report, setReport]           = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  // Speech Generator State
  const [speechType, setSpeechType]     = useState('rally_speech');
  const [speechTone, setSpeechTone]     = useState('high_energy');
  const [speakerRole, setSpeakerRole]   = useState('கழக பேச்சாளர் / சட்டமன்ற உறுப்பினர்');
  const [speechDuration, setSpeechDuration] = useState('5_mins');
  const [customTopic, setCustomTopic]   = useState('');
  const [generatedSpeech, setGeneratedSpeech] = useState('');
  const [speechLoading, setSpeechLoading] = useState(false);
  const [copied, setCopied]             = useState(false);

  // AI Voice Synthesis State
  const [isSpeaking, setIsSpeaking]   = useState(false);
  const [isPaused, setIsPaused]       = useState(false);
  const [voiceRate, setVoiceRate]     = useState(1.0);
  const [voicePitch, setVoicePitch]   = useState(1.0);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);

  // Fetch initial intelligence on load
  const loadIntelligence = async () => {
    setLoading(true);
    try {
      const res = await api.post('/intelligence/analyze', {
        district: district.split(' ')[0],
        constituency: constituency.includes('அனைத்து') ? '' : constituency.split(' ')[0],
        topic: searchTopic,
        category,
        language: 'ta',
      });
      setReport(res.data.report);
      if (res.data.report?.intelligence_items?.length > 0) {
        setSelectedItem(res.data.report.intelligence_items[0]);
      }
      toast.success(ta ? '🎯 களப் புலனாய்வுத் தகவல்கள் புதுப்பிக்கப்பட்டன!' : '🎯 Area intelligence updated!');
    } catch {
      toast.error(ta ? 'தகவல் பெறுவதில் பிழை' : 'Failed to fetch intelligence');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIntelligence();
  }, [district, constituency, category]);

  // Voice setup
  useEffect(() => {
    const updateVoices = () => {
      if ('speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
        // Find Tamil or Indian voice
        const tamilVoice = voices.find(v => v.lang.includes('ta') || v.lang.includes('IN') || v.name.includes('India'));
        if (tamilVoice) setSelectedVoice(tamilVoice);
      }
    };
    updateVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  // Generate Speech / Content
  const handleGenerateSpeech = async (overrideTopic = null) => {
    const topicToUse = overrideTopic || customTopic || selectedItem?.title_ta || 'ஈரோடு தொகுதி மக்கள் பிரச்சினைகள் மற்றும் தீர்வுகள்';
    setSpeechLoading(true);
    try {
      const res = await api.post('/intelligence/generate-speech', {
        topic: topicToUse,
        context: selectedItem?.description_ta || '',
        intelligenceItem: selectedItem,
        speechType,
        speakerRole,
        constituency: constituency.includes('அனைத்து') ? district : constituency,
        district: district.split(' ')[0],
        tone: speechTone,
        duration: speechDuration,
        language: 'ta',
      });
      setGeneratedSpeech(res.data.content);
      toast.success(ta ? '✨ உரை/பதிவு வெற்றிகரமாக உருவாக்கப்பட்டது!' : '✨ Content generated!');
      
      // Scroll to speech section
      const el = document.getElementById('speech-output-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } catch {
      toast.error(ta ? 'உரை தயாரிப்பு தோல்வி' : 'Speech generation failed');
    } finally {
      setSpeechLoading(false);
    }
  };

  // AI Voice Handlers
  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      return toast.error('Browser does not support Speech Synthesis');
    }

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsSpeaking(true);
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsSpeaking(false);
      return;
    }

    if (!generatedSpeech) {
      return toast.error(ta ? 'முதலில் உரையை உருவாக்கவும்' : 'Generate speech first');
    }

    window.speechSynthesis.cancel();

    // Clean stage directions like [கைதட்டல்] before speaking
    const cleanText = generatedSpeech.replace(/\[.*?\]/g, '').trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = voiceRate;
    utterance.pitch = voicePitch;
    if (selectedVoice) utterance.voice = selectedVoice;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleStopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  const handleCopy = () => {
    if (!generatedSpeech) return;
    navigator.clipboard.writeText(generatedSpeech);
    setCopied(true);
    toast.success(ta ? 'உரை நகலெடுக்கப்பட்டது!' : 'Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const sendToLetterStudio = () => {
    if (!generatedSpeech) return;
    // Save to local storage for LetterDesigner
    localStorage.setItem('imported_speech_content', generatedSpeech);
    localStorage.setItem('imported_speech_subject', selectedItem?.title_ta || customTopic || 'கோரிக்கை மனு');
    toast.success(ta ? 'மடல் கூடத்திற்கு அனுப்பப்படுகிறது...' : 'Redirecting to Letter Studio...');
    setTimeout(() => navigate('/letters/new'), 500);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-tamil pb-16">
      <Navbar />

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 text-white border-b border-indigo-900/40 py-8 px-6 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-semibold mb-2">
              <Sparkles size={14} className="text-amber-400" />
              <span>AI நேரலை அரசியல் &amp; தொகுதி புலனாய்வு மையம்</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3">
              <span>📡</span> AI புலனாய்வு, மேடைப் பேச்சு &amp; குரல் ஒலி மையம்
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              கூகுள், முன்னணி செய்தித்தாள்கள் மற்றும் அரசுத் தளங்களிலிருந்து தொகுதிக்கான உண்மைத் தகவல்களைத் திரட்டி, உடனுக்குடன் அனல் பறக்கும் மேடைப் பேச்சு, ஊடக அறிக்கை மற்றும் AI குரல் ஒலி வடிவத்தை உருவாக்குங்கள்.
            </p>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <Link to="/letters/new" className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-semibold text-white transition-all flex items-center gap-2 shadow-sm">
              <FileText size={15} /> {ta ? 'மடல் தயாரிப்பு கூடம்' : 'Letterhead Studio'}
            </Link>
            <button onClick={loadIntelligence} disabled={loading}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold text-white transition-all shadow-lg flex items-center gap-2">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              {ta ? 'புலனாய்வு புதுப்பி' : 'Refresh Intel'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* 1. REGIONAL FILTER BAR */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            
            {/* District */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 font-tamil mb-1 flex items-center gap-1">
                <MapPin size={13} className="text-blue-600" />
                {ta ? 'மாவட்டம் (District)' : 'District'}
              </label>
              <select
                value={district}
                onChange={e => setDistrict(e.target.value)}
                className="input-field text-xs py-2.5 bg-slate-50 font-bold"
              >
                {TN_DISTRICTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Constituency */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 font-tamil mb-1 flex items-center gap-1">
                <Building2 size={13} className="text-indigo-600" />
                {ta ? 'சட்டமன்றத் தொகுதி (Constituency)' : 'Constituency'}
              </label>
              <select
                value={constituency}
                onChange={e => setConstituency(e.target.value)}
                className="input-field text-xs py-2.5 bg-slate-50 font-bold"
              >
                {ERODE_CONSTITUENCIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Topic Search */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 font-tamil mb-1 flex items-center gap-1">
                <Search size={13} className="text-amber-500" />
                {ta ? 'குறிப்பிட்ட தலைப்பு / பிரச்சினை தேடல்' : 'Topic Search'}
              </label>
              <div className="flex gap-2">
                <input
                  value={searchTopic}
                  onChange={e => setSearchTopic(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loadIntelligence()}
                  placeholder={ta ? 'எ.கா: குடிநீர், மஞ்சள் விலை, விசைத்தறி மின்கட்டணம், மகளிர் உரிமை...' : 'E.g.: Water supply, Turmeric prices, Weavers electricity...'}
                  className="input-field text-xs py-2.5"
                />
                <button
                  onClick={loadIntelligence}
                  className="px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold font-tamil flex-shrink-0"
                >
                  {ta ? 'தேடு' : 'Search'}
                </button>
              </div>
            </div>

          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 border-t border-slate-100 text-xs">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl font-tamil transition-all flex items-center gap-1.5 flex-shrink-0
                  ${category === cat.id
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label_ta}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. MAIN GRID: LEFT = LIVE INTELLIGENCE FEED (7 Cols), RIGHT = SPEECH & VOICE STUDIO (5 Cols) */}
        <div className="grid lg:grid-cols-12 gap-6">

          {/* LEFT: Live Verified Area Intelligence Feed */}
          <div className="lg:col-span-7 space-y-4">
            
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold font-tamil text-slate-900 flex items-center gap-2">
                  <Newspaper size={18} className="text-blue-600" />
                  <span>{district} &bull; {constituency} நேரலை களத் தகவல்கள்</span>
                </h2>
                <p className="text-xs text-slate-500 font-tamil mt-0.5">
                  உறுதிப்படுத்தப்பட்ட செய்தி ஆதாரங்களுடன் கூடிய அண்மைக்கால நிலவரம்
                </p>
              </div>
              <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                ✓ Live Verified
              </span>
            </div>

            {/* Executive Summary Card */}
            {report?.summary_ta && (
              <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-300 mb-1">
                  <ShieldCheck size={14} /> தொகுதி கள நிலவர சுருக்கம் (Executive Pulse):
                </div>
                <p className="text-xs text-slate-100 leading-relaxed font-tamil">
                  {report.summary_ta}
                </p>
              </div>
            )}

            {/* Intelligence Items List */}
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 animate-pulse space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-100 rounded w-full"></div>
                    <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : report?.intelligence_items?.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
                <p className="text-xs text-slate-500 font-tamil">இந்த தேடலுக்கு தகவல்கள் இல்லை. வேறு தலைப்பைத் தேர்ந்தெடுக்கவும்.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {report?.intelligence_items?.map(item => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedItem(item);
                      setCustomTopic(item.title_ta);
                    }}
                    className={`bg-white p-5 rounded-2xl border-2 transition-all cursor-pointer hover:shadow-md
                      ${selectedItem?.id === item.id
                        ? 'border-blue-600 bg-blue-50/40 shadow-sm ring-1 ring-blue-600'
                        : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase
                          ${item.severity === 'critical' ? 'bg-red-100 text-red-700 border border-red-200'
                            : item.severity === 'positive' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                          {item.severity === 'critical' ? '🚨 அவசர கவனம்' : item.severity === 'positive' ? '✨ நலத்திட்டம்' : '⚡ முக்கிய விவாதம்'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-tamil">{item.date}</span>
                      </div>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">
                        ஆதாரம்: {item.verified_source}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 font-tamil leading-snug mb-1.5">
                      {item.title_ta}
                    </h3>

                    <p className="text-xs text-slate-600 font-tamil leading-relaxed mb-3">
                      {item.description_ta}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100 text-xs font-tamil">
                      <div className="text-[11px] text-slate-500 font-semibold">
                        👥 தாக்கம்: <span className="text-slate-800 font-bold">{item.public_impact}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem(item);
                            setCustomTopic(item.title_ta);
                            handleGenerateSpeech(item.title_ta);
                          }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold font-tamil flex items-center gap-1 shadow-xs"
                        >
                          <Sparkles size={12} /> {ta ? 'உரை தயாரிக்க' : 'Draft Speech'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* RIGHT: Speech & AI Voice Studio (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Speech Configuration Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold font-tamil text-slate-900 text-sm flex items-center gap-2">
                  <Mic size={16} className="text-blue-600" />
                  {ta ? 'அரசியல் மேடைப் பேச்சு & அறிக்கை கூடம்' : 'Speech & Media Studio'}
                </h3>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                  Gemini 3.6 Flash
                </span>
              </div>

              {/* Speech Type Picker */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 font-tamil mb-1.5">
                  {ta ? 'உரை / வடிவ வகை (Content Format)' : 'Content Type'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SPEECH_TYPES.map(st => (
                    <button
                      key={st.id}
                      onClick={() => setSpeechType(st.id)}
                      className={`p-2 rounded-xl border text-left text-xs font-tamil transition-all
                        ${speechType === st.id
                          ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'}`}
                    >
                      <div className="font-semibold text-xs leading-tight">{st.label_ta}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{st.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone & Duration */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 font-tamil mb-1">
                    {ta ? 'உரை நடை (Tone)' : 'Tone Style'}
                  </label>
                  <select
                    value={speechTone}
                    onChange={e => setSpeechTone(e.target.value)}
                    className="input-field text-xs py-2 bg-slate-50"
                  >
                    {TONES.map(t => (
                      <option key={t.id} value={t.id}>{t.label_ta}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 font-tamil mb-1">
                    {ta ? 'உரை கால அளவு (Duration)' : 'Duration'}
                  </label>
                  <select
                    value={speechDuration}
                    onChange={e => setSpeechDuration(e.target.value)}
                    className="input-field text-xs py-2 bg-slate-50"
                  >
                    <option value="2_mins">2 நிமிடங்கள் (Short Point)</option>
                    <option value="5_mins">5 நிமிடங்கள் (Standard Rally)</option>
                    <option value="10_mins">10 நிமிடங்கள் (Keynote Address)</option>
                  </select>
                </div>
              </div>

              {/* Speaker Role */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 font-tamil mb-1">
                  {ta ? 'பேச்சாளர் / பதவி (Speaker Role)' : 'Speaker Role'}
                </label>
                <input
                  value={speakerRole}
                  onChange={e => setSpeakerRole(e.target.value)}
                  className="input-field text-xs py-2 font-tamil font-semibold"
                  placeholder="எ.கா: கழக பேச்சாளர் / சட்டமன்ற உறுப்பினர்"
                />
              </div>

              {/* Custom Topic Override */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 font-tamil mb-1">
                  {ta ? 'உரைக்கான முதன்மை தலைப்பு (Speech Focus Topic)' : 'Topic'}
                </label>
                <textarea
                  value={customTopic}
                  onChange={e => setCustomTopic(e.target.value)}
                  rows={2}
                  className="input-field text-xs py-2 font-tamil"
                  placeholder={ta ? 'தேர்ந்தெடுக்கப்பட்ட செய்தியின் தலைப்பு அல்லது நீங்கள் விரும்பும் தலைப்பு...' : 'Enter speech topic...'}
                />
              </div>

              <button
                onClick={() => handleGenerateSpeech()}
                disabled={speechLoading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold font-tamil shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {speechLoading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={15} />}
                <span>{ta ? '✨ உரையை உடனடியாக உருவாக்கு' : 'Generate Political Speech'}</span>
              </button>
            </div>

            {/* Generated Speech Display & AI Voice Player */}
            <div id="speech-output-section" className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Volume2 size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold font-tamil text-sm">உரை &amp; AI குரல் ஒலி வடிவம்</h3>
                    <p className="text-[10px] text-slate-400 font-tamil">Speech Text &amp; Natural AI Voice Player</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopy}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors text-xs flex items-center gap-1 font-tamil"
                    title={ta ? 'நகலெடு' : 'Copy'}
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                  <button
                    onClick={sendToLetterStudio}
                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold font-tamil flex items-center gap-1"
                    title="Letterhead Studio"
                  >
                    <FileText size={13} /> {ta ? 'மடல் தயாரிப்பு' : 'To Letterpad'}
                  </button>
                </div>
              </div>

              {/* AI Voice Player Control Bar */}
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSpeak}
                    disabled={!generatedSpeech}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md
                      ${isSpeaking
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                  >
                    {isSpeaking ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                  </button>

                  <button
                    onClick={handleStopSpeech}
                    disabled={!isSpeaking && !isPaused}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-colors disabled:opacity-30"
                  >
                    <Square size={14} />
                  </button>

                  <div>
                    <div className="text-xs font-bold font-tamil flex items-center gap-1.5">
                      {isSpeaking && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>}
                      <span>{isSpeaking ? 'குரல் ஒலித்துக்கொண்டிருக்கிறது...' : isPaused ? 'இடைநிறுத்தப்பட்டுள்ளது' : 'AI குரல் கேட்க தயார்'}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-tamil">Tamil Natural Voice Synthesizer</div>
                  </div>
                </div>

                {/* Voice Speed Slider */}
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Sliders size={13} />
                  <span>வேகம்:</span>
                  <input
                    type="range"
                    min="0.8"
                    max="1.3"
                    step="0.1"
                    value={voiceRate}
                    onChange={e => setVoiceRate(parseFloat(e.target.value))}
                    className="w-20 accent-blue-500"
                  />
                  <span className="font-mono text-[11px] text-white">{voiceRate}x</span>
                </div>

              </div>

              {/* Text Area Display */}
              <div className="relative">
                <textarea
                  readOnly
                  value={generatedSpeech}
                  rows={14}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-tamil text-slate-100 leading-relaxed focus:outline-none select-text"
                  placeholder={ta
                    ? 'இடதுபுறம் உள்ள ஏதேனும் ஒரு செய்தியைத் தேர்வு செய்து "உரை தயாரிக்க" கிளிக் செய்யவும். அனல் பறக்கும் மேடைப் பேச்சு இங்கே தயாராகும்...'
                    : 'Select a news item on the left and click "Draft Speech" to generate high-impact political speech here...'}
                />
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default Intelligence;
