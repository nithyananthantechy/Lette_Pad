// src/pages/Profiles.jsx — Enterprise Letterhead Profiles Management (Party vs Government Mode)
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus, Building2, User, Trash2, MapPin, Sparkles, CheckCircle2,
  Shield, X, ShieldAlert, Award, FileText, Check
} from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../lib/api';
import toast from 'react-hot-toast';

const ERODE_CONSTITUENCIES = [
  'ஈரோடு கிழக்கு (Erode East)',
  'ஈரோடு மேற்கு (Erode West)',
  'மொடக்குறிச்சி (Modakkurichi)',
  'பெருந்துறை (Perundurai)',
  'பவானி (Bhavani)',
  'அந்தியூர் (Anthiyur)',
  'கோபிசெட்டிபாளையம் (Gobichettipalayam)',
  'பவானிசாகர் (Bhavanisagar)',
  'சென்னை மத்தியம் (Chennai Central)',
  'கோயம்புத்தூர் தெற்கு (Coimbatore South)',
  'மதுரை மத்தியம் (Madurai Central)',
  'சேலம் வடக்கு (Salem North)',
  'திருச்சி கிழக்கு (Trichy East)',
  'பொதுவான நிர்வாகம் / பிற தொகுதிகள்'
];

const GOVT_DEPARTMENTS = [
  { id: 'mla_mp',       name_ta: '🏛️ சட்டமன்ற உறுப்பினர் (MLA) / நாடாளுமன்ற உறுப்பினர் (MP)', default_role_ta: 'சட்டமன்ற உறுப்பினர் (MLA)', default_role_en: 'Member of Legislative Assembly (MLA)' },
  { id: 'collectorate', name_ta: '🏢 மாவட்ட ஆட்சியர் அலுவலகம் & வருவாய்த்துறை (Collectorate)', default_role_ta: 'மாவட்ட ஆட்சியர் மற்றும் மாவட்ட நீதிபதி (IAS)', default_role_en: 'District Collector & District Magistrate (IAS)' },
  { id: 'corporation',  name_ta: '🏙️ மாநகராட்சி / நகராட்சி நிர்வாகம் (Corporation / Municipality)', default_role_ta: 'மாநகராட்சி ஆணையர்', default_role_en: 'Corporation Commissioner' },
  { id: 'police',       name_ta: '👮 காவல் துறை (Tamil Nadu Police - SP / DSP)', default_role_ta: 'மாவட்ட காவல் கண்காணிப்பாளர் (IPS)', default_role_en: 'Superintendent of Police (IPS)' },
  { id: 'pwd',          name_ta: '🏗️ பொதுப்பணித்துறை (PWD) / நெடுஞ்சாலைத்துறை', default_role_ta: 'செயற்பொறியாளர் (PWD)', default_role_en: 'Executive Engineer (PWD)' },
  { id: 'health',       name_ta: '🏥 மக்கள் நல்வாழ்வு & அரசு மருத்துவமனை (Health Dept)', default_role_ta: 'மருத்துவக் கல்லூரி முதல்வர் / இணை இயக்குநர்', default_role_en: 'Dean / Joint Director of Health' },
  { id: 'education',    name_ta: '🎓 பள்ளி & உயர்கல்வித் துறை (Education Dept)', default_role_ta: 'முதன்மைக் கல்வி அலுவலர் (CEO)', default_role_en: 'Chief Educational Officer (CEO)' },
  { id: 'tneb',         name_ta: '⚡ தமிழ்நாடு மின்சார வாரியம் (TANGEDCO)', default_role_ta: 'மேற்பார்வைப் பொறியாளர் (SE)', default_role_en: 'Superintending Engineer (TANGEDCO)' },
  { id: 'agriculture',  name_ta: '🌾 வேளாண்மை & உழவர் நலத்துறை (Agriculture Dept)', default_role_ta: 'வேளாண்மை இணை இயக்குநர் (JD Agriculture)', default_role_en: 'Joint Director of Agriculture' },
];

const LAYOUT_OPTIONS = [
  { id: 'classic',       name_ta: 'கழக பிரம்மாண்டம் (Party High-Impact)', icon: '🏳️' },
  { id: 'mla_govt',      name_ta: 'சட்டமன்ற உறுப்பினர் / அரசு நடை (MLA & Govt Style)', icon: '🏛️' },
  { id: 'press_release', name_ta: 'பத்திரிகை செய்தி அறிக்கை (Press Release)', icon: '📢' },
  { id: 'minimal',       name_ta: 'நிர்வாக சுருக்கம் (Executive Minimal)', icon: '📄' },
];

const Profiles = () => {
  const { i18n } = useTranslation();
  const ta = i18n.language === 'ta';

  const [profiles, setProfiles]   = useState([]);
  const [parties, setParties]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const initialForm = {
    profile_type: 'party_profile',
    party_id: '',
    party_role: 'மாவட்ட கழகச் செயலாளர்',
    govt_dept: 'mla_mp',
    profile_name_en: '',
    profile_name_ta: '',
    designation_en: '',
    designation_ta: '',
    constituency: 'ஈரோடு கிழக்கு (Erode East)',
    address_en: '',
    address_ta: '',
    phone: '',
    email: '',
    website: '',
    layout_style: 'classic',
  };

  const [form, setForm] = useState(initialForm);

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const handleOpenEdit = (profile) => {
    setEditingId(profile.id);
    setForm({
      profile_type: profile.profile_type || 'party_profile',
      party_id: profile.party_id || '',
      party_role: profile.party_role || profile.designation_ta || '',
      govt_dept: profile.department_id || 'mla_mp',
      profile_name_en: profile.profile_name_en || '',
      profile_name_ta: profile.profile_name_ta || '',
      designation_en: profile.designation_en || '',
      designation_ta: profile.designation_ta || '',
      constituency: profile.constituency || 'ஈரோடு கிழக்கு (Erode East)',
      address_en: profile.address_en || '',
      address_ta: profile.address_ta || '',
      phone: profile.phone || '',
      email: profile.email || '',
      website: profile.website || '',
      layout_style: profile.layout_style || 'classic',
    });
    setShowModal(true);
  };

  const loadData = async () => {
    try {
      const [pRes, partyRes] = await Promise.all([api.get('/profiles'), api.get('/parties')]);
      setProfiles(pRes.data.profiles || []);
      setParties(partyRes.data.parties || []);
    } catch {
      toast.error(ta ? 'தரவு ஏற்றுவதில் பிழை' : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleInput = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  // Switch profile type
  const handleProfileTypeSwitch = (type) => {
    if (type === 'govt_profile') {
      setForm(f => ({
        ...f,
        profile_type: 'govt_profile',
        party_id: '',
        party_role: 'சட்டமன்ற உறுப்பினர் (MLA)',
        designation_ta: 'சட்டமன்ற உறுப்பினர் (MLA)',
        designation_en: 'Member of Legislative Assembly (MLA)',
        layout_style: 'mla_govt',
        address_ta: 'மாவட்ட ஆட்சியர் பெருந்திட்ட வளாகம் / சட்டமன்ற உறுப்பினர் அலுவலகம், ஈரோடு.',
        address_en: 'MLA Office / Collectorate Master Plan Complex, Erode - 638011.'
      }));
    } else {
      setForm(f => ({
        ...f,
        profile_type: 'party_profile',
        party_role: 'மாவட்ட கழகச் செயலாளர்',
        designation_ta: 'மாவட்ட கழகச் செயலாளர்',
        designation_en: 'District Party Secretary',
        layout_style: 'classic',
        address_ta: 'கழக தலைமை அலுவலகம், மேட்டூர் ரோடு, ஈரோடு.',
        address_en: 'Party District Office, Mettur Road, Erode - 638001.'
      }));
    }
  };

  // Switch govt department preset
  const handleDeptSelect = (deptId) => {
    const dept = GOVT_DEPARTMENTS.find(d => d.id === deptId);
    if (!dept) return;
    setForm(f => ({
      ...f,
      govt_dept: deptId,
      party_role: dept.default_role_ta,
      designation_ta: dept.default_role_ta,
      designation_en: dept.default_role_en,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.profile_name_en.trim()) {
      return toast.error(ta ? 'ஆங்கிலத்தில் பெயர் தேவை' : 'English name required');
    }
    setFormLoading(true);
    try {
      if (editingId) {
        await api.put(`/profiles/${editingId}`, form);
        toast.success(ta ? '✅ சுயவிவரம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது!' : '✅ Letterhead profile updated!');
      } else {
        await api.post('/profiles', form);
        toast.success(ta ? '✅ புதிய மடல் சுயவிவரம் உருவாக்கப்பட்டது!' : '✅ Letterhead profile created!');
      }
      setShowModal(false);
      setEditingId(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || (ta ? 'செயல்பாடு தோல்வி' : 'Operation failed'));
    } finally {
      setFormLoading(false);
    }
  };

  const deactivate = async (id) => {
    if (!confirm(ta ? 'இந்த சுயவிவரத்தை முடக்க விரும்புகிறீர்களா?' : 'Deactivate this profile?')) return;
    try {
      await api.delete(`/profiles/${id}`);
      toast.success(ta ? 'சுயவிவரம் முடக்கப்பட்டது' : 'Profile deactivated');
      loadData();
    } catch {
      toast.error(ta ? 'நீக்கம் தோல்வி' : 'Deactivation failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-tamil pb-16">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold font-tamil text-slate-900 flex items-center gap-2">
              <Building2 className="text-blue-600" />
              <span>{ta ? 'அதிகாரப்பூர்வ மடல் சுயவிவரங்கள்' : 'Official Letterhead Profiles'}</span>
            </h1>
            <p className="text-xs text-slate-500 font-tamil mt-1">
              அரசியல் கட்சிகள் மற்றும் அரசு அலுவலர்களுக்கான தனித்துவமான லெட்டர்பேட் வார்ப்புருக்கள்
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="btn-primary flex items-center gap-2 text-xs py-2.5 shadow-md self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>{ta ? '+ புதிய சுயவிவரம் சேர்' : '+ Add New Profile'}</span>
          </button>
        </div>

        {/* Security & Data Isolation Notice */}
        <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white p-4 rounded-2xl shadow-sm mb-6 flex items-center gap-3 border border-emerald-700/50">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <Shield size={20} />
          </div>
          <div className="text-xs font-tamil">
            <span className="font-bold text-emerald-300">100% கட்சி &amp; அரசுத் தரவு தனிமைப்படுத்தல்:</span> உங்கள் கட்சியின் உள்கடிதங்கள் மற்றும் சுயவிவரங்கள் பிற கட்சிகள் அல்லது வெளிநபர்கள் அணுக முடியாத வகையில் தனிப்பயன் குறியாக்கம் செய்யப்பட்டுள்ளன.
          </div>
        </div>

        {/* Profiles Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-48"></div>
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-lg mx-auto mt-8">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
              🏛️
            </div>
            <h3 className="font-bold font-tamil text-slate-900 text-base mb-1">
              சுயவிவரங்கள் எதுவும் பதிவு செய்யப்படவில்லை
            </h3>
            <p className="text-xs text-slate-500 font-tamil mb-6">
              முதலில் உங்கள் அரசியல் கட்சி அல்லது அரசு அலுவலகத்திற்கான மடல் சுயவிவரத்தை உருவாக்குங்கள்.
            </p>
            <button onClick={handleOpenCreate} className="btn-primary text-xs py-3 px-6 shadow-md">
              + முதல் சுயவிவரத்தை உருவாக்கவும்
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {profiles.map(profile => (
              <div key={profile.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs flex-shrink-0"
                      style={{ background: profile.party_color || (profile.profile_type === 'govt_profile' ? '#0f172a' : '#2563eb') }}>
                      {profile.profile_type === 'govt_profile' ? '🏛️' : (profile.abbreviation || 'TN')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold font-tamil text-slate-900 text-sm truncate">
                        {profile.profile_name_ta || profile.profile_name_en}
                      </div>
                      <div className="text-xs text-blue-600 font-bold font-tamil truncate">
                        {profile.party_role || profile.designation_ta || profile.designation_en || 'பொறுப்பாளர்'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-tamil truncate mt-0.5">
                        {profile.profile_type === 'govt_profile' ? '🏛️ தமிழ்நாடு அரசு / சட்டமன்றம்' : (profile.party_name_ta || 'அரசியல் பேரியக்கம்')}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 font-tamil bg-slate-50 p-3 rounded-xl mb-4">
                    {profile.constituency && (
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <MapPin size={13} className="text-red-500 flex-shrink-0" />
                        <span>{profile.constituency}</span>
                      </div>
                    )}
                    {profile.address_en && <div className="truncate">📍 {profile.address_en}</div>}
                    {profile.phone && <div>📞 {profile.phone}</div>}
                    {profile.email && <div className="truncate">✉️ {profile.email}</div>}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-tamil">
                  <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-semibold">
                    {LAYOUT_OPTIONS.find(l => l.id === profile.layout_style)?.name_ta || profile.layout_style}
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(profile)}
                      className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1 font-bold text-xs"
                      title={ta ? 'சுயவிவரம் திருத்து' : 'Edit Profile'}
                    >
                      <Edit3 size={13} className="text-blue-600" />
                      <span>{ta ? 'திருத்து' : 'Edit'}</span>
                    </button>
                    <button
                      onClick={() => deactivate(profile.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title={ta ? 'முடக்கு / நீக்கு' : 'Deactivate'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CREATE / EDIT MODAL — DYNAMIC PARTY VS GOVERNMENT FORM */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200">
              
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-t-3xl flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold font-tamil flex items-center gap-2">
                    <Sparkles size={18} className="text-amber-400" />
                    {editingId
                      ? (ta ? '✏️ மடல் சுயவிவரம் திருத்துதல்' : '✏️ Edit Letterhead Profile')
                      : (form.profile_type === 'govt_profile'
                          ? '🏛️ தமிழ்நாடு அரசு / சட்டமன்ற மடல் சுயவிவரம்'
                          : '🏳️ அரசியல் கட்சி மடல் சுயவிவரம் உருவாக்குதல்')}
                  </h2>
                  <p className="text-xs text-indigo-300 font-tamil mt-0.5">
                    {form.profile_type === 'govt_profile'
                      ? 'சட்டமன்ற உறுப்பினர்கள், மாவட்ட ஆட்சியர்கள் மற்றும் அரசுத் துறைகளுக்கான படிவம்'
                      : 'ஈரோடு மற்றும் அனைத்து தமிழ்நாடு அரசியல் பேரியக்கங்களுக்கான படிவம்'}
                  </p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={submit} className="p-6 space-y-4">
                
                {/* 1. Profile Type Toggle */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 font-tamil mb-1.5">
                    {ta ? 'சுயவிவர வகை தேர்வு (Choose Profile Category)' : 'Profile Category'}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleProfileTypeSwitch('party_profile')}
                      className={`p-3 border-2 rounded-xl transition-all font-tamil text-xs text-center flex items-center justify-center gap-2
                        ${form.profile_type === 'party_profile'
                          ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold shadow-sm ring-1 ring-blue-600'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'}`}
                    >
                      <span>🏳️</span>
                      <span>அரசியல் கட்சிப் பொறுப்பாளர்</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleProfileTypeSwitch('govt_profile')}
                      className={`p-3 border-2 rounded-xl transition-all font-tamil text-xs text-center flex items-center justify-center gap-2
                        ${form.profile_type === 'govt_profile'
                          ? 'border-slate-900 bg-slate-900 text-white font-bold shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'}`}
                    >
                      <span>🏛️</span>
                      <span>அரசு பிரதிநிதி / அலுவலர்</span>
                    </button>
                  </div>
                </div>

                {/* 2A. POLITICAL PARTY SPECIFIC FIELDS */}
                {form.profile_type === 'party_profile' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 font-tamil mb-1.5">
                      {ta ? 'அரசியல் கட்சித் தேர்வு (Party Selection)' : 'Select Political Party'}
                    </label>
                    <select name="party_id" value={form.party_id} onChange={handleInput} className="input-field text-xs py-2.5">
                      <option value="">{ta ? 'கட்சியைத் தேர்ந்தெடுக்கவும்' : 'Select Party'}</option>
                      {parties.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.abbreviation} — {ta ? (p.name_ta || p.name_en) : p.name_en}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 2B. GOVERNMENT OFFICIAL SPECIFIC FIELDS */}
                {form.profile_type === 'govt_profile' && (
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
                    <label className="block text-xs font-bold text-slate-800 font-tamil flex items-center gap-1.5">
                      <Award size={14} className="text-blue-600" />
                      <span>அரசு நிர்வாக வகை / துறை (Govt Category &amp; Department)</span>
                    </label>
                    <select
                      value={form.govt_dept}
                      onChange={e => handleDeptSelect(e.target.value)}
                      className="input-field text-xs py-2.5 bg-white font-bold"
                    >
                      {GOVT_DEPARTMENTS.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name_ta}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 3. Constituency & Role / Designation */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 font-tamil mb-1.5">
                      {form.profile_type === 'govt_profile' ? 'சட்டமன்றத் தொகுதி / மாவட்டம்' : 'கழகத் தொகுதி / மாவட்டம்'}
                    </label>
                    <select name="constituency" value={form.constituency} onChange={handleInput} className="input-field text-xs py-2.5">
                      {ERODE_CONSTITUENCIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 font-tamil mb-1.5">
                      {form.profile_type === 'govt_profile'
                        ? 'அதிகாரப்பூர்வ அரசுப் பதவி (Govt Designation)'
                        : 'கழகப் பொறுப்பு (Party Role)'}
                    </label>
                    <input
                      name="party_role"
                      value={form.party_role}
                      onChange={handleInput}
                      className="input-field text-xs py-2.5 font-tamil font-bold"
                      placeholder={form.profile_type === 'govt_profile'
                        ? 'எ.கா: சட்டமன்ற உறுப்பினர் (MLA) / மாவட்ட ஆட்சியர் (IAS)'
                        : 'எ.கா: மாவட்ட கழகச் செயலாளர்'}
                    />
                  </div>
                </div>

                {/* 4. Name in Tamil & English */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 font-tamil mb-1.5">
                      {ta ? 'பெயர் தமிழில் (Name in Tamil)' : 'Name in Tamil'}
                    </label>
                    <input name="profile_name_ta" value={form.profile_name_ta} onChange={handleInput}
                      className="input-field text-xs py-2.5 font-tamil font-bold"
                      placeholder={form.profile_type === 'govt_profile' ? 'எ.கா: மாண்புமிகு இரா. நித்யானந்தன், MLA' : 'உங்கள் பெயர் தமிழில்'} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 font-tamil mb-1.5">
                      {ta ? 'பெயர் ஆங்கிலத்தில் (Name in English) *' : 'Name in English *'}
                    </label>
                    <input name="profile_name_en" value={form.profile_name_en} onChange={handleInput}
                      className="input-field text-xs py-2.5 font-bold"
                      placeholder={form.profile_type === 'govt_profile' ? 'E.g.: Hon. R. Nithyananthan, MLA' : 'Name in English'} required />
                  </div>
                </div>

                {/* 5. Office Address */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 font-tamil mb-1.5">
                      {form.profile_type === 'govt_profile' ? 'அரசு அலுவலக முகவரி (தமிழ்)' : 'கழக அலுவலக முகவரி (தமிழ்)'}
                    </label>
                    <textarea name="address_ta" value={form.address_ta} onChange={handleInput}
                      rows={2} className="input-field text-xs font-tamil"
                      placeholder={form.profile_type === 'govt_profile'
                        ? 'எ.கா: சட்டமன்ற உறுப்பினர் அலுவலகம், ஈரோடு கிழக்கு.'
                        : 'எ.கா: கழக தலைமை அலுவலகம், மேட்டூர் ரோடு, ஈரோடு.'} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 font-tamil mb-1.5">
                      {form.profile_type === 'govt_profile' ? 'அரசு அலுவலக முகவரி (English)' : 'கழக அலுவலக முகவரி (English)'}
                    </label>
                    <textarea name="address_en" value={form.address_en} onChange={handleInput}
                      rows={2} className="input-field text-xs"
                      placeholder={form.profile_type === 'govt_profile'
                        ? 'MLA Office, Master Plan Complex, Erode - 638011.'
                        : 'Party Office, Mettur Road, Erode - 638001.'} />
                  </div>
                </div>

                {/* 6. Contact Details */}
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 font-tamil mb-1.5">
                      {ta ? 'தொலைபேசி எண்' : 'Phone'}
                    </label>
                    <input name="phone" value={form.phone} onChange={handleInput}
                      className="input-field text-xs py-2" placeholder="0424-2223344" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 font-tamil mb-1.5">
                      {ta ? 'அதிகாரப்பூர்வ மின்னஞ்சல்' : 'Official Email'}
                    </label>
                    <input name="email" value={form.email} onChange={handleInput}
                      type="email" className="input-field text-xs py-2" placeholder={form.profile_type === 'govt_profile' ? 'mla.erode@tn.gov.in' : 'office@party.tn'} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 font-tamil mb-1.5">
                      {ta ? 'வலைதளம்' : 'Website'}
                    </label>
                    <input name="website" value={form.website} onChange={handleInput}
                      className="input-field text-xs py-2" placeholder={form.profile_type === 'govt_profile' ? 'www.tn.gov.in' : 'www.party.in'} />
                  </div>
                </div>

                {/* 7. Default Template Layout */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 font-tamil mb-1.5">
                    {ta ? 'இயல்புநிலை மடல் பாணி (Default Letterhead Style)' : 'Default Layout Style'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {LAYOUT_OPTIONS.map(l => (
                      <label key={l.id}
                        className={`p-2.5 border-2 rounded-xl cursor-pointer text-center text-xs font-tamil transition-all flex flex-col items-center gap-1
                          ${form.layout_style === l.id ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold shadow-xs ring-1 ring-blue-600' : 'border-slate-200 hover:border-slate-300'}`}>
                        <input type="radio" name="layout_style" value={l.id}
                          checked={form.layout_style === l.id} onChange={handleInput} className="sr-only" />
                        <span className="text-base">{l.icon}</span>
                        <span className="text-[10px] leading-tight">{l.name_ta}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-3 border-t border-slate-100">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 font-tamil text-xs py-3">
                    {ta ? 'ரத்து செய்' : 'Cancel'}
                  </button>
                  <button type="submit" disabled={formLoading} className="btn-primary flex-1 font-tamil text-xs py-3">
                    {formLoading ? 'உருவாக்குகிறது...' : (ta ? '✨ சுயவிவரம் சேமி' : '✨ Save Profile')}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Profiles;
