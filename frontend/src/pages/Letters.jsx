// src/pages/Letters.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Download, XCircle, FileText, Eye, AlertTriangle } from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../lib/api';
import toast from 'react-hot-toast';

const statusBadgeClass = { draft: 'badge badge-yellow', finalized: 'badge badge-green', revoked: 'badge badge-red' };
const statusLabel = (s, ta) => ({ draft: ta ? 'வரைவு' : 'Draft', finalized: ta ? 'இறுதியாக்கப்பட்டது' : 'Finalized', revoked: ta ? 'திரும்பப்பெறப்பட்டது' : 'Revoked' }[s] || s);

const Letters = () => {
  const { i18n } = useTranslation();
  const ta = i18n.language === 'ta';

  const [letters, setLetters]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [revokeModal, setRevokeModal] = useState(null); // letter object
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);

  const loadLetters = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const res = await api.get(`/letters${params}`);
      setLetters(res.data.letters || []);
    } catch { toast.error(ta ? 'கடிதங்கள் ஏற்றுவதில் பிழை' : 'Failed to load letters'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadLetters(); }, [filter]);

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

  const revoke = async () => {
    if (!revokeReason.trim()) return toast.error(ta ? 'காரணம் கொடுக்கவும்' : 'Provide a reason');
    setRevoking(true);
    try {
      await api.post(`/letters/${revokeModal.id}/revoke`, { reason: revokeReason });
      toast.success(ta ? '⚠️ கடிதம் திரும்பப்பெறப்பட்டது' : '⚠️ Letter revoked');
      setRevokeModal(null);
      setRevokeReason('');
      loadLetters();
    } catch { toast.error(ta ? 'திரும்பப்பெறுதல் தோல்வி' : 'Revoke failed'); }
    finally { setRevoking(false); }
  };

  const tabs = [
    { key: 'all',       label: ta ? 'அனைத்தும்' : 'All' },
    { key: 'draft',     label: ta ? 'வரைவுகள்' : 'Drafts' },
    { key: 'finalized', label: ta ? 'இறுதியாக்கப்பட்டவை' : 'Finalized' },
    { key: 'revoked',   label: ta ? 'திரும்பப்பெறப்பட்டவை' : 'Revoked' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-tamil text-gray-900">
              📄 {ta ? 'என் கடிதங்கள்' : 'My Letters'}
            </h1>
            <p className="text-gray-500 font-tamil text-sm mt-1">{letters.length} {ta ? 'கடிதங்கள் மொத்தம்' : 'letters total'}</p>
          </div>
          <Link to="/letters/new" className="btn-primary flex items-center gap-2 font-tamil">
            <Plus size={18} /> {ta ? 'புதிய கடிதம்' : 'New Letter'}
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-2xl p-2 shadow-sm border border-gray-100 w-fit">
          {tabs.map(tab => (
            <button key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-5 py-2 rounded-xl text-sm font-tamil transition-all
                ${filter === tab.key ? 'bg-[#1a1a2e] text-white font-semibold shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Letters Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-[#1a1a2e] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-400 font-tamil mt-3">{ta ? 'ஏற்றுகிறது...' : 'Loading...'}</p>
            </div>
          ) : letters.length === 0 ? (
            <div className="p-16 text-center">
              <FileText size={56} className="text-gray-200 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-400 font-tamil mb-2">
                {ta ? 'கடிதங்கள் இல்லை' : 'No letters found'}
              </h3>
              <Link to="/letters/new" className="text-blue-600 font-tamil text-sm hover:underline">
                {ta ? 'புதிய கடிதம் உருவாக்கு →' : 'Create new letter →'}
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {[
                      ta ? 'ஆவண ID' : 'Document ID',
                      ta ? 'பொருள்' : 'Subject',
                      ta ? 'சுயவிவரம்' : 'Profile',
                      ta ? 'நிலை' : 'Status',
                      ta ? 'நாள்' : 'Date',
                      ta ? 'செயல்கள்' : 'Actions',
                    ].map((h, i) => (
                      <th key={i} className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider font-tamil">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {letters.map(letter => (
                    <tr key={letter.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                          {letter.document_id}
                        </span>
                      </td>
                      <td className="px-5 py-4 max-w-xs">
                        <div className="font-tamil text-sm text-gray-900 truncate">
                          {letter.subject_ta || letter.subject_en || (ta ? '(பொருள் இல்லை)' : '(No subject)')}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm font-tamil text-gray-600 truncate max-w-[150px]">
                          {letter.profile_name_ta || letter.profile_name_en || '—'}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={statusBadgeClass[letter.status] || 'badge badge-gray'}>
                          {statusLabel(letter.status, ta)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500 font-tamil whitespace-nowrap">
                        {new Date(letter.created_at).toLocaleDateString(ta ? 'ta-IN' : 'en-IN')}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {letter.status !== 'revoked' && (
                            <button onClick={() => exportPDF(letter)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title={ta ? 'PDF பதிவிறக்கம்' : 'Export PDF'}>
                              <Download size={16} />
                            </button>
                          )}
                          {letter.status === 'finalized' && (
                            <button
                              onClick={() => { setRevokeModal(letter); setRevokeReason(''); }}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title={ta ? 'திரும்பப்பெறு' : 'Revoke'}>
                              <XCircle size={16} />
                            </button>
                          )}
                          <a href={`/verify/${letter.document_id}`} target="_blank" rel="noopener noreferrer"
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title={ta ? 'சரிபார்' : 'Verify'}>
                            <Eye size={16} />
                          </a>
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

      {/* Revoke Modal */}
      {revokeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-xl"><AlertTriangle size={24} className="text-red-600" /></div>
              <h3 className="text-lg font-bold font-tamil text-gray-900">
                {ta ? '⚠️ கடிதம் திரும்பப்பெறு' : '⚠️ Revoke Letter'}
              </h3>
            </div>
            <p className="text-sm text-gray-500 font-tamil mb-4">
              {ta
                ? `ஆவண ID: ${revokeModal.document_id} - இந்த கடிதம் திரும்பப்பெற்றால், QR சரிபார்ப்பு "திரும்பப்பெறப்பட்டது" காட்டும்.`
                : `Document ID: ${revokeModal.document_id} - After revocation, QR verification will show "Revoked".`}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 font-tamil mb-2">
                {ta ? 'திரும்பப்பெறுவதற்கான காரணம் *' : 'Reason for revocation *'}
              </label>
              <textarea
                value={revokeReason}
                onChange={e => setRevokeReason(e.target.value)}
                rows={3}
                className="input-field font-tamil text-sm"
                placeholder={ta ? 'காரணம் கொடுக்கவும்' : 'Provide reason'}
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRevokeModal(null)} className="btn-secondary flex-1 font-tamil">
                {ta ? 'ரத்து செய்' : 'Cancel'}
              </button>
              <button onClick={revoke} disabled={revoking}
                className="btn-danger flex-1 font-tamil flex items-center justify-center gap-2">
                {revoking ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                {ta ? 'திரும்பப்பெறு' : 'Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Letters;
