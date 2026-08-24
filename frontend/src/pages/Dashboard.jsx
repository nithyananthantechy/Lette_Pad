// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, Plus, ClipboardList, User, TrendingUp, Download, Eye } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

const statusBadge = (status) => {
  const map = {
    draft:     'badge badge-yellow',
    finalized: 'badge badge-green',
    revoked:   'badge badge-red',
  };
  return map[status] || 'badge badge-gray';
};

const statusLabel = (status, ta) => {
  const map = { draft: ta ? 'வரைவு' : 'Draft', finalized: ta ? 'இறுதியாக்கப்பட்டது' : 'Finalized', revoked: ta ? 'திரும்பப்பெறப்பட்டது' : 'Revoked' };
  return map[status] || status;
};

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const { user, refreshUser } = useAuth();
  const ta = i18n.language === 'ta';

  const [letters, setLetters]   = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [subInfo, setSubInfo]   = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (refreshUser) refreshUser();
    const load = async () => {
      try {
        const [lRes, pRes, sRes] = await Promise.all([
          api.get('/letters?limit=5'),
          api.get('/profiles'),
          api.get('/subscription/status').catch(() => ({ data: null })),
        ]);
        setLetters(lRes.data.letters || []);
        setProfiles(pRes.data.profiles || []);
        if (sRes.data?.subscription) setSubInfo(sRes.data.subscription);
      } catch { toast.error(ta ? 'தரவு ஏற்றுவதில் பிழை' : 'Failed to load data'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const stats = [
    { label: ta ? 'மொத்த கடிதங்கள்' : 'Total Letters', value: letters.length, color: 'bg-blue-50 text-blue-700', icon: <FileText size={24} /> },
    { label: ta ? 'வரைவுகள்' : 'Drafts',         value: letters.filter(l => l.status === 'draft').length,     color: 'bg-yellow-50 text-yellow-700', icon: <ClipboardList size={24} /> },
    { label: ta ? 'இறுதியாக்கப்பட்டவை' : 'Finalized', value: letters.filter(l => l.status === 'finalized').length, color: 'bg-green-50 text-green-700', icon: <TrendingUp size={24} /> },
  ];

  const exportPDF = async (id, docId) => {
    try {
      const res = await api.post(`/letters/${id}/export-pdf`);
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
        }
      }
    } catch {
      toast.error(ta ? 'PDF பதிவிறக்கம் தோல்வி' : 'PDF export failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-tamil">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Subscription Expired Alert */}
        {subInfo?.is_expired && (
          <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white p-4 rounded-2xl shadow-md mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔒</span>
              <div className="text-xs">
                <div className="font-bold text-sm">
                  {ta ? 'உங்கள் 7 நாள் இலவச சோதனைக் காலம் முடிவடைந்தது' : 'Your 7-Day Free Trial Has Expired'}
                </div>
                <div className="text-red-100 mt-0.5">
                  {ta ? 'கடிதங்கள் தயாரிக்க மற்றும் முழுமையான சேவையைப் பெற சந்தாவை புதுப்பிக்கவும்.' : 'Please subscribe to continue drafting and printing official letters.'}
                </div>
              </div>
            </div>
            <Link to="/subscription" className="px-4 py-2 bg-white text-red-700 font-bold rounded-xl text-xs shadow-sm hover:bg-red-50 flex-shrink-0 transition-colors">
              {ta ? 'Google Pay மூலம் புதுப்பி →' : 'Renew with Google Pay →'}
            </Link>
          </div>
        )}

        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-[#1a1a2e] to-[#0f3460] rounded-3xl p-8 text-white mb-8 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-tamil">
                🙏 {ta ? 'வரவேற்கிறோம்' : 'Welcome'}, {user?.full_name}!
              </h1>
              <p className="text-blue-200 font-tamil mt-1 text-sm">
                {ta ? 'உங்கள் AI மடல் தளத்திற்கு வரவேற்கிறோம்' : 'Your AI Letter Pad Platform'}
              </p>
              
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  {user?.role.replace('_', ' ')}
                </div>

                {subInfo && (
                  <Link
                    to="/subscription"
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all border
                      ${subInfo.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                        : subInfo.is_expired
                          ? 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30'
                          : 'bg-amber-400/20 text-amber-300 border-amber-400/40 hover:bg-amber-400/30'}`}
                  >
                    <span>{subInfo.status === 'active' ? '👑' : '✨'}</span>
                    <span>
                      {subInfo.status === 'active'
                        ? (ta ? `செயலில் உள்ள சந்தா (${subInfo.days_remaining} நாட்கள்)` : `Active (${subInfo.days_remaining} days)`)
                        : subInfo.is_expired
                          ? (ta ? 'சந்தா தேவை' : 'Subscription Required')
                          : (ta ? `7 நாள் சோதனை: இன்னும் ${subInfo.days_remaining} நாட்கள்` : `7-Day Trial: ${subInfo.days_remaining} days left`)}
                    </span>
                  </Link>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {user?.role === 'super_admin' && (
                <Link to="/admin"
                  className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 px-4 py-3 rounded-xl font-bold font-tamil transition-colors text-sm shadow-lg">
                  <span>👑</span> {ta ? 'முதன்மை நிர்வாகம்' : 'Admin Panel'}
                </Link>
              )}
              <Link to="/letters/new"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-5 py-3 rounded-xl font-semibold font-tamil transition-colors text-sm shadow-lg">
                <Plus size={18} /> {ta ? 'புதிய கடிதம்' : 'New Letter'}
              </Link>
              <Link to="/subscription"
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-3 rounded-xl font-semibold font-tamil transition-colors text-sm border border-white/20">
                <span>💳</span> {ta ? 'கட்டணம்' : 'Billing'}
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {stats.map((s, i) => (
            <div key={i} className={`card p-6 flex items-center gap-4 ${s.color}`}>
              <div className="p-3 bg-white/60 rounded-xl">{s.icon}</div>
              <div>
                <div className="text-3xl font-bold">{loading ? '...' : s.value}</div>
                <div className="text-sm font-tamil mt-0.5">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Letters */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold font-tamil text-gray-900">
                  📄 {ta ? 'சமீபத்திய கடிதங்கள்' : 'Recent Letters'}
                </h2>
                <Link to="/letters" className="text-sm text-blue-600 hover:underline font-tamil">
                  {ta ? 'அனைத்தும் பாருங்கள்' : 'View all'}
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="p-4 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                    </div>
                  ))
                ) : letters.length === 0 ? (
                  <div className="p-12 text-center">
                    <FileText size={40} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400 font-tamil">{ta ? 'இன்னும் கடிதங்கள் இல்லை' : 'No letters yet'}</p>
                    <Link to="/letters/new" className="text-blue-600 text-sm font-tamil hover:underline mt-2 inline-block">
                      {ta ? 'முதல் கடிதம் உருவாக்கு →' : 'Create your first letter →'}
                    </Link>
                  </div>
                ) : letters.map(letter => (
                  <div key={letter.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm text-gray-900 font-tamil truncate">
                        {letter.subject_ta || letter.subject_en || (ta ? 'தலைப்பு இல்லை' : 'No subject')}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 font-mono">{letter.document_id}</div>
                    </div>
                    <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                      <span className={statusBadge(letter.status)}>{statusLabel(letter.status, ta)}</span>
                      {letter.status === 'finalized' && (
                        <button onClick={() => exportPDF(letter.id, letter.document_id)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors" title="Download PDF">
                          <Download size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* My Profiles */}
          <div>
            <div className="card">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold font-tamil text-gray-900">
                  🪪 {ta ? 'என் சுயவிவரங்கள்' : 'My Profiles'}
                </h2>
                <Link to="/profiles" className="text-sm text-blue-600 hover:underline font-tamil">
                  {ta ? 'நிர்வகி' : 'Manage'}
                </Link>
              </div>
              <div className="p-4 space-y-3">
                {loading ? (
                  [...Array(2)].map((_, i) => (
                    <div key={i} className="p-3 animate-pulse rounded-xl bg-gray-50">
                      <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                      <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                    </div>
                  ))
                ) : profiles.length === 0 ? (
                  <div className="text-center py-8">
                    <User size={32} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm font-tamil">{ta ? 'சுயவிவரம் இல்லை' : 'No profiles yet'}</p>
                    <Link to="/profiles" className="text-blue-600 text-sm font-tamil hover:underline mt-1 inline-block">
                      {ta ? 'உருவாக்கு →' : 'Create one →'}
                    </Link>
                  </div>
                ) : profiles.slice(0, 4).map(profile => (
                  <div key={profile.id}
                    className="p-3 rounded-xl border-2 transition-all hover:shadow-sm cursor-pointer"
                    style={{ borderColor: (profile.primary_color || '#1a1a2e') + '33', background: (profile.primary_color || '#1a1a2e') + '08' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: profile.primary_color || '#1a1a2e' }}>
                        {(profile.abbreviation || profile.profile_name_en || '?').substring(0, 3)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm font-tamil truncate">{profile.profile_name_ta || profile.profile_name_en}</div>
                        <div className="text-xs text-gray-500 font-tamil truncate">{profile.party_role || profile.designation_en}</div>
                      </div>
                    </div>
                  </div>
                ))}
                <Link to="/profiles"
                  className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors text-sm font-tamil">
                  <Plus size={16} /> {ta ? 'புதிய சுயவிவரம்' : 'New Profile'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
