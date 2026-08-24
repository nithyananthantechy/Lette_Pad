// src/pages/Login.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

const Login = () => {
  const { t, i18n } = useTranslation();
  const ta = i18n.language === 'ta';
  const { login } = useAuth();
  const navigate   = useNavigate();

  const [step, setStep]       = useState(1); // 1=credentials, 2=OTP
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const [emailForOTP, setEmailForOTP] = useState('');

  const { register: reg1, handleSubmit: hs1, formState: { errors: e1 } } = useForm();
  const { register: reg2, handleSubmit: hs2, formState: { errors: e2 } } = useForm();

  const onCredentials = async (data) => {
    setLoading(true);
    try {
      await api.post('/auth/login', { email: data.email, password: data.password });
      setEmailForOTP(data.email);
      setStep(2);
      toast.success(ta ? 'OTP உங்கள் மின்னஞ்சலுக்கு அனுப்பப்பட்டது!' : 'OTP sent to your email!');
    } catch (err) {
      const msg = err.response?.data?.message;
      toast.error(msg || (ta ? 'உள்நுழைவு தோல்வி' : 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  const onOTP = async (data) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login/verify-otp', { email: emailForOTP, otp: data.otp });
      login(res.data.user, res.data.accessToken, res.data.refreshToken);
      toast.success(ta ? '✅ வெற்றிகரமாக உள்நுழைந்தீர்கள்!' : '✅ Logged in successfully!');
      if (res.data.user.role === 'super_admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || (ta ? 'OTP தவறானது' : 'Invalid OTP'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-block">
            <Logo size="lg" className="justify-center" />
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1a1a2e] to-[#0f3460] p-6 text-white text-center">
            <h2 className="text-xl font-bold font-tamil">
              {step === 1 ? (ta ? '🔑 உள்நுழைவு' : '🔑 Sign In') : (ta ? '📧 OTP சரிபார்ப்பு' : '📧 OTP Verification')}
            </h2>
            {step === 2 && (
              <p className="text-blue-200 text-sm mt-2 font-tamil">
                {ta ? `${emailForOTP} க்கு OTP அனுப்பப்பட்டது` : `OTP sent to ${emailForOTP}`}
              </p>
            )}
          </div>

          <div className="p-8">
            {step === 1 ? (
              <form onSubmit={hs1(onCredentials)} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-tamil mb-2">
                    <Mail size={14} className="inline mr-1" /> {t('auth.email')}
                  </label>
                  <input
                    type="email"
                    {...reg1('email', { required: true, pattern: /^\S+@\S+$/i })}
                    className="input-field"
                    placeholder="your@email.com"
                  />
                  {e1.email && <p className="text-red-500 text-xs mt-1 font-tamil">
                    {ta ? 'சரியான மின்னஞ்சல் தேவை' : 'Valid email required'}
                  </p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 font-tamil mb-2">
                    <Lock size={14} className="inline mr-1" /> {t('auth.password')}
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      {...reg1('password', { required: true, minLength: 8 })}
                      className="input-field pr-12"
                      placeholder={ta ? 'கடவுச்சொல் உள்ளிடுக' : 'Enter password'}
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {e1.password && <p className="text-red-500 text-xs mt-1 font-tamil">
                    {ta ? 'கடவுச்சொல் தேவை (குறைந்தது 8 எழுத்துக்கள்)' : 'Password required (min 8 chars)'}
                  </p>}
                </div>

                <div className="flex justify-end">
                  <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline font-tamil">
                    {t('auth.forgot_password')}
                  </Link>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading
                    ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <><span className="font-tamil">{ta ? 'தொடரவும்' : 'Continue'}</span><ArrowRight size={18} /></>
                  }
                </button>
              </form>
            ) : (
              <form onSubmit={hs2(onOTP)} className="space-y-5">
                <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-3">
                  <Shield size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700 font-tamil">
                    {ta
                      ? 'உங்கள் கணக்கை பாதுகாக்க 6-இலக்க OTP அனுப்பப்பட்டது. 10 நிமிடங்களில் காலாவதியாகும்.'
                      : '6-digit OTP sent to protect your account. Expires in 10 minutes.'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 font-tamil mb-2">
                    {t('auth.otp')}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    {...reg2('otp', { required: true, pattern: /^\d{6}$/ })}
                    className="input-field text-center text-3xl tracking-[0.5em] font-bold"
                    placeholder="------"
                  />
                  {e2.otp && <p className="text-red-500 text-xs mt-1 font-tamil">
                    {ta ? '6-இலக்க OTP தேவை' : '6-digit OTP required'}
                  </p>}
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading
                    ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <><Shield size={18} /><span className="font-tamil">{ta ? 'சரிபார்க்க & உள்நுழைக' : 'Verify & Login'}</span></>
                  }
                </button>

                <button type="button" onClick={() => setStep(1)}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 font-tamil">
                  ← {ta ? 'திரும்பு' : 'Back'}
                </button>
              </form>
            )}

            <div className="text-center mt-6 text-sm text-gray-500 font-tamil">
              {t('auth.no_account')}{' '}
              <Link to="/register" className="text-blue-600 font-semibold hover:underline">
                {t('nav.register')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
