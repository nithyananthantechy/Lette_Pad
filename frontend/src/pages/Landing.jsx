// src/pages/Landing.jsx — Enterprise Landing Page with 3-Tier Pricing & Data Privacy Guarantee
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Shield, FileText, QrCode, TrendingUp, CheckCircle2, Lock,
  ShieldAlert, Sparkles, Building2, UserCheck, ArrowRight,
  Database, Server, Award, PhoneCall
} from 'lucide-react';
import Navbar from '../components/Navbar';

const parties = [
  { abbr: 'DMK',   name_ta: 'திமுக',    name_en: 'Dravida Munnetra Kazhagam',      color: '#CC0000', bg: '#fff0f0' },
  { abbr: 'ADMK',  name_ta: 'அதிமுக',   name_en: 'All India Anna DMK',             color: '#006400', bg: '#f0fff0' },
  { abbr: 'TVK',   name_ta: 'தவெக',     name_en: 'Tamilaga Vettri Kazhagam',       color: '#DAA520', bg: '#fffff0' },
  { abbr: 'PMK',   name_ta: 'பமக',      name_en: 'Pattali Makkal Katchi',          color: '#FF8C00', bg: '#fff8f0' },
  { abbr: 'VCK',   name_ta: 'விசிக',    name_en: 'Viduthalai Chiruthaigal Katchi', color: '#0000CC', bg: '#f0f0ff' },
  { abbr: 'NTK',   name_ta: 'நாதக',     name_en: 'Naam Tamilar Katchi',            color: '#FF4500', bg: '#fff2f0' },
  { abbr: 'DMDK',  name_ta: 'தேமுதிக',  name_en: 'Desiya Murpokku Dravida K.',    color: '#800080', bg: '#fff0ff' },
  { abbr: 'BJP',   name_ta: 'பாஜக',     name_en: 'Bharatiya Janata Party',         color: '#FF6600', bg: '#fff4f0' },
];

const erodeConstituencies = [
  'ஈரோடு கிழக்கு (Erode East)',
  'ஈரோடு மேற்கு (Erode West)',
  'மொடக்குறிச்சி (Modakkurichi)',
  'பெருந்துறை (Perundurai)',
  'பவானி (Bhavani)',
  'அந்தியூர் (Anthiyur)',
  'கோபிசெட்டிபாளையம் (Gobichettipalayam)',
  'பவானிசாகர் (Bhavanisagar)'
];

const pricingPlans = [
  {
    id: 'simple',
    name_ta: 'எளிய திட்டம் (Simple Starter)',
    name_en: 'Starter Plan',
    price: '₹999',
    period: '/ மாதம் (Per Month)',
    desc_ta: 'ஒற்றை நிர்வாகி அல்லது தனிப்பட்ட மக்கள் பிரதிநிதிகளுக்கு ஏற்றது.',
    features: [
      '1 மடல் தலைப்பு சுயவிவரம் (Single Profile)',
      'மாதம் 50 AI வரைவு கடிதங்கள்',
      'QR குறியீடு சரிபார்ப்பு (QR Verification)',
      'A4 நேரடி அச்சு மற்றும் PDF பதிவிறக்கம்',
      'மின்னஞ்சல் OTP பாதுகாப்பு',
      '7 ஆண்டு தணிக்கைப் பதிவு (Audit Trail)',
    ],
    cta_ta: 'திட்டத்தைத் தேர்வு செய்',
    highlight: false,
  },
  {
    id: 'medium',
    name_ta: 'தொகுதி திட்டம் (Constituency Pro)',
    name_en: 'Constituency Pro Plan',
    price: '₹2,999',
    period: '/ மாதம் (Per Month)',
    badge: 'மிகவும் பிரபலம் / Recommended',
    desc_ta: 'சட்டமன்ற உறுப்பினர்கள் (MLA), மாவட்டச் செயலாளர்கள் & தொகுதி அமைப்பாளர்களுக்கு.',
    features: [
      '5 மடல் தலைப்பு சுயவிவரங்கள் (MLA, Office, Secretary)',
      'வரம்பற்ற AI வரைவு கடிதங்கள் (Unlimited AI)',
      '4 பிரத்யேக லேஅவுட்கள் (MLA, Party, Press, Minimal)',
      'கடிதக் குறிப்பு எண் (Dispatch Ref) ஆட்டோமேஷன்',
      'அதிகாரப்பூர்வ டிஜிட்டல் முத்திரை (Official Seal)',
      '5 உதவியாளர்கள் / PA துணைக்கணக்குகள் (Team Access)',
      'ஈரோடு & தமிழ்நாடு அனைத்து தொகுதி வார்ப்புருக்கள்',
      '24/7 முன்னுரிமை வாட்ஸ்அப் உதவி',
    ],
    cta_ta: 'தொகுதி திட்டத்தில் இணை',
    highlight: true,
  },
  {
    id: 'custom',
    name_ta: 'மாநில நிர்வாகம் (Custom Enterprise)',
    name_en: 'State Enterprise Plan',
    price: 'தனிப்பயன் (Custom)',
    period: 'ஆண்டு ஒப்பந்தம் / Yearly',
    desc_ta: 'முழு மாநிலக் கட்சித் தலைமையகம் அல்லது அரசுத் துறைகளுக்கு.',
    features: [
      'வரம்பற்ற தொகுதிகள் & மாவட்டப் பொறுப்பாளர்கள்',
      'தனிப்பயன் தனி சர்வர் (Dedicated Isolated Database)',
      'ஆன்-பிரமைஸ் / அரசு கிளவுட் பொருத்துதல்',
      'White-Label பிராண்டிங் & தனிப்பயன் லோகோ',
      'துறை சார்ந்த AI மாதிரி பயிற்சி (Custom Model)',
      'அரசு e-Governance API இணைப்பு',
      'பிரத்யேக கணக்கு மேலாளர் & நேரடிப் பயிற்சி',
    ],
    cta_ta: 'எங்களைத் தொடர்பு கொள்க',
    highlight: false,
  }
];

const Landing = () => {
  const { i18n } = useTranslation();
  const ta = i18n.language === 'ta';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-tamil">
      <Navbar />

      {/* 1. HERO SECTION */}
      <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-24 text-center relative z-10">
          
          {/* Erode Spotlight Badge */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600/30 to-indigo-600/30 border border-blue-400/40 backdrop-blur px-4 py-2 rounded-full text-xs mb-6 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-blue-200 font-semibold">
              🏛️ தமிழ்நாடு &amp; ஈரோடு மண்டல அதிகாரப்பூர்வ AI மடல் தளம்
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
            அரசியல் கட்சிகள் மற்றும் மக்கள் பிரதிநிதிகளுக்கான<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">
              AI மடல் தயாரிப்பு &amp; சரிபார்ப்புக் கூடம்
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed">
            ஈரோடு உள்ளிட்ட தமிழ்நாட்டின் அனைத்து சட்டமன்றத் தொகுதிகள், கழக மாவட்ட அமைப்புகள் மற்றும் அரசு அலுவலர்களுக்குத் தேவையான கோரிக்கை மனுக்கள், வாழ்த்து மடல்கள், பத்திரிகை அறிக்கைகளை நிமிடங்களில் வடிவமைத்து QR குறியீட்டுடன் அச்சிடுங்கள்.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/register"
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-xl hover:shadow-blue-500/25 flex items-center justify-center gap-2 text-sm">
              <span>🚀 இலவசமாகப் பதிவு செய்யுங்கள்</span>
              <ArrowRight size={16} />
            </Link>
            <a href="#pricing"
              className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl transition-all border border-white/20 text-sm">
              💳 கட்டண விபரம் காண்க (Pricing)
            </a>
          </div>

          {/* Key Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-4xl mx-auto pt-10 border-t border-slate-800/80">
            <div>
              <div className="text-3xl font-extrabold text-blue-400">243+</div>
              <div className="text-xs text-slate-400 mt-1">பதிவுபெற்ற கட்சிகள்</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-sky-400">234</div>
              <div className="text-xs text-slate-400 mt-1">சட்டமன்றத் தொகுதிகள்</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-emerald-400">100%</div>
              <div className="text-xs text-slate-400 mt-1">கட்சித் தரவு தனிப்பாதுகாப்பு</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-purple-400">SHA-256</div>
              <div className="text-xs text-slate-400 mt-1">QR ஆவண ஒருமைப்பாடு</div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. DATA ISOLATION & PRIVACY ASSURANCE SECTION (Crucial for Multi-Party trust) */}
      <section className="py-16 px-6 bg-slate-900 text-white border-y border-slate-800">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-3">
              <Lock size={14} /> கட்சித் தரவு தனிமைப்படுத்தல் சான்றளிப்பு
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold">
              ஒரு கட்சியின் தரவை பிற கட்சியோ அல்லது வெளிநபரோ காண முடியுமா?
            </h2>
            <p className="text-slate-400 text-sm mt-3">
              <strong>முற்றிலும் முடியாது!</strong> எங்கள் தளத்தில் வங்கி மற்றும் ராணுவத் தரத்திலான மல்டி-டெனன்ட் (Multi-Tenant) தரவுப் பாதுகாப்பு செயல்படுத்தப்பட்டுள்ளது.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                <Database size={24} />
              </div>
              <h3 className="font-bold text-base mb-2">தனிப்பட்ட தரவுத்தளம் (Isolated Encryption)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                தவெக (TVK) பயனரின் கடிதங்கள் மற்றும் விவரங்களை திமுக (DMK), அதிமுக (AIADMK) அல்லது பாஜக (BJP) பயனர்கள் எக்காரணம் கொண்டும் அணுக இயலாது. ஒவ்வொரு கணக்கும் பிரத்யேக விசையுடன் குறியாக்கம் செய்யப்படுகிறது.
              </p>
            </div>

            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <ShieldCheck size={24} />
              </div>
              <h3 className="font-bold text-base mb-2">அரசு &amp; சட்டமன்ற ரகசிய காப்பு</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                சட்டமன்ற உறுப்பினர்களின் (MLA) உள்கடித வரைவுகள், துறை அதிகாரிகளுடனான கோப்புகள் வெளியிடப்படும் வரை ரகசியமாகப் பாதுகாக்கப்படும்.
              </p>
            </div>

            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                <Server size={24} />
              </div>
              <h3 className="font-bold text-base mb-2">இந்திய தரவு சேமிப்பகம் (DPDP Act 2023)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                அனைத்து சர்வர்களும் இந்தியாவிற்குள் மட்டுமே இயங்குகின்றன. இந்திய டிஜிட்டல் தரவு பாதுகாப்பு சட்ட விதிகளுக்கு (DPDP Act 2023) 100% இணக்கமானது.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 3. ERODE DISTRICT SPOTLIGHT */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-gradient-to-br from-slate-50 to-blue-50/50 p-8 rounded-3xl border border-blue-100">
            <div>
              <div className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">மண்டல சிறப்புப் பார்வை</div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">
                ஈரோடு மாவட்டத்தின் அனைத்து தொகுதிகளுக்கும் தயார்
              </h2>
              <p className="text-xs text-slate-600 max-w-xl leading-relaxed mb-4">
                ஈரோடு கிழக்கு, ஈரோடு மேற்கு, பெருந்துறை, மொடக்குறிச்சி, பவானி, அந்தியூர், கோபிசெட்டிபாளையம் மற்றும் பவானிசாகர் ஆகிய தொகுதிகளுக்கான கழக அமைப்பாளர்கள் உடனடியாகப் பயன்படுத்தலாம்.
              </p>
              <div className="flex flex-wrap gap-2">
                {erodeConstituencies.map((c, i) => (
                  <span key={i} className="bg-white border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-xl font-medium shadow-2xs">
                    📍 {c}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex-shrink-0">
              <Link to="/letters/new" className="btn-primary text-xs py-3 px-6 shadow-md inline-block">
                ஈரோடு மடல் தயாரிக்க →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PARTIES SHOWCASE */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">அனைத்து முன்னணி அரசியல் கட்சிகளுக்கான வடிவமைப்பு</h2>
            <p className="text-xs text-slate-500">அங்கீகரிக்கப்பட்ட கட்சி நிறங்கள், சின்னங்கள் மற்றும் அதிகாரப்பூர்வ வார்ப்புருக்கள்</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {parties.map((p, i) => (
              <div key={i}
                className="bg-white p-4 rounded-2xl border-2 transition-all hover:shadow-md flex flex-col items-center text-center"
                style={{ borderColor: p.color + '33' }}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-sm mb-2 shadow-sm"
                  style={{ background: p.color }}>
                  {p.abbr}
                </div>
                <div className="font-bold text-xs text-slate-900">{p.name_ta}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-sans">{p.name_en}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. 3-TIER PRICING SECTION */}
      <section id="pricing" className="py-20 px-6 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">கட்டண விவரம்</div>
            <h2 className="text-3xl font-extrabold text-slate-900">
              எளிய &amp; வெளிப்படையான கட்டணத் திட்டங்கள்
            </h2>
            <p className="text-xs text-slate-500 mt-2">
              உங்கள் தொகுதி மற்றும் அரசியல் அமைப்பின் தேவைக்கேற்ப சரியான திட்டத்தைத் தேர்ந்தெடுங்கள்.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            {pricingPlans.map(plan => (
              <div
                key={plan.id}
                className={`rounded-3xl p-8 flex flex-col justify-between transition-all relative
                  ${plan.highlight
                    ? 'bg-slate-900 text-white shadow-2xl ring-2 ring-blue-500 md:-translate-y-2'
                    : 'bg-slate-50 text-slate-900 border border-slate-200 hover:shadow-lg'}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                    {plan.badge}
                  </div>
                )}

                <div>
                  <h3 className="font-bold text-lg mb-1">{plan.name_ta}</h3>
                  <div className="text-xs opacity-75 font-sans mb-4">{plan.name_en}</div>
                  
                  <div className="mb-4">
                    <span className="text-3xl font-black">{plan.price}</span>
                    <span className="text-xs opacity-70 ml-1">{plan.period}</span>
                  </div>

                  <p className={`text-xs mb-6 leading-relaxed ${plan.highlight ? 'text-slate-300' : 'text-slate-600'}`}>
                    {plan.desc_ta}
                  </p>

                  <div className="space-y-3 mb-8 text-xs">
                    {plan.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 size={16} className={`flex-shrink-0 mt-0.5 ${plan.highlight ? 'text-blue-400' : 'text-emerald-600'}`} />
                        <span className={plan.highlight ? 'text-slate-200' : 'text-slate-700'}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  to="/register"
                  className={`w-full py-3.5 rounded-xl font-bold text-xs text-center transition-all shadow-md
                    ${plan.highlight
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
                >
                  {plan.cta_ta}
                </Link>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-12 px-6 border-t border-slate-800 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <div className="font-bold text-sm text-white flex items-center justify-center sm:justify-start gap-2">
              <span>🏛️</span> AI Letter Pad தமிழ்நாடு
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              தமிழ்நாடு அரசியல் கட்சிகள் மற்றும் அரசு அலுவலர்களுக்கான அதிகாரப்பூர்வ மடல் தளம் &bull; ஈரோடு மண்டல பதிப்பு
            </div>
          </div>
          <div className="text-[11px] text-slate-500">
            &copy; 2026 AI Letter Pad. All rights reserved. Compliant with DPDP Act 2023.
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Landing;
