// src/pages/Verify.jsx — Public Document Verification Page
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, AlertTriangle, Shield, ArrowLeft } from 'lucide-react';
import api from '../lib/api';

const Verify = () => {
  const { documentId } = useParams();
  const { i18n } = useTranslation();
  const ta = i18n.language === 'ta';

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/verify/${documentId}`)
      .then(r => setResult(r.data))
      .catch(() => setResult({ valid: false, message: ta ? 'சரிபார்ப்பு தோல்வி' : 'Verification failed' }))
      .finally(() => setLoading(false));
  }, [documentId]);

  const statusConfig = {
    valid:    { icon: <CheckCircle size={64} className="text-green-500" />, bg: 'bg-green-50', border: 'border-green-200', title: ta ? '✅ உண்மையான ஆவணம்' : '✅ Authentic Document', text: 'text-green-800' },
    revoked:  { icon: <AlertTriangle size={64} className="text-red-500" />, bg: 'bg-red-50', border: 'border-red-200', title: ta ? '⚠️ திரும்பப்பெறப்பட்டது' : '⚠️ Document Revoked', text: 'text-red-800' },
    invalid:  { icon: <XCircle size={64} className="text-gray-400" />, bg: 'bg-gray-50', border: 'border-gray-200', title: ta ? '❌ கண்டுபிடிக்கப்படவில்லை' : '❌ Not Found', text: 'text-gray-700' },
  };

  const status = result?.valid ? 'valid' : result?.status === 'revoked' ? 'revoked' : 'invalid';
  const cfg = statusConfig[status];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col">
      {/* Header */}
      <div className="bg-[#1a1a2e] text-white px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🏛️</div>
          <div>
            <div className="font-bold">AI Letter Pad</div>
            <div className="text-blue-300 text-xs font-tamil">ஆவண சரிபார்ப்பு</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-blue-300">
          <Shield size={14} /> {ta ? 'பாதுகாப்பான சரிபார்ப்பு' : 'Secure Verification'}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-lg">
          {loading ? (
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#1a1a2e] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-tamil text-lg">{ta ? 'ஆவணம் சரிபார்க்கிறது...' : 'Verifying document...'}</p>
              <p className="text-gray-400 text-sm font-tamil mt-1">{documentId}</p>
            </div>
          ) : (
            <div className={`bg-white rounded-3xl shadow-2xl overflow-hidden border-2 ${cfg.border}`}>
              {/* Status Header */}
              <div className={`${cfg.bg} p-8 text-center border-b ${cfg.border}`}>
                <div className="flex justify-center mb-4">{cfg.icon}</div>
                <h1 className={`text-2xl font-bold font-tamil ${cfg.text}`}>{cfg.title}</h1>
                <p className="text-gray-600 font-tamil mt-2 text-sm">{result?.message}</p>
              </div>

              {/* Document Details */}
              {result?.document && (
                <div className="p-6 space-y-4">
                  <h2 className="font-bold text-gray-900 font-tamil text-lg mb-4 pb-3 border-b border-gray-100">
                    📄 {ta ? 'ஆவண விவரங்கள்' : 'Document Details'}
                  </h2>

                  {[
                    { label: ta ? 'ஆவண ID' : 'Document ID', value: result.document.document_id, mono: true },
                    { label: ta ? 'வழங்கியவர்' : 'Issued By', value: result.document.issued_by_ta || result.document.issued_by_en },
                    { label: ta ? 'பதவி' : 'Designation', value: result.document.designation },
                    { label: ta ? 'கட்சி' : 'Party', value: result.document.party_ta || result.document.party_en },
                    { label: ta ? 'பொருள்' : 'Subject', value: result.document.subject },
                    { label: ta ? 'உருவாக்கிய நேரம்' : 'Created At', value: result.document.created_at ? new Date(result.document.created_at).toLocaleString(ta ? 'ta-IN' : 'en-IN') : null },
                    { label: ta ? 'இறுதியாக்கப்பட்ட நேரம்' : 'Finalized At', value: result.document.finalized_at ? new Date(result.document.finalized_at).toLocaleString(ta ? 'ta-IN' : 'en-IN') : null },
                    result.document.revoked_at && { label: ta ? 'திரும்பப்பெறப்பட்ட நேரம்' : 'Revoked At', value: new Date(result.document.revoked_at).toLocaleString(ta ? 'ta-IN' : 'en-IN'), danger: true },
                    result.document.revoked_reason && { label: ta ? 'திரும்பப்பெறும் காரணம்' : 'Revoke Reason', value: result.document.revoked_reason, danger: true },
                  ].filter(Boolean).map((item, i) => item.value && (
                    <div key={i} className="flex items-start justify-between py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-500 font-tamil flex-shrink-0 w-40">{item.label}</span>
                      <span className={`text-sm font-tamil text-right ${item.mono ? 'font-mono text-blue-600' : item.danger ? 'text-red-600 font-semibold' : 'text-gray-900 font-medium'}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}

                  {/* Hash */}
                  {result.document.document_hash && (
                    <div className="bg-gray-50 rounded-xl p-3 mt-4">
                      <p className="text-xs text-gray-400 font-tamil mb-1">{ta ? 'ஆவண ஒருமைப்பாடு (SHA-256)' : 'Document Integrity (SHA-256)'}</p>
                      <p className="text-xs font-mono text-gray-600 break-all">{result.document.document_hash}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="px-6 pb-6">
                <Link to="/"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[#1a1a2e] text-white rounded-xl font-tamil text-sm hover:bg-[#16213e] transition-colors">
                  <ArrowLeft size={16} /> {ta ? 'முகப்பு திரும்பு' : 'Back to Home'}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Verify;
