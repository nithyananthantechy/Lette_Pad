// src/pages/Register.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { User, Mail, Phone, Lock, CheckCircle } from 'lucide-react';
import api from '../lib/api';
import Logo from '../components/Logo';

const roles = [
  { value: 'party_admin',   label_ta: 'கட்சி நிர்வாகி',    label_en: 'Party Admin' },
  { value: 'party_member',  label_ta: 'கட்சி உறுப்பினர்',  label_en: 'Party Member' },
  { value: 'govt_official', label_ta: 'அரசு அலுவலர்',       label_en: 'Govt Official' },
  { value: 'govt_staff',    label_ta: 'அரசு ஊழியர்',        label_en: 'Govt Staff' },
];

const Register = () => {
  const { t, i18n } = useTranslation();
  const ta = i18n.language === 'ta';
  const navigate = useNavigate();

  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [regEmail, setRegEmail] = useState('');

  const { register: r1, handleSubmit: hs1, watch, formState: { errors: e1 } } = useForm();
  const { register: r2, handleSubmit: hs2, reset: reset2, formState: { errors: e2 } } = useForm();
  const pw = watch('password');

  const onRegister = async (data) => {
    if (data.password !== data.confirmPassword) {
      toast.error(ta ? 'கடவுச்சொற்கள் பொருந்தவில்லை' : 'Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/register', {
        full_name: data.full_name,
        email:     data.email,
        phone:     data.phone,
        password:  data.password,
        role:      data.role,
      });
      setRegEmail(data.email);
      reset2({ otp: '' });
      setStep(2);
      toast.success(ta ? 'OTP உங்கள் மின்னஞ்சலுக்கு அனுப்பப்பட்டது!' : 'OTP sent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.message || (ta ? 'பதிவு தோல்வி' : 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async (data) => {
    setLoading(true);
    try {
      await api.post('/auth/verify-email', { email: regEmail, otp: data.otp });
      toast.success(ta ? '✅ மின்னஞ்சல் சரிபார்க்கப்பட்டது! உள்நுழையவும்.' : '✅ Email verified! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || (ta ? 'OTP தவறானது' : 'Invalid OTP'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <Link to="/" className="inline-block">
            <Logo size="lg" className="justify-center" />
          </Link>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-4 mb-6">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                ${step >= s ? 'bg-blue-600 text-white' : 'bg-white/20 text-white/50'}`}>
                {step > s ? <CheckCircle size={18} /> : s}
              </div>
              {s < 2 && <div className={`w-16 h-0.5 ${step > s ? 'bg-blue-600' : 'bg-white/20'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#1a1a2e] to-[#0f3460] p-6 text-white text-center">
            <h2 className="text-xl font-bold font-tamil">
              {step === 1 ? (ta ? '📝 புதிய கணக்கு' : '📝 Create Account') : (ta ? '📧 மின்னஞ்சல் சரிபார்ப்பு' : '📧 Email Verification')}
            </h2>
          </div>

          <div className="p-8">
            {step === 1 ? (
              <form onSubmit={hs1(onRegister)} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-tamil mb-2">
                    <User size={14} className="inline mr-1" /> {t('auth.full_name')}
                  </label>
                  <input
                    {...r1('full_name', { required: true, minLength: 3 })}
                    className="input-field"
                    placeholder={ta ? 'உங்கள் முழு பெயர்' : 'Your full name'}
                  />
                  {e1.full_name && <p className="text-red-500 text-xs mt-1 font-tamil">{ta ? 'பெயர் தேவை' : 'Name required'}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-tamil mb-2">
                    <Mail size={14} className="inline mr-1" /> {t('auth.email')}
                  </label>
                  <input
                    type="email"
                    {...r1('email', { required: true, pattern: /^\S+@\S+$/i })}
                    className="input-field"
                    placeholder="your@email.com"
                  />
                  {e1.email && <p className="text-red-500 text-xs mt-1 font-tamil">{ta ? 'சரியான மின்னஞ்சல் தேவை' : 'Valid email required'}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-tamil mb-2">
                    <Phone size={14} className="inline mr-1" /> {t('auth.phone')}
                  </label>
                  <input
                    type="tel"
                    {...r1('phone', { required: true, pattern: /^[6-9]\d{9}$/ })}
                    className="input-field"
                    placeholder="9876543210"
                  />
                  {e1.phone && <p className="text-red-500 text-xs mt-1 font-tamil">{ta ? '10-இலக்க தொலைபேசி எண் தேவை' : '10-digit phone required'}</p>}
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-tamil mb-2">
                    {t('auth.role')}
                  </label>
                  <select {...r1('role', { required: true })} className="input-field">
                    <option value="">{ta ? 'பாத்திரம் தேர்ந்தெடுக்கவும்' : 'Select role'}</option>
                    {roles.map(r => (
                      <option key={r.value} value={r.value}>
                        {ta ? r.label_ta : r.label_en}
                      </option>
                    ))}
                  </select>
                  {e1.role && <p className="text-red-500 text-xs mt-1 font-tamil">{ta ? 'பாத்திரம் தேவை' : 'Role required'}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-tamil mb-2">
                    <Lock size={14} className="inline mr-1" /> {t('auth.password')}
                  </label>
                  <input
                    type="password"
                    {...r1('password', { required: true, minLength: 8 })}
                    className="input-field"
                    placeholder={ta ? 'குறைந்தது 8 எழுத்துக்கள்' : 'Minimum 8 characters'}
                  />
                  {e1.password && <p className="text-red-500 text-xs mt-1 font-tamil">{ta ? 'குறைந்தது 8 எழுத்துக்கள் தேவை' : 'Min 8 characters required'}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-tamil mb-2">
                    <Lock size={14} className="inline mr-1" /> {ta ? 'கடவுச்சொல் உறுதிப்படுத்தல்' : 'Confirm Password'}
                  </label>
                  <input
                    type="password"
                    {...r1('confirmPassword', { required: true, validate: v => v === pw })}
                    className="input-field"
                    placeholder={ta ? 'மீண்டும் உள்ளிடுக' : 'Re-enter password'}
                  />
                  {e1.confirmPassword && <p className="text-red-500 text-xs mt-1 font-tamil">{ta ? 'கடவுச்சொற்கள் பொருந்தவில்லை' : 'Passwords do not match'}</p>}
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
                  {loading
                    ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <span className="font-tamil">{ta ? 'கணக்கு உருவாக்கு' : 'Create Account'}</span>
                  }
                </button>
              </form>
            ) : (
              <form onSubmit={hs2(onVerify)} className="space-y-5">
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <CheckCircle size={32} className="text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-green-700 font-tamil font-semibold">
                    {ta ? 'பதிவு வெற்றிகரமாக முடிந்தது!' : 'Registration successful!'}
                  </p>
                  <p className="text-xs text-green-600 font-tamil mt-1">
                    {ta ? `${regEmail} க்கு OTP அனுப்பப்பட்டது` : `OTP sent to ${regEmail}`}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 font-tamil mb-2">{t('auth.otp')}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    {...r2('otp', { required: true, pattern: /^\d{6}$/ })}
                    className="input-field text-center text-3xl tracking-[0.5em] font-bold"
                    placeholder="------"
                  />
                  {e2.otp && <p className="text-red-500 text-xs mt-1 font-tamil">{ta ? '6-இலக்க OTP தேவை' : '6-digit OTP required'}</p>}
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading
                    ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <span className="font-tamil">{ta ? 'சரிபார்க்க & முடிக்க' : 'Verify & Complete'}</span>
                  }
                </button>
              </form>
            )}

            <div className="text-center mt-6 text-sm text-gray-500 font-tamil">
              {t('auth.already_account')}{' '}
              <Link to="/login" className="text-blue-600 font-semibold hover:underline">{t('nav.login')}</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
