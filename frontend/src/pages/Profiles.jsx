// src/pages/Profiles.jsx — Enterprise Letterhead Profiles Manager
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, X, User, Trash2, ShieldCheck, MapPin, Building, Sparkles, Lock } from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../lib/api';
import toast from 'react-hot-toast';

const LAYOUT_OPTIONS = [
  { id: 'classic',       name_ta: 'கழக பிரம்மாண்டம் (Party High-Impact)',   icon: '🏳️' },
  { id: 'mla_govt',      name_ta: 'சட்டமன்ற உறுப்பினர் / அரசு நடை (MLA Style)', icon: '🏛️' },
  { id: 'press_release', name_ta: 'பத்திரிகை செய்தி அறிக்கை (Press Release)', icon: '📢' },
  { id: 'minimal',       name_ta: 'நிர்வாக சுருக்கம் (Executive Minimal)',    icon: '📄' },
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
  'ஈரோடு நாடாளுமன்றத் தொகுதி (Erode Lok Sabha MP)',
  'சென்னை - எழும்பூர் (Egmore)',
  'கோயம்புத்தூர் தெற்கு (Coimbatore South)',
  'மதுரை மத்திய (Madurai Central)',
  'திருச்சி கிழக்கு (Trichy East)',
  'சேலம் வடக்கு (Salem North)',
];

const COMMON_DESIGNATIONS = [
  'சட்டமன்ற உறுப்பினர் (MLA)',
  'நாடாளுமன்ற உறுப்பினர் (MP)',
  'மாவட்ட கழகச் செயலாளர்',
  'மாவட்ட இளைஞரணி செயலாளர்',
  'ஒன்றிய செயலாளர்',
  'நகர கழகச் செயலாளர்',
  'மாநில பொதுக்குழு உறுப்பினர்',
  'தலைமை செயற்குழு உறுப்பினர்',
  'மகளிர் அணி செயலாளர்',
  'வழக்கறிஞர் அணி செயலாளர்',
  'மாவட்ட ஆட்சியர் (District Collector)',
];

const Profiles = () => {
  const { i18n } = useTranslation();
  const ta = i18n.language === 'ta';

  const [profiles, setProfiles]   = useState([]);
  const [parties, setParties]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const [form, setForm] = useState({
    profile_type: 'party_profile',
    party_id: '',
    party_role: 'மாவட்ட கழகச் செயலாளர்',
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
  });

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

  const submit = async (e) => {
    e.preventDefault();
    if (!form.profile_name_en.trim()) {
      return toast.error(ta ? 'ஆங்கிலத்தில் பெயர் தேவை' : 'English name required');
    }
    setFormLoading(true);
    try {
      await api.post('/profiles', form);
      toast.success(ta ? '✅ புதிய மடல் சுயவிவரம் உருவாக்கப்பட்டது!' : '✅ Letterhead profile created!');
      setShowModal(false);
      setForm({
        profile_type: 'party_profile',
        party_id: '',
        party_role: 'மாவட்ட கழகச் செயலாளர்',
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
      });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || (ta ? 'உருவாக்கம் தோல்வி' : 'Creation failed'));
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
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Security & Data Isolation Notice */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white mb-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="font-bold text-sm font-tamil text-white flex items-center gap-2">
                <span>கட்சித் தரவு தனிமைப்படுத்தல் உத்தரவாதம் (Tenant Data Isolation)</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30">
                  100% Encrypted
                </span>
              </div>
              <p className="text-xs text-slate-400 font-tamil mt-0.5">
                உங்கள் கட்சி (TVK, DMK, AIADMK, etc.) மற்றும் அரசு அலுவலர் சுயவிவரத் தரவுகளை பிறர் அணுக இயலாது. முழுமையான தனிப்பாதுகாப்பு உறுதி செய்யப்பட்டுள்ளது.
              </p>
            </div>
          </div>
          <button onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2 font-tamil text-xs py-2.5 px-4 flex-shrink-0 shadow-lg">
            <Plus size={16} /> {ta ? 'புதிய சுயவிவரம் சேர்' : 'New Profile'}
          </button>
        </div>

        {/* Profiles Grid */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold font-tamil text-slate-900">
              🪪 {ta ? 'பதிவு செய்யப்பட்ட மடல் சுயவிவரங்கள்' : 'Registered Letterhead Profiles'}
            </h1>
            <p className="text-slate-500 font-tamil text-xs mt-0.5">
              {profiles.length} {ta ? 'சுயவிவரங்கள் செயலில் உள்ளன' : 'profiles active'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-xl mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 text-2xl">
              🏛️
            </div>
            <h3 className="text-lg font-bold text-slate-800 font-tamil mb-2">
              {ta ? 'சுயவிவரங்கள் ஏதும் இல்லை' : 'No profiles created yet'}
            </h3>
            <p className="text-xs text-slate-500 font-tamil mb-6 leading-relaxed">
              {ta ? 'உங்கள் கட்சிப் பதவி, தொகுதி (எ.கா: ஈரோடு கிழக்கு) அல்லது அரசுப் பதவிக்கான முதல் மடல் சுயவிவரத்தை உருவாக்குங்கள்.'
                  : 'Create your first profile for party roles, constituencies (e.g. Erode East) or government offices.'}
            </p>
            <button onClick={() => setShowModal(true)} className="btn-primary font-tamil text-xs py-3 px-6">
              <Plus size={16} className="inline mr-1.5" /> {ta ? 'முதல் சுயவிவரம் உருவாக்கு' : 'Create First Profile'}
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map(profile => (
              <div key={profile.id}
                className="bg-white rounded-2xl p-6 border-2 transition-all hover:shadow-lg flex flex-col justify-between"
                style={{ borderColor: (profile.primary_color || '#0f172a') + '33' }}
              >
                <div>
                  <div className="flex items-start gap-3.5 mb-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-sm"
                      style={{ background: profile.primary_color || '#0f172a' }}>
                      {(profile.abbreviation || 'TN').substring(0, 3)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold font-tamil text-slate-900 text-sm truncate">
                        {profile.profile_name_ta || profile.profile_name_en}
                      </div>
                      <div className="text-xs text-blue-600 font-bold font-tamil truncate">
                        {profile.party_role || profile.designation_en || 'பொறுப்பாளர்'}
                      </div>
                      {profile.party_name_ta && (
                        <div className="text-[11px] text-slate-500 font-tamil truncate mt-0.5">
                          {profile.party_name_ta}
                        </div>
                      )}
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
                  <button onClick={() => deactivate(profile.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title={ta ? 'முடக்கு / நீக்கு' : 'Deactivate'}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CREATE MODAL */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200">
              
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-t-3xl flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold font-tamil flex items-center gap-2">
                    <Sparkles size={18} className="text-amber-400" />
                    {ta ? 'புதிய மடல் சுயவிவரம் உருவாக்குதல்' : 'Create Letterhead Profile'}
                  </h2>
                  <p className="text-xs text-indigo-300 font-tamil mt-0.5">
                    ஈரோடு மற்றும் அனைத்து தமிழ்நாடு அரசியல்/அரசு அமைப்புகள்
                  </p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={submit} className="p-6 space-y-4">
                
                {/* Profile Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 font-tamil mb-1.5">
                    {ta ? 'சுயவிவர வகை' : 'Profile Type'}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { val: 'party_profile', label: ta ? '🏳️ அரசியல் கட்சிப் பொறுப்பாளர்' : '🏳️ Political Party Role' },
                      { val: 'govt_profile',  label: ta ? '🏛️ அரசு பிரதிநிதி / அலுவலர்' : '🏛️ Government Official' },
                    ].map(opt => (
                      <label key={opt.val}
                        className={`p-3 border-2 rounded-xl cursor-pointer transition-all font-tamil text-xs text-center
                          ${form.profile_type === opt.val ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold' : 'border-slate-200 hover:border-slate-300'}`}>
                        <input type="radio" name="profile_type" value={opt.val}
                          checked={form.profile_type === opt.val}
                          onChange={handleInput} className="sr-only" />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Party Selector */}
                {form.profile_type === 'party_profile' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 font-tamil mb-1.5">
                      {ta ? 'அரசியல் கட்சி தேர்வு (Party Selection)' : 'Select Political Party'}
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

                {/* Constituency & Role */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 font-tamil mb-1.5">
                      {ta ? 'தொகுதி (Constituency)' : 'Constituency'}
                    </label>
                    <select name="constituency" value={form.constituency} onChange={handleInput} className="input-field text-xs py-2.5">
                      {ERODE_CONSTITUENCIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 font-tamil mb-1.5">
                      {ta ? 'பொறுப்பு / பதவி (Role / Designation)' : 'Role / Designation'}
                    </label>
                    <input
                      name="party_role"
                      value={form.party_role}
                      onChange={handleInput}
                      className="input-field text-xs py-2.5 font-tamil font-semibold"
                      placeholder="எ.கா: மாவட்ட கழகச் செயலாளர்"
                    />
                  </div>
                </div>

                {/* Name */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 font-tamil mb-1.5">
                      {ta ? 'பெயர் தமிழில் (Name in Tamil)' : 'Name in Tamil'}
                    </label>
                    <input name="profile_name_ta" value={form.profile_name_ta} onChange={handleInput}
                      className="input-field text-xs py-2.5 font-tamil font-bold" placeholder="உங்கள் பெயர் தமிழில்" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 font-tamil mb-1.5">
                      {ta ? 'பெயர் ஆங்கிலத்தில் (Name in English) *' : 'Name in English *'}
                    </label>
                    <input name="profile_name_en" value={form.profile_name_en} onChange={handleInput}
                      className="input-field text-xs py-2.5 font-bold" placeholder="Name in English" required />
                  </div>
                </div>

                {/* Address */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 font-tamil mb-1.5">
                      {ta ? 'அலுவலக முகவரி (தமிழ்)' : 'Office Address (Tamil)'}
                    </label>
                    <textarea name="address_ta" value={form.address_ta} onChange={handleInput}
                      rows={2} className="input-field text-xs font-tamil"
                      placeholder="எ.கா: கழக தலைமை அலுவலகம், மேட்டூர் ரோடு, ஈரோடு." />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 font-tamil mb-1.5">
                      {ta ? 'அலுவலக முகவரி (English)' : 'Office Address (English)'}
                    </label>
                    <textarea name="address_en" value={form.address_en} onChange={handleInput}
                      rows={2} className="input-field text-xs"
                      placeholder="Party Office, Mettur Road, Erode - 638001." />
                  </div>
                </div>

                {/* Contacts */}
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 font-tamil mb-1.5">
                      {ta ? 'தொலைபேசி எண்' : 'Phone'}
                    </label>
                    <input name="phone" value={form.phone} onChange={handleInput}
                      className="input-field text-xs py-2" placeholder="9876543210" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 font-tamil mb-1.5">
                      {ta ? 'மின்னஞ்சல்' : 'Email'}
                    </label>
                    <input name="email" value={form.email} onChange={handleInput}
                      type="email" className="input-field text-xs py-2" placeholder="office@party.tn" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 font-tamil mb-1.5">
                      {ta ? 'வலைதளம்' : 'Website'}
                    </label>
                    <input name="website" value={form.website} onChange={handleInput}
                      className="input-field text-xs py-2" placeholder="www.party.in" />
                  </div>
                </div>

                {/* Layout Style */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 font-tamil mb-1.5">
                    {ta ? 'இயல்புநிலை மடல் பாணி (Default Template Layout)' : 'Default Layout Style'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {LAYOUT_OPTIONS.map(l => (
                      <label key={l.id}
                        className={`p-2.5 border-2 rounded-xl cursor-pointer text-center text-xs font-tamil transition-all flex flex-col items-center gap-1
                          ${form.layout_style === l.id ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold' : 'border-slate-200 hover:border-slate-300'}`}>
                        <input type="radio" name="layout_style" value={l.id}
                          checked={form.layout_style === l.id} onChange={handleInput} className="sr-only" />
                        <span>{l.icon}</span>
                        <span className="text-[10px] leading-tight">{l.name_ta}</span>
                      </label>
                    ))}
                  </div>
                </div>

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
