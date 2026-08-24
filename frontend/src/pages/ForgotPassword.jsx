// src/pages/ForgotPassword.jsx — Secure 2-Step Password Reset Flow
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, KeyRound, ArrowRight, CheckCircle2, ArrowLeft, RefreshCw } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import Logo from '../components/Logo';

const ForgotPassword = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const ta = i18n.language === 'ta';

  const [step, setStep]           = useState(1); // 1 = Enter Email, 2 = Enter OTP + New Password
  const [loading, setLoading]     = useState(false);
  const [emailForOTP, setEmailForOTP] = useState('');

  const { register: reg1, handleSubmit: hs1, formState: { errors: e1 } } = useForm();
  const { register: reg2, handleSubmit: hs2, formState: { errors: e2 }, watch } = useForm();

  // Step 1: Send Password Reset OTP
  const onSendOTP = async (data) => {
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: data.email });
      setEmailForOTP(data.email);
      setStep(2);
      toast.success(ta ? 'OTP உங்கள் மின்னஞ்சலுக்கு அனுப்பப்பட்டது!' : 'OTP sent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.message || (ta ? 'கோரிக்கை தோல்வி' : 'Request failed'));
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP & Set New Password
  const onResetPassword = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      return toast.error(ta ? 'கடவுச்சொற்கள் பொருந்தவில்லை' : 'Passwords do not match');
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        email: emailForOTP,
        otp: data.otp,
        newPassword: data.newPassword,
      });
      toast.success(res.data.message || (ta ? '✅ கடவுச்சொல் மாற்றப்பட்டது! உள்நுழையவும்.' : '✅ Password reset! Please login.'));
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || (ta ? 'OTP தவறானது அல்லது காலாவதியானது' : 'Invalid or expired OTP'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#090d16] flex items-center justify-center p-4 py-12 font-tamil">
      <div className="w-full max-w-md">
        
        {/* Brand Logo */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-block">
            <Logo size="lg" className="justify-center" />
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-8">
          
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <KeyRound size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {ta ? 'கடவுச்சொல் மீட்டெடுப்பு' : 'Reset Password'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {step === 1
                ? (ta ? 'பதிவு செய்யப்பட்ட உங்கள் மின்னஞ்சல் முகவரியை உள்ளிடவும்' : 'Enter your registered email address')
                : (ta ? `மின்னஞ்சலுக்கு (${emailForOTP}) வந்த OTP மற்றும் புதிய கடவுச்சொல்லை உள்ளிடவும்` : `Enter OTP sent to ${emailForOTP} & new password`)}
            </p>
          </div>

          {/* STEP 1: EMAIL INPUT */}
          {step === 1 && (
            <form onSubmit={hs1(onSendOTP)} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {ta ? 'மின்னஞ்சல் முகவரி (Registered Email) *' : 'Registered Email *'}
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    {...reg1('email', { required: true })}
                    placeholder="எ.கா: nithyananthan@nskgroups.website"
                    className="input-field pl-9 text-xs py-2.5"
                  />
                </div>
                {e1.email && <span className="text-red-500 text-[10px] mt-1 block">மின்னஞ்சல் தேவை</span>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 text-xs flex items-center justify-center gap-2 shadow-md mt-2"
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                <span>{ta ? 'மீட்டமைப்பு OTP பெறுக →' : 'Send Reset OTP →'}</span>
              </button>

              <div className="text-center pt-3 border-t border-slate-100">
                <Link to="/login" className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 text-xs font-semibold">
                  <ArrowLeft size={13} />
                  <span>{ta ? 'உள்நுழைவுக்குத் திரும்பு' : 'Back to Login'}</span>
                </Link>
              </div>
            </form>
          )}

          {/* STEP 2: OTP + NEW PASSWORD */}
          {step === 2 && (
            <form onSubmit={hs2(onResetPassword)} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {ta ? '6-இலக்க OTP குறியீடு *' : '6-Digit OTP Code *'}
                </label>
                <input
                  type="text"
                  maxLength={6}
                  {...reg2('otp', { required: true, minLength: 6, maxLength: 6 })}
                  placeholder="123456"
                  className="input-field text-center tracking-widest text-base font-mono font-bold py-2"
                />
                {e2.otp && <span className="text-red-500 text-[10px] mt-1 block">6 இலக்க OTP தேவை</span>}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {ta ? 'புதிய கடவுச்சொல் (New Password) *' : 'New Password *'}
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    {...reg2('newPassword', { required: true, minLength: 8 })}
                    placeholder="குறைந்தது 8 எழுத்துக்கள்"
                    className="input-field pl-9 text-xs py-2.5"
                  />
                </div>
                {e2.newPassword && <span className="text-red-500 text-[10px] mt-1 block">குறைந்தது 8 எழுத்துக்கள் தேவை</span>}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {ta ? 'மீண்டும் புதிய கடவுச்சொல் (Confirm Password) *' : 'Confirm Password *'}
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    {...reg2('confirmPassword', { required: true })}
                    placeholder="••••••••"
                    className="input-field pl-9 text-xs py-2.5"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 text-xs flex items-center justify-center gap-2 shadow-md mt-2"
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                <span>{ta ? 'கடவுச்சொல்லை மாற்று & உள்நுழை' : 'Reset Password & Login'}</span>
              </button>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-slate-500 hover:text-slate-800 font-semibold inline-flex items-center gap-1"
                >
                  <ArrowLeft size={13} />
                  <span>{ta ? 'மின்னஞ்சல் மாற்று' : 'Change Email'}</span>
                </button>

                <Link to="/login" className="text-blue-600 font-bold hover:underline">
                  {ta ? 'உள்நுழைவு' : 'Login'}
                </Link>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};

export default ForgotPassword;
