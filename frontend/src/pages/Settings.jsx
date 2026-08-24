// src/pages/Settings.jsx — User Account Settings, Photo & Password Management
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  User, Lock, Camera, ShieldCheck, Mail, Phone,
  Save, KeyRound, CheckCircle2, AlertCircle, RefreshCw,
  Sparkles
} from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../lib/api';
import toast from 'react-hot-toast';

const Settings = () => {
  const { i18n } = useTranslation();
  const { user, login } = useAuth();
  const ta = i18n.language === 'ta';

  // Profile info state
  const [fullName, setFullName]   = useState(user?.full_name || '');
  const [phone, setPhone]         = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  // Sync user details on load
  useEffect(() => {
    api.get('/auth/me').then(res => {
      if (res.data?.user) {
        const u = res.data.user;
        setFullName(u.full_name || '');
        setPhone(u.phone || '');
        setAvatarUrl(u.avatar_url || '');
      }
    }).catch(() => {});
  }, []);

  // Handle Photo Upload (Base64)
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      return toast.error(ta ? 'புகைப்படம் 3MB-க்கு குறைவாக இருக்க வேண்டும்' : 'Photo must be under 3MB');
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUrl(reader.result);
      toast.success(ta ? '📸 புகைப்படம் தேர்ந்தெடுக்கப்பட்டது! (சேமிக்கவும்)' : '📸 Photo selected! Click save to apply.');
    };
    reader.readAsDataURL(file);
  };

  // Save Profile Details
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) return toast.error(ta ? 'முழு பெயர் தேவை' : 'Full name is required');
    setSavingProfile(true);
    try {
      const res = await api.put('/auth/profile', {
        full_name: fullName,
        phone,
        avatar_url: avatarUrl,
      });
      toast.success(ta ? '✅ சுயவிவரம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது!' : '✅ Profile updated successfully!');
      // Update local storage auth user
      const stored = JSON.parse(localStorage.getItem('auth') || '{}');
      if (stored.user) {
        stored.user = { ...stored.user, ...res.data.user };
        localStorage.setItem('auth', JSON.stringify(stored));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || (ta ? 'புதுப்பித்தல் தோல்வி' : 'Update failed'));
    } finally {
      setSavingProfile(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPw || !newPw) return toast.error(ta ? 'அனைத்து விவரங்களையும் நிரப்பவும்' : 'Fill all fields');
    if (newPw.length < 8) return toast.error(ta ? 'புதிய கடவுச்சொல் குறைந்தபட்சம் 8 எழுத்துக்கள் இருக்க வேண்டும்' : 'Password must be 8+ chars');
    if (newPw !== confirmPw) return toast.error(ta ? 'புதிய கடவுச்சொல் பொருந்தவில்லை' : 'Passwords do not match');

    setChangingPw(true);
    try {
      const res = await api.post('/auth/change-password', {
        currentPassword: currentPw,
        newPassword: newPw,
      });
      toast.success(res.data.message || (ta ? '✅ கடவுச்சொல் மாற்றப்பட்டது!' : 'Password changed!'));
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (err) {
      toast.error(err.response?.data?.message || (ta ? 'கடவுச்சொல் மாற்றம் தோல்வி' : 'Failed to change password'));
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-tamil pb-16">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Header Bar */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <User className="text-blue-600" />
            <span>{ta ? 'பயனர் கணக்கு & பாதுகாப்பு அமைப்புகள்' : 'Account & Security Settings'}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            உங்கள் தனிப்பட்ட சுயவிவரம், அதிகாரப்பூர்வ புகைப்படம் மற்றும் கடவுச்சொல் மேலாண்மை
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          
          {/* LEFT: User Profile Photo & Info Card */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs text-center flex flex-col items-center">
              
              {/* Photo Avatar Preview */}
              <div className="relative group mb-4">
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-slate-100 shadow-md bg-slate-900 flex items-center justify-center text-white">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-extrabold text-white">
                      {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
                    </span>
                  )}
                </div>

                {/* Upload Button Overlay */}
                <label className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full cursor-pointer shadow-lg transition-transform hover:scale-105">
                  <Camera size={16} />
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              </div>

              <h3 className="text-base font-bold text-slate-900 truncate max-w-full">
                {fullName || 'பயனர்'}
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5 truncate max-w-full">
                {user?.email}
              </p>

              <div className="mt-3 inline-block px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold rounded-full">
                {user?.role === 'party_admin' ? '🏛️ கழக நிர்வாகி' : user?.role === 'govt_official' ? '🏛️ அரசு அலுவலர்' : '👤 உறுப்பினர்'}
              </div>

              <div className="w-full mt-6 pt-4 border-t border-slate-100 text-left text-xs space-y-2 text-slate-600">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>2-படி OTP சரிபார்ப்பு இயக்கப்பட்டது</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-blue-600" />
                  <span>அங்கீகரிக்கப்பட்ட கணக்கு</span>
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT: Forms Column */}
          <div className="md:col-span-2 space-y-6">
            
            {/* 1. Edit Profile Form */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <User size={18} className="text-blue-600" />
                <span>{ta ? 'சுயவிவர விவரங்கள் திருத்து' : 'Edit Profile Information'}</span>
              </h2>

              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {ta ? 'முழு பெயர் (Full Name) *' : 'Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="எ.கா: நித்யானந்தன் நாகராஜன்"
                    className="input-field text-xs py-2.5 font-tamil"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Mail size={12} className="text-slate-400" />
                    <span>{ta ? 'மின்னஞ்சல் முகவரி (Email)' : 'Email Address'}</span>
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="input-field text-xs py-2.5 bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">பாதுகாப்பு கருதி மின்னஞ்சலை மாற்ற முடியாது.</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Phone size={12} className="text-slate-400" />
                    <span>{ta ? 'தொலைபேசி எண் (Phone Number)' : 'Phone Number'}</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="எ.கா: 9876543210"
                    className="input-field text-xs py-2.5"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="btn-primary text-xs py-2.5 px-6 flex items-center gap-1.5 shadow-sm"
                  >
                    {savingProfile ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                    <span>{ta ? 'விவரங்களைச் சேமி' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* 2. Change Password Form */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <KeyRound size={18} className="text-amber-500" />
                <span>{ta ? 'கடவுச்சொல் மாற்றம் (Change Password)' : 'Change Password'}</span>
              </h2>

              <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {ta ? 'தற்போதைய கடவுச்சொல் (Current Password) *' : 'Current Password *'}
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPw}
                    onChange={e => setCurrentPw(e.target.value)}
                    placeholder="••••••••"
                    className="input-field text-xs py-2.5"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {ta ? 'புதிய கடவுச்சொல் (New Password) *' : 'New Password *'}
                    </label>
                    <input
                      type="password"
                      required
                      value={newPw}
                      onChange={e => setNewPw(e.target.value)}
                      placeholder="குறைந்தது 8 எழுத்துக்கள்"
                      className="input-field text-xs py-2.5"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {ta ? 'மீண்டும் கடவுச்சொல் (Confirm Password) *' : 'Confirm Password *'}
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPw}
                      onChange={e => setConfirmPw(e.target.value)}
                      placeholder="••••••••"
                      className="input-field text-xs py-2.5"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={changingPw}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                  >
                    {changingPw ? <RefreshCw size={14} className="animate-spin" /> : <Lock size={14} />}
                    <span>{ta ? 'கடவுச்சொல்லை மாற்று' : 'Update Password'}</span>
                  </button>
                </div>
              </form>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default Settings;
