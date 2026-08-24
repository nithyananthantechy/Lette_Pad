// src/pages/Letters.jsx — Enterprise Letters Management (View, Print, Edit, Finalize, Send & Delete)
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Plus, Download, XCircle, FileText, Eye, AlertTriangle,
  Trash2, Printer, ExternalLink, RefreshCw, CheckCircle2,
  ShieldCheck, Edit3, Send, Mail, MessageSquare, Share2,
  Check, X
} from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../lib/api';
import toast from 'react-hot-toast';

const statusBadgeClass = {
  draft:     'bg-amber-100 text-amber-800 border border-amber-200',
  finalized: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  revoked:   'bg-red-100 text-red-800 border border-red-200',
};

const statusLabel = (s, ta) => ({
  draft:     ta ? 'வரைவு' : 'Draft',
  finalized: ta ? 'இறுதியாக்கப்பட்டது' : 'Finalized',
  revoked:   ta ? 'திரும்பப்பெறப்பட்டது' : 'Revoked',
}[s] || s);

const Letters = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const ta = i18n.language === 'ta';

  const [letters, setLetters]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState('all');
  
  // Modals
  const [revokeModal, setRevokeModal]   = useState(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking]         = useState(false);

  const [sendModal, setSendModal]       = useState(null);
  const [sendEmail, setSendEmail]       = useState('');
  const [customMsg, setCustomMsg]       = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  const loadLetters = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const res = await api.get(`/letters${params}`);
      setLetters(res.data.letters || []);
    } catch {
      toast.error(ta ? 'கடிதங்கள் ஏற்றுவதில் பிழை' : 'Failed to load letters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLetters(); }, [filter]);

  // Open / Print letterhead
  const exportPDF = async (letter) => {
    try {
      const res = await api.post(`/letters/${letter.id}/export-pdf`);
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
      loadLetters();
    } catch {
      toast.error(ta ? 'PDF ஏற்றுமதி தோல்வி' : 'PDF export failed');
    }
  };

  // Finalize letter
  const finalizeLetter = async (letter) => {
    try {
      await api.post(`/letters/${letter.id}/finalize`);
      toast.success(ta ? '✅ கடிதம் அதிகாரப்பூர்வமாக இறுதியாக்கப்பட்டது!' : '✅ Letter finalized successfully!');
      loadLetters();
    } catch {
      toast.error(ta ? 'இறுதியாக்குவதில் பிழை' : 'Failed to finalize letter');
    }
  };

  // Send Email Dispatch
  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!sendEmail.trim()) return toast.error(ta ? 'மின்னஞ்சல் முகவரி தேவை' : 'Email required');
    setSendingEmail(true);
    try {
      const res = await api.post(`/letters/${sendModal.id}/send-email`, {
        recipientEmail: sendEmail,
        customMessage: customMsg,
      });
      toast.success(res.data.message || (ta ? '✉️ மடல் வெற்றிகரமாக அனுப்பப்பட்டது!' : 'Dispatched!'));
      setSendModal(null);
      setSendEmail('');
      setCustomMsg('');
      loadLetters();
    } catch (err) {
      toast.error(err.response?.data?.message || (ta ? 'அனுப்புவதில் பிழை' : 'Failed to send email'));
    } finally {
      setSendingEmail(false);
    }
  };

  // Send via WhatsApp
  const handleShareWhatsApp = (letter) => {
    const verifyLink = `${window.location.origin}/verify/${letter.document_id}`;
    const text = `🏛️ *தமிழ்நாடு அதிகாரப்பூர்வ மடல் அறிவிப்பு*\n\n` +
      `*ஆவண எண்:* ${letter.document_id}\n` +
      `*வழங்கியவர்:* ${letter.profile_name_ta || 'நிர்வாகி'}\n` +
      `*பொருள்:* ${letter.subject_ta || letter.subject_en || 'அதிகாரப்பூர்வ கடிதம்'}\n\n` +
      `🔍 *ஆவணத்தை சரிபார்க்க & படிக்க:* ${verifyLink}`;
    
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Delete letter
  const deleteLetter = async (letter) => {
    if (!confirm(ta ? `"${letter.document_id}" கடிதத்தை நிரந்தரமாக நீக்க விரும்புகிறீர்களா?` : `Delete letter ${letter.document_id}?`)) return;
    try {
      await api.delete(`/letters/${letter.id}`);
      toast.success(ta ? 'கடிதம் வெற்றிகரமாக நீக்கப்பட்டது!' : 'Letter deleted successfully!');
      loadLetters();
    } catch {
      toast.error(ta ? 'நீக்குவதில் பிழை' : 'Failed to delete letter');
    }
  };

  // Revoke letter
  const revoke = async () => {
    if (!revokeReason.trim()) return toast.error(ta ? 'காரணம் கொடுக்கவும்' : 'Provide a reason');
    setRevoking(true);
    try {
      await api.post(`/letters/${revokeModal.id}/revoke`, { reason: revokeReason });
      toast.success(ta ? '⚠️ கடிதம் திரும்பப்பெறப்பட்டது' : '⚠️ Letter revoked');
      setRevokeModal(null);
      setRevokeReason('');
      loadLetters();
    } catch {
      toast.error(ta ? 'திரும்பப்பெறுதல் தோல்வி' : 'Revoke failed');
    } finally {
      setRevoking(false);
    }
  };

  const tabs = [
    { key: 'all',       label: ta ? 'அனைத்தும்' : 'All' },
    { key: 'draft',     label: ta ? 'வரைவுகள்' : 'Drafts' },
    { key: 'finalized', label: ta ? 'இறுதியாக்கப்பட்டவை' : 'Finalized' },
    { key: 'revoked',   label: ta ? 'திரும்பப்பெறப்பட்டவை' : 'Revoked' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-tamil pb-16">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold font-tamil text-slate-900 flex items-center gap-2">
              <FileText className="text-blue-600" />
              <span>{ta ? 'என் கடிதங்கள் (My Letters)' : 'My Letters'}</span>
            </h1>
            <p className="text-xs text-slate-500 font-tamil mt-1">
              தயாரிக்கப்பட்ட அதிகாரப்பூர்வ மடல்கள், வரைவுகள், மின்னஞ்சல் அனுப்புதல் மற்றும் சரிபார்ப்பு
            </p>
          </div>

          <Link to="/letters/new" className="btn-primary flex items-center gap-2 text-xs py-2.5 shadow-md self-start sm:self-auto">
            <Plus size={16} />
            <span>{ta ? '+ புதிய கடிதம் உருவாக்கு' : '+ Create New Letter'}</span>
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-2xl p-1.5 shadow-xs border border-slate-200 w-fit text-xs">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-xl font-tamil transition-all
                ${filter === tab.key ? 'bg-slate-900 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Letters Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-slate-400 font-tamil mt-3">{ta ? 'ஏற்றுகிறது...' : 'Loading...'}</p>
            </div>
          ) : letters.length === 0 ? (
            <div className="p-16 text-center max-w-sm mx-auto">
              <FileText size={48} className="text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700 font-tamil mb-1">
                {ta ? 'கடிதங்கள் எதுவும் இல்லை' : 'No letters found'}
              </h3>
              <p className="text-xs text-slate-400 font-tamil mb-5">
                {ta ? 'நீங்கள் இதுவரை எந்த கடிதமும் உருவாக்கவில்லை.' : 'You have not created any letters yet.'}
              </p>
              <Link to="/letters/new" className="btn-primary text-xs py-2.5 px-5 inline-block shadow-sm">
                {ta ? '+ புதிய கடிதம் உருவாக்க →' : '+ Create New Letter →'}
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {[
                      ta ? 'ஆவண ID' : 'Document ID',
                      ta ? 'பொருள் (Subject)' : 'Subject',
                      ta ? 'சுயவிவரம்' : 'Profile',
                      ta ? 'நிலை' : 'Status',
                      ta ? 'நாள்' : 'Date',
                      ta ? 'செயல்கள் (Actions)' : 'Actions',
                    ].map((h, i) => (
                      <th key={i} className="px-5 py-3.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider font-tamil">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {letters.map(letter => (
                    <tr key={letter.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Document ID */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-2.5 py-1 rounded-lg">
                          {letter.document_id}
                        </span>
                      </td>

                      {/* Subject */}
                      <td className="px-5 py-4 max-w-xs">
                        <div className="font-bold text-slate-900 font-tamil truncate">
                          {letter.subject_ta || letter.subject_en || (ta ? '(பொருள் குறிப்பிடப்படவில்லை)' : '(No subject)')}
                        </div>
                        {letter.recipient_name && (
                          <div className="text-[11px] text-slate-500 font-tamil truncate mt-0.5">
                            பெறுநர்: {letter.recipient_name}
                          </div>
                        )}
                      </td>

                      {/* Profile & Party */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-bold text-slate-800 font-tamil">
                          {letter.profile_name_ta || letter.profile_name_en || '—'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-tamil">
                          {letter.party_name || letter.abbreviation || 'Official'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusBadgeClass[letter.status] || 'bg-slate-100 text-slate-600'}`}>
                          {statusLabel(letter.status, ta)}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 text-slate-500 font-tamil whitespace-nowrap text-[11px]">
                        {new Date(letter.created_at).toLocaleDateString(ta ? 'ta-IN' : 'en-IN')}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          
                          {/* 1. View / Print Button */}
                          <button
                            onClick={() => exportPDF(letter)}
                            className="p-1.5 text-slate-700 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1 font-bold text-xs shadow-2xs"
                            title={ta ? 'மடல் காண் / அச்சிடு' : 'View / Print Letter'}
                          >
                            <Printer size={14} className="text-blue-600" />
                            <span>{ta ? 'காண் / அச்சிடு' : 'Print'}</span>
                          </button>

                          {/* 2. Edit Button */}
                          <button
                            onClick={() => navigate(`/letters/${letter.id}/edit`)}
                            className="p-1.5 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1 font-bold text-xs shadow-2xs"
                            title={ta ? 'திருத்து' : 'Edit Letter'}
                          >
                            <Edit3 size={14} className="text-indigo-600" />
                            <span>{ta ? 'திருத்து' : 'Edit'}</span>
                          </button>

                          {/* 3. Finalize Button (If draft) */}
                          {letter.status === 'draft' && (
                            <button
                              onClick={() => finalizeLetter(letter)}
                              className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1 font-bold text-xs shadow-2xs"
                              title={ta ? 'அதிகாரப்பூர்வமாக இறுதியாக்கு' : 'Finalize Letter'}
                            >
                              <CheckCircle2 size={14} />
                              <span>{ta ? 'இறுதியாக்கு' : 'Finalize'}</span>
                            </button>
                          )}

                          {/* 4. Send / Dispatch Button */}
                          <button
                            onClick={() => setSendModal(letter)}
                            className="p-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1 font-bold text-xs shadow-2xs"
                            title={ta ? 'மின்னஞ்சல் / வாட்ஸ்அப் வழியாக அனுப்பு' : 'Send / Dispatch'}
                          >
                            <Send size={14} />
                            <span>{ta ? 'அனுப்பு' : 'Send'}</span>
                          </button>

                          {/* 5. QR Verify Link */}
                          <a
                            href={`/verify/${letter.document_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1 font-semibold text-xs"
                            title={ta ? 'QR சரிபார்ப்பு' : 'Verify'}
                          >
                            <ShieldCheck size={14} className="text-emerald-600" />
                          </a>

                          {/* 6. Revoke Button (If finalized) */}
                          {letter.status === 'finalized' && (
                            <button
                              onClick={() => { setRevokeModal(letter); setRevokeReason(''); }}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title={ta ? 'திரும்பப்பெறு' : 'Revoke'}
                            >
                              <XCircle size={15} />
                            </button>
                          )}

                          {/* 7. Delete Button */}
                          <button
                            onClick={() => deleteLetter(letter)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title={ta ? 'நீக்கு' : 'Delete'}
                          >
                            <Trash2 size={15} />
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

      </div>

      {/* SEND / DISPATCH MODAL */}
      {sendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 border border-slate-200 font-tamil">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Send size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {ta ? 'அதிகாரப்பூர்வ மடல் அனுப்புதல்' : 'Dispatch Official Letter'}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">{sendModal.document_id}</p>
                </div>
              </div>
              <button onClick={() => setSendModal(null)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            {/* Quick WhatsApp Share Banner */}
            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <MessageSquare size={14} className="text-emerald-600" />
                  <span>வாட்ஸ்அப் வழியாக உடனடியாக பகிர</span>
                </div>
                <div className="text-[11px] text-emerald-700 mt-0.5">
                  சரிபார்ப்பு இணைப்பு மற்றும் சுருக்கத்துடன் அனுப்பவும்
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleShareWhatsApp(sendModal)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 flex-shrink-0"
              >
                <span>WhatsApp</span>
                <Share2 size={12} />
              </button>
            </div>

            {/* Email Dispatch Form */}
            <form onSubmit={handleSendEmail} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Mail size={13} className="text-blue-600" />
                  <span>பெறுநரின் மின்னஞ்சல் முகவரி (Recipient Email) *</span>
                </label>
                <input
                  type="email"
                  required
                  value={sendEmail}
                  onChange={e => setSendEmail(e.target.value)}
                  placeholder="எ.கா: collector.erode@tn.gov.in அல்லது cadre@party.tn"
                  className="input-field text-xs py-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  கூடுதல் செய்தி / குறிப்பு (Optional Message)
                </label>
                <textarea
                  rows={2}
                  value={customMsg}
                  onChange={e => setCustomMsg(e.target.value)}
                  placeholder="எ.கா: மாண்புமிகு ஆட்சியர் அவர்களின் கனிவான பார்வைக்கு அனுப்பி வைக்கப்படுகிறது..."
                  className="input-field text-xs py-2 font-tamil"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setSendModal(null)} className="btn-secondary flex-1 text-xs py-2.5">
                  {ta ? 'ரத்து செய்' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="btn-primary flex-1 text-xs py-2.5 flex items-center justify-center gap-1.5"
                >
                  {sendingEmail ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>{ta ? 'மின்னஞ்சல் அனுப்பு' : 'Send Dispatch Email'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Revoke Modal */}
      {revokeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-200 font-tamil">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-red-100 rounded-xl"><AlertTriangle size={22} className="text-red-600" /></div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {ta ? '⚠️ கடிதம் திரும்பப்பெறுதல்' : '⚠️ Revoke Letter'}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{revokeModal.document_id}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              {ta
                ? 'இந்தக் கடிதத்தை திரும்பப்பெற்றால், பொது QR சரிபார்ப்பு பக்கத்தில் "திரும்பப்பெறப்பட்டது / செல்லாது" என்று உடனடியாக எச்சரிக்கப்படும்.'
                : 'After revocation, the public QR verification page will show "Document Revoked".'}
            </p>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {ta ? 'திரும்பப்பெறுவதற்கான காரணம் *' : 'Reason for revocation *'}
              </label>
              <textarea
                value={revokeReason}
                onChange={e => setRevokeReason(e.target.value)}
                rows={3}
                className="input-field text-xs font-tamil"
                placeholder={ta ? 'எ.கா: திருத்தப்பட்ட புதிய மடல் வெளியிடப்பட்டது...' : 'E.g.: Revised letter issued...'}
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setRevokeModal(null)} className="btn-secondary flex-1 text-xs py-2.5">
                {ta ? 'ரத்து செய்' : 'Cancel'}
              </button>
              <button onClick={revoke} disabled={revoking} className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all flex-1">
                {revoking ? 'செயல்படுகிறது...' : (ta ? 'உறுதி செய்' : 'Confirm Revoke')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Letters;
