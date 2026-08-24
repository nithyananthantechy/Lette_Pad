// src/pages/AuditLog.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Clock, Monitor } from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../lib/api';
import toast from 'react-hot-toast';

const actionColors = {
  LOGIN_SUCCESS:     'badge-green',
  LOGIN_FAILED:      'badge-red',
  REGISTER:          'badge-blue',
  EMAIL_VERIFIED:    'badge-green',
  LOGIN_OTP_SENT:    'badge-blue',
  AI_GENERATE_LETTER:'badge-blue',
  SAVE_LETTER_DRAFT: 'badge-yellow',
  EXPORT_PDF:        'badge-blue',
  REVOKE_LETTER:     'badge-red',
  CREATE_PROFILE:    'badge-green',
  UPDATE_PROFILE:    'badge-yellow',
  DEACTIVATE_PROFILE:'badge-red',
  PASSWORD_RESET:    'badge-yellow',
};

const AuditLog = () => {
  const { i18n } = useTranslation();
  const ta = i18n.language === 'ta';
  const [logs, setLogs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]     = useState(0);
  const PAGE_SIZE = 25;

  useEffect(() => {
    api.get(`/audit?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`)
      .then(r => setLogs(r.data.logs || []))
      .catch(() => toast.error(ta ? 'தணிக்கை பதிவு ஏற்றுவதில் பிழை' : 'Failed to load audit logs'))
      .finally(() => setLoading(false));
  }, [page]);

  const actionLabel = (action) => {
    const labels = {
      LOGIN_SUCCESS: ta ? 'உள்நுழைவு வெற்றி' : 'Login Success',
      LOGIN_FAILED:  ta ? 'உள்நுழைவு தோல்வி' : 'Login Failed',
      REGISTER:      ta ? 'பதிவு' : 'Register',
      EMAIL_VERIFIED:ta ? 'மின்னஞ்சல் சரிபார்ப்பு' : 'Email Verified',
      AI_GENERATE_LETTER: ta ? 'AI கடிதம் தயாரிப்பு' : 'AI Letter Generated',
      SAVE_LETTER_DRAFT:  ta ? 'வரைவு சேமிப்பு' : 'Draft Saved',
      EXPORT_PDF:    ta ? 'PDF ஏற்றுமதி' : 'PDF Exported',
      REVOKE_LETTER: ta ? 'கடிதம் திரும்பப்பெறல்' : 'Letter Revoked',
      CREATE_PROFILE: ta ? 'சுயவிவரம் உருவாக்கம்' : 'Profile Created',
    };
    return labels[action] || action.replace(/_/g, ' ');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-purple-100 rounded-2xl">
            <Shield size={28} className="text-purple-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-tamil text-gray-900">
              {ta ? 'தணிக்கை பதிவு' : 'Audit Log'}
            </h1>
            <p className="text-gray-500 font-tamil text-sm mt-1">
              {ta ? 'உங்கள் கணக்கில் அனைத்து செயல்களும் பாதுகாப்பாக பதிவு செய்யப்படுகின்றன' : 'All actions on your account are securely recorded'}
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6 flex items-start gap-3">
          <Shield size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-green-700 font-tamil">
            <strong>{ta ? 'பாதுகாப்பு அறிவிப்பு: ' : 'Security Notice: '}</strong>
            {ta
              ? 'இந்த தணிக்கை பதிவு 7 ஆண்டுகள் பாதுகாப்பாக சேமிக்கப்படும். DPDP சட்டம் 2023 இணக்கம்.'
              : 'This audit log is retained for 7 years securely. Compliant with DPDP Act 2023.'}
          </div>
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-400 font-tamil">{ta ? 'ஏற்றுகிறது...' : 'Loading...'}</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <Shield size={48} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-tamil">{ta ? 'இன்னும் பதிவுகள் இல்லை' : 'No audit logs yet'}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {[
                        ta ? 'செயல்' : 'Action',
                        ta ? 'வகை' : 'Resource',
                        ta ? 'IP முகவரி' : 'IP Address',
                        ta ? 'நேரம்' : 'Time',
                      ].map((h, i) => (
                        <th key={i} className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider font-tamil">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {logs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4">
                          <span className={`badge ${actionColors[log.action] || 'badge-gray'} font-tamil text-xs`}>
                            {actionLabel(log.action)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm text-gray-500 font-tamil">
                            {log.resource_type || '—'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs font-mono text-gray-500 flex items-center gap-1">
                            <Monitor size={12} /> {log.ip_address || '—'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs text-gray-400 font-tamil flex items-center gap-1">
                            <Clock size={12} />
                            {new Date(log.created_at).toLocaleString(ta ? 'ta-IN' : 'en-IN')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500 font-tamil">
                  {ta ? `பக்கம் ${page + 1}` : `Page ${page + 1}`}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-4 py-2 text-sm border rounded-xl font-tamil disabled:opacity-40 hover:bg-gray-50 transition-colors">
                    {ta ? '← முந்தைய' : '← Prev'}
                  </button>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={logs.length < PAGE_SIZE}
                    className="px-4 py-2 text-sm border rounded-xl font-tamil disabled:opacity-40 hover:bg-gray-50 transition-colors">
                    {ta ? 'அடுத்தது →' : 'Next →'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLog;
