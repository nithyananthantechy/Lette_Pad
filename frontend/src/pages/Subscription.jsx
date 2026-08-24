// src/pages/Subscription.jsx — Subscription, 7-Day Trial & Google Pay UPI Payment Portal
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  CreditCard, ShieldCheck, CheckCircle2, QrCode, Copy,
  ArrowRight, Sparkles, Clock, AlertTriangle, RefreshCw,
  Award, Lock, ExternalLink, X
} from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../lib/api';
import toast from 'react-hot-toast';

const Subscription = () => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const ta = i18n.language === 'ta';

  const [subData, setSubData]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [upiRefNo, setUpiRefNo]     = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadStatus = async () => {
    try {
      const res = await api.get('/subscription/status');
      if (res.data?.success) {
        setSubData(res.data);
      }
    } catch {
      toast.error(ta ? 'சந்தா விவரங்களை ஏற்றுவதில் பிழை' : 'Failed to load subscription status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStatus(); }, []);

  const handleOpenPay = (plan) => {
    setSelectedPlan(plan);
    setShowPayModal(true);
  };

  const copyUPI = () => {
    const upiId = subData?.upi?.upi_id || 'nithyananthannagarajan092@oksbi';
    navigator.clipboard.writeText(upiId);
    toast.success(ta ? '📋 UPI ID நகலெடுக்கப்பட்டது!' : '📋 UPI ID copied to clipboard!');
  };

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!upiRefNo.trim()) {
      return toast.error(ta ? '12-இலக்க UTR / Transaction Ref No உள்ளிடவும்' : 'Enter 12-digit UPI UTR number');
    }

    setSubmitting(true);
    try {
      const res = await api.post('/subscription/submit-payment', {
        plan_id: selectedPlan.id,
        upi_ref_no: upiRefNo,
      });

      toast.success(res.data?.message || (ta ? '✅ சந்தா வெற்றிகரமாக புதுப்பிக்கப்பட்டது!' : '✅ Subscription activated successfully!'));
      setShowPayModal(false);
      setUpiRefNo('');
      loadStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || (ta ? 'கட்டணம் பதிவு செய்தல் தோல்வி' : 'Payment submission failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const plans = subData?.plans ? Object.values(subData.plans) : [
    { id: 'simple', name_ta: 'எளிய திட்டம் (Starter)', name_en: 'Starter Plan', amount: 999, duration_days: 30 },
    { id: 'medium', name_ta: 'தொகுதி திட்டம் (Constituency Pro)', name_en: 'Constituency Pro Plan', amount: 2999, duration_days: 30, highlight: true },
    { id: 'custom', name_ta: 'மாநில நிர்வாகம் (Enterprise)', name_en: 'State Enterprise Plan', amount: 14999, duration_days: 365 },
  ];

  const sub = subData?.subscription || { status: 'trial', days_remaining: 7, is_expired: false };
  const upiId = subData?.upi?.upi_id || 'nithyananthannagarajan092@oksbi';
  const payeeName = subData?.upi?.payee_name || 'Nithyananthan Nagarajan';

  return (
    <div className="min-h-screen bg-slate-50 font-tamil pb-16">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Header Bar */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-3.5 py-1 rounded-full text-xs font-bold mb-3">
            <Sparkles size={14} className="text-blue-600" />
            <span>{ta ? 'கட்டணம் & சந்தா மேலாண்மை' : 'Subscription & Billing'}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            {ta ? 'உங்கள் கணக்கு & கட்டணத் திட்டங்கள்' : 'Manage Subscription & Payments'}
          </h1>
          <p className="text-xs text-slate-500 mt-2">
            {ta
              ? '7 நாள் இலவச சோதனைக் காலம் & கூகுள் பே (Google Pay UPI) நேரடி கட்டண முறை'
              : '7-Day Free Trial access with direct Google Pay UPI activation'}
          </p>
        </div>

        {/* Current Plan Status Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm mb-10 max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-xs flex-shrink-0
                ${sub.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : sub.is_expired ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>
                {sub.status === 'active' ? '👑' : sub.is_expired ? '⚠️' : '✨'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-900">
                    {sub.status === 'active'
                      ? (ta ? 'செயலில் உள்ள சந்தா (Active Plan)' : 'Active Subscription')
                      : sub.is_expired
                        ? (ta ? 'சோதனைக் காலம் முடிவடைந்தது (Expired)' : 'Trial Expired')
                        : (ta ? '7 நாள் இலவச சோதனை முறை (7-Day Trial)' : '7-Day Free Trial')}
                  </h3>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase
                    ${sub.status === 'active' ? 'bg-emerald-100 text-emerald-800' : sub.is_expired ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                    {sub.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <Clock size={13} className="text-slate-400" />
                  <span>
                    {sub.is_expired
                      ? (ta ? 'தொடர்ந்து பயன்படுத்த கீழே உள்ள திட்டங்களில் ஒன்றைத் தேர்ந்தெடுத்து புதுப்பிக்கவும்.' : 'Please choose a plan below to renew access.')
                      : (ta ? `இன்னும் ${sub.days_remaining} நாட்கள் உள்ளன` : `${sub.days_remaining} days remaining`)}
                  </span>
                </p>
              </div>
            </div>

            {sub.is_expired && (
              <button
                onClick={() => handleOpenPay(plans[1])}
                className="btn-primary text-xs py-2.5 px-5 shadow-md flex items-center gap-1.5 flex-shrink-0"
              >
                <span>{ta ? 'உடனடி புதுப்பித்தல் →' : 'Renew Access →'}</span>
              </button>
            )}
          </div>

          {/* Trial Progress Bar */}
          {!sub.is_expired && sub.status === 'trial' && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1.5">
                <span>{ta ? 'இலவச சோதனை கால அளவு' : 'Trial Period Usage'}</span>
                <span>{7 - sub.days_remaining} / 7 {ta ? 'நாட்கள் முடிந்தது' : 'days used'}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.max(10, ((7 - sub.days_remaining) / 7) * 100))}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6 items-stretch mb-12">
          {plans.map((plan, idx) => {
            const isMedium = plan.id === 'medium';
            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-7 flex flex-col justify-between transition-all relative
                  ${isMedium
                    ? 'bg-slate-900 text-white shadow-xl ring-2 ring-blue-500 md:-translate-y-1'
                    : 'bg-white text-slate-900 border border-slate-200 shadow-xs hover:shadow-md'}`}
              >
                {isMedium && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                    {ta ? 'மிகவும் பிரபலம்' : 'Most Popular'}
                  </div>
                )}

                <div>
                  <h3 className="font-bold text-lg mb-1">{ta ? plan.name_ta : plan.name_en}</h3>
                  <div className="text-xs opacity-75 mb-4">{plan.id === 'custom' ? (ta ? 'மாநில தலைமையகம்' : 'State Level') : (ta ? 'மாதாந்திர சந்தா' : 'Monthly')}</div>
                  
                  <div className="mb-5">
                    <span className="text-3xl font-black">₹{plan.amount.toLocaleString()}</span>
                    <span className="text-xs opacity-70 ml-1">/ {plan.duration_days} {ta ? 'நாட்கள்' : 'days'}</span>
                  </div>

                  <div className="space-y-2.5 mb-8 text-xs">
                    {(plan.features || []).map((f, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 size={15} className={`flex-shrink-0 mt-0.5 ${isMedium ? 'text-blue-400' : 'text-emerald-600'}`} />
                        <span className={isMedium ? 'text-slate-200' : 'text-slate-700'}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleOpenPay(plan)}
                  className={`w-full py-3 rounded-xl font-bold text-xs text-center transition-all shadow-sm flex items-center justify-center gap-1.5
                    ${isMedium
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
                >
                  <QrCode size={14} />
                  <span>{ta ? 'Google Pay மூலம் செலுத்து' : 'Pay via Google Pay'}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* PAYMENT CHECKOUT MODAL — GOOGLE PAY UPI QR CODE */}
        {showPayModal && selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15, 23, 42, 0.75)' }}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto border border-slate-200">
              
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-t-3xl flex items-center justify-between">
                <div>
                  <div className="text-xs text-blue-300 font-bold uppercase tracking-wider mb-0.5">
                    {ta ? 'உடனடி UPI கட்டண நுழைவாயில்' : 'Instant UPI Payment'}
                  </div>
                  <h2 className="text-base font-bold flex items-center gap-2 font-tamil">
                    <span>{ta ? selectedPlan.name_ta : selectedPlan.name_en}</span>
                    <span className="bg-emerald-500 text-white text-xs font-mono px-2 py-0.5 rounded-lg">
                      ₹{selectedPlan.amount.toLocaleString()}
                    </span>
                  </h2>
                </div>
                <button onClick={() => setShowPayModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* QR Code & Instructions */}
              <div className="p-6 space-y-5 text-center font-tamil">
                
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 inline-block mx-auto shadow-inner">
                  <img
                    src="/gpay_qr.png"
                    alt="Google Pay UPI QR Code"
                    className="w-56 h-auto mx-auto rounded-xl shadow-xs"
                  />
                  <div className="text-[11px] text-slate-500 mt-2 font-medium">
                    Google Pay / PhonePe / Paytm / BHIM மூலம் ஸ்கேன் செய்யவும்
                  </div>
                </div>

                {/* UPI ID Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 flex items-center justify-between text-left">
                  <div>
                    <div className="text-[10px] text-blue-600 font-bold uppercase">அதிகாரப்பூர்வ UPI ID:</div>
                    <div className="text-xs font-mono font-bold text-slate-900 truncate">{upiId}</div>
                    <div className="text-[10px] text-slate-500">{payeeName}</div>
                  </div>
                  <button
                    onClick={copyUPI}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-colors flex-shrink-0"
                  >
                    <Copy size={13} />
                    <span>{ta ? 'நகலெடு' : 'Copy'}</span>
                  </button>
                </div>

                {/* Direct Mobile UPI Intent Button */}
                <a
                  href={`upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${selectedPlan.amount}&cu=INR&tn=${encodeURIComponent(`LeadPad AI ${selectedPlan.id}`)}`}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all sm:hidden"
                >
                  <ExternalLink size={14} />
                  <span>Google Pay / UPI செயலியில் நேரடியாகத் திறக்க</span>
                </a>

                {/* UTR Number Form */}
                <form onSubmit={handleConfirmPayment} className="text-left space-y-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block font-bold text-xs text-slate-800 mb-1">
                      {ta ? 'கட்டணம் செலுத்திய 12-இலக்க UTR / Ref எண் *' : '12-Digit UPI Transaction UTR / Ref Number *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={upiRefNo}
                      onChange={e => setUpiRefNo(e.target.value)}
                      placeholder="எ.கா: 423589123456"
                      className="input-field text-xs py-2.5 font-mono"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Google Pay பரிவர்த்தனை ரசீதில் உள்ள 12 இலக்க Ref / UPI Transaction ID-ஐ உள்ளிடவும்.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full btn-primary py-3 text-xs flex items-center justify-center gap-2 shadow-md mt-2"
                  >
                    {submitting ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    <span>{ta ? 'கட்டணத்தை உறுதிசெய்து சந்தாவைத் தொடங்குக' : 'Confirm & Activate Subscription'}</span>
                  </button>
                </form>

              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Subscription;
