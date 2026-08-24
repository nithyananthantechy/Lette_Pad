// src/pages/Admin.jsx — Master Super Admin Control Center & Payment Approval Hub
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert, Users, CreditCard, CheckCircle2, XCircle,
  Building2, FileText, Search, RefreshCw, Sparkles, Clock,
  Calendar, Check, Shield, Award, AlertCircle
} from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../lib/api';
import toast from 'react-hot-toast';

const Admin = () => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const ta = i18n.language === 'ta';

  const [activeTab, setActiveTab]   = useState('overview'); // 'overview' | 'users' | 'payments' | 'profiles'
  const [stats, setStats]           = useState(null);
  const [usersList, setUsersList]   = useState([]);
  const [payments, setPayments]     = useState([]);
  const [profiles, setProfiles]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [searchUser, setSearchUser] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [stRes, uRes, pRes, profRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/subscriptions'),
        api.get('/admin/profiles'),
      ]);
      setStats(stRes.data.stats || {});
      setUsersList(uRes.data.users || []);
      setPayments(pRes.data.subscriptions || []);
      setProfiles(profRes.data.profiles || []);
    } catch (err) {
      toast.error(ta ? 'நிர்வாகத் தரவு ஏற்றுவதில் பிழை' : 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  // Update User Role
  const handleChangeRole = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      toast.success(ta ? 'பயனர் பொறுப்பு மாற்றப்பட்டது!' : 'User role updated!');
      loadAll();
    } catch {
      toast.error(ta ? 'பொறுப்பு மாற்றம் தோல்வி' : 'Role change failed');
    }
  };

  // Toggle User Status (Active/Suspended)
  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await api.put(`/admin/users/${userId}/status`, { is_active: !currentStatus });
      toast.success(ta ? 'பயனர் நிலை புதுப்பிக்கப்பட்டது!' : 'User status updated!');
      loadAll();
    } catch {
      toast.error(ta ? 'செயல்பாடு தோல்வி' : 'Operation failed');
    }
  };

  // Approve Payment
  const handleApprovePayment = async (subId, days = 30) => {
    setActionLoading(true);
    try {
      const res = await api.put(`/admin/subscriptions/${subId}/approve`, { daysToAdd: days });
      toast.success(res.data?.message || (ta ? '✅ கட்டணம் ஒப்புதல் அளிக்கப்பட்டது!' : 'Payment approved!'));
      loadAll();
    } catch {
      toast.error(ta ? 'ஒப்புதல் தோல்வி' : 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = usersList.filter(u =>
    (u.full_name || '').toLowerCase().includes(searchUser.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchUser.toLowerCase()) ||
    (u.phone || '').includes(searchUser)
  );

  return (
    <div className="min-h-screen bg-slate-50 font-tamil pb-16">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Master Header */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center text-3xl shadow-inner flex-shrink-0">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold font-tamil">
                  {ta ? 'முதன்மை நிர்வாக கட்டுப்பாட்டு மையம்' : 'Master Super Admin Control Panel'}
                </h1>
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                  SUPER ADMIN
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-1">
                {ta
                  ? 'கட்டண ஒப்புதல்கள், கட்சிகள், சட்டமன்றத் தொகுதி சுயவிவரங்கள் மற்றும் பயனர் கணக்கு மேலாண்மை'
                  : 'Complete platform governance, payment approvals, and party letterhead oversight'}
              </p>
            </div>
          </div>

          <button
            onClick={loadAll}
            disabled={loading}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors self-start md:self-auto"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>{ta ? 'புதுப்பி' : 'Refresh'}</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs max-w-2xl">
          {[
            { id: 'overview', label: ta ? '📊 கண்ணோட்டம்' : 'Overview', count: null },
            { id: 'payments', label: ta ? '💳 கட்டண ஒப்புதல்கள்' : 'Payments', count: payments.filter(p => p.status === 'pending_approval').length },
            { id: 'users',    label: ta ? '👥 பயனர்கள்' : 'Users', count: usersList.length },
            { id: 'profiles', label: ta ? '🏛️ மடல் சுயவிவரங்கள்' : 'Profiles', count: profiles.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all
                ${activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold
                  ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW METRICS */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                <div className="text-xs font-bold text-slate-500 uppercase">{ta ? 'மொத்த பயனர்கள்' : 'Total Users'}</div>
                <div className="text-3xl font-extrabold text-blue-600 mt-2">{stats?.users?.total_users || 0}</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {stats?.users?.active_subscribers || 0} {ta ? 'செயலில் உள்ள சந்தாதாரர்கள்' : 'active paid subscribers'}
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                <div className="text-xs font-bold text-slate-500 uppercase">{ta ? 'மொத்த வருவாய் (UPI)' : 'Total Revenue'}</div>
                <div className="text-3xl font-extrabold text-emerald-600 mt-2">
                  ₹{Number(stats?.subscriptions?.total_revenue || 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">{stats?.subscriptions?.total_payments || 0} {ta ? 'பரிவர்த்தனைகள்' : 'transactions'}</div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                <div className="text-xs font-bold text-slate-500 uppercase">{ta ? 'தயாரான கடிதங்கள்' : 'Total Letters'}</div>
                <div className="text-3xl font-extrabold text-indigo-600 mt-2">{stats?.letters?.total_letters || 0}</div>
                <div className="text-[11px] text-slate-400 mt-1">{stats?.letters?.finalized_letters || 0} {ta ? 'இறுதியாக்கப்பட்டவை' : 'finalized'}</div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                <div className="text-xs font-bold text-slate-500 uppercase">{ta ? 'கட்சி / அரசு சுயவிவரங்கள்' : 'Letterhead Profiles'}</div>
                <div className="text-3xl font-extrabold text-amber-600 mt-2">{stats?.profiles?.total_profiles || 0}</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {stats?.profiles?.party_profiles || 0} {ta ? 'கட்சி' : 'Party'} &bull; {stats?.profiles?.govt_profiles || 0} {ta ? 'அரசு' : 'Govt'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PAYMENTS & APPROVALS */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {ta ? 'Google Pay UPI கட்டணப் பதிவுகள் & ஒப்புதல்கள்' : 'Google Pay UPI Payment Approvals'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  பயனர்கள் செலுத்திய கட்டணம் மற்றும் UTR எண்களை சரிபார்த்து சந்தாவை நீட்டிக்கவும்
                </p>
              </div>
            </div>

            {payments.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs font-tamil">
                கட்டணப் பதிவுகள் எதுவும் இல்லை
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-tamil">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="p-4 font-bold">பயனர் பெயர் & விவரம்</th>
                      <th className="p-4 font-bold">திட்டம்</th>
                      <th className="p-4 font-bold">தொகை</th>
                      <th className="p-4 font-bold">UTR / Ref எண்</th>
                      <th className="p-4 font-bold">நிலை</th>
                      <th className="p-4 font-bold">தேதி</th>
                      <th className="p-4 font-bold text-right">நிர்வாக நடவடிக்கை</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {payments.map(sub => (
                      <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{sub.user_name || 'User'}</div>
                          <div className="text-[10px] text-slate-400">{sub.user_email}</div>
                          {sub.user_phone && <div className="text-[10px] text-slate-500 font-mono">📞 {sub.user_phone}</div>}
                        </td>
                        <td className="p-4 font-semibold uppercase">{sub.plan_id}</td>
                        <td className="p-4 font-bold text-emerald-600">₹{Number(sub.amount).toLocaleString()}</td>
                        <td className="p-4 font-mono font-bold text-slate-900 bg-slate-50 rounded-lg">{sub.upi_ref_no}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase
                            ${sub.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="p-4 text-[11px] text-slate-500">
                          {new Date(sub.created_at).toLocaleDateString('ta-IN')}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleApprovePayment(sub.id, 30)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-2xs"
                            >
                              +30 நாள் நீட்டிப்பு
                            </button>
                            <button
                              onClick={() => handleApprovePayment(sub.id, 365)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-2xs"
                            >
                              1 ஆண்டு (Year)
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: USERS & ROLE MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {ta ? 'அனைத்து பயனர்கள் & பொறுப்பு மேலாண்மை' : 'Users & Role Management'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  பயனர்களின் பொறுப்புகளை மாற்றவும் (Super Admin, Party Admin, Official)
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchUser}
                  onChange={e => setSearchUser(e.target.value)}
                  placeholder="பெயர் அல்லது மின்னஞ்சல்..."
                  className="input-field pl-9 text-xs py-2"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-tamil">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-4 font-bold">பயனர்</th>
                    <th className="p-4 font-bold">மின்னஞ்சல் & தொலைபேசி</th>
                    <th className="p-4 font-bold">பயனர் பொறுப்பு (Role)</th>
                    <th className="p-4 font-bold">சந்தா நிலை</th>
                    <th className="p-4 font-bold">பதிவு தேதி</th>
                    <th className="p-4 font-bold text-right">செயல்பாடு</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{u.full_name}</div>
                        <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-full
                          ${u.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                          {u.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-mono text-slate-900">{u.email}</div>
                        <div className="text-[10px] text-slate-500">{u.phone}</div>
                      </td>
                      <td className="p-4">
                        <select
                          value={u.role}
                          onChange={e => handleChangeRole(u.id, e.target.value)}
                          className="bg-slate-100 border border-slate-300 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="super_admin">👑 Master Super Admin</option>
                          <option value="party_admin">🏛️ கழக மாவட்ட நிர்வாகி</option>
                          <option value="party_member">👤 கழக உறுப்பினர்</option>
                          <option value="govt_official">🏛️ அரசு அலுவலர் / MLA</option>
                          <option value="govt_staff">📋 அலுவலகப் பணியாளர்</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase
                          ${u.subscription_status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                          {u.subscription_status || 'trial'}
                        </span>
                      </td>
                      <td className="p-4 text-[11px] text-slate-500">
                        {new Date(u.created_at).toLocaleDateString('ta-IN')}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleToggleStatus(u.id, u.is_active)}
                          className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-colors
                            ${u.is_active ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                        >
                          {u.is_active ? 'முடக்கு (Suspend)' : 'செயல்படுத்து (Activate)'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: PARTY LETTERHEAD PROFILES */}
        {activeTab === 'profiles' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                {ta ? 'அனைத்து கட்சி & அரசு மடல் வார்ப்புருக்கள்' : 'All Party & Government Letterhead Profiles'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                தமிழ்நாடு முழுவதும் பதிவுசெய்யப்பட்டுள்ள அனைத்து லெட்டர்பேட் சுயவிவரங்கள்
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-tamil">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-4 font-bold">கட்சி / அரசு அமைப்பு</th>
                    <th className="p-4 font-bold">சுயவிவரப் பெயர்</th>
                    <th className="p-4 font-bold">பொறுப்பு / பதவி</th>
                    <th className="p-4 font-bold">தொகுதி / மாவட்டம்</th>
                    <th className="p-4 font-bold">உரிமையாளர் (பயனர்)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {profiles.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg text-white font-bold text-xs flex items-center justify-center flex-shrink-0"
                            style={{ background: p.primary_color || '#2563eb' }}>
                            {p.profile_type === 'govt_profile' ? '🏛️' : (p.abbreviation || 'TN')}
                          </div>
                          <div>
                            <div className="font-bold">{p.party_name_ta || 'தமிழ்நாடு அரசு / சட்டமன்றம்'}</div>
                            <div className="text-[10px] text-slate-400">{p.profile_type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-slate-900">{p.profile_name_ta || p.profile_name_en}</td>
                      <td className="p-4 text-blue-600 font-semibold">{p.party_role || p.designation_ta || 'பொறுப்பாளர்'}</td>
                      <td className="p-4">{p.constituency || 'பொதுவானது'}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{p.user_name}</div>
                        <div className="text-[10px] text-slate-400">{p.user_email}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Admin;
