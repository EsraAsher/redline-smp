import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreatorAuth } from '../context/CreatorAuthContext';
import { fetchCreatorDashboard, fetchCreatorInsights, fetchCreatorPayoutStatus, submitCreatorPayoutRequest } from '../api';

// ─── Helpers ────────────────────────────────────────────
function getSessionExpiry() {
  try {
    const token = localStorage.getItem('creator_token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return new Date(payload.exp * 1000);
  } catch { return null; }
}

function formatExpiry(date) {
  if (!date) return null;
  const diff = date - Date.now();
  if (diff <= 0) return 'Expired';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 1) return `Valid for ${days} more days`;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours > 0) return `Expires in ${hours} hours`;
  return 'Expiring soon';
}

// ─── Sub-components ──────────────────────────────────────
const StatCard = ({ label, value, accent = false, sub = '' }) => (
  <div className="bg-dark-surface border border-white/10 rounded-xl p-5">
    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">{label}</p>
    <p className={`text-2xl font-bold ${accent ? 'text-red-400' : 'text-white'}`}>{value}</p>
    {sub && <p className="text-gray-600 text-xs mt-1">{sub}</p>}
  </div>
);

const Toast = ({ toasts }) => (
  <div className="fixed top-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
    {toasts.map((t) => (
      <div
        key={t.id}
        className="bg-dark-surface border border-green-500/40 text-green-400 text-xs px-4 py-2.5 rounded-lg shadow-xl animate-fade-in"
      >
        {t.msg}
      </div>
    ))}
  </div>
);

// ─── Payout Request Modal ────────────────────────────────
const PayoutRequestModal = ({ pendingCommission, onClose, onSuccess }) => {
  const [method, setMethod] = useState('upi');
  const [realName, setRealName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [qrImageUrl, setQrImageUrl] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!realName.trim()) return setError('Real name is required.');
    if (!confirmed) return setError('Please confirm the details are correct.');

    let payoutDetails = {};
    if (method === 'upi') {
      if (!upiId.trim()) return setError('UPI ID is required.');
      payoutDetails = { upiId: upiId.trim() };
    } else if (method === 'bank') {
      if (!accountNumber.trim() || !ifscCode.trim() || !accountHolderName.trim()) {
        return setError('All bank details are required.');
      }
      payoutDetails = {
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim().toUpperCase(),
        accountHolderName: accountHolderName.trim(),
      };
    } else if (method === 'qr') {
      if (!qrImageUrl.trim()) return setError('QR code image URL is required.');
      payoutDetails = { qrImageUrl: qrImageUrl.trim() };
    }

    setSubmitting(true);
    try {
      const res = await submitCreatorPayoutRequest({
        realName: realName.trim(),
        method,
        payoutDetails,
      });
      onSuccess(res.request);
    } catch (err) {
      setError(err.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  const methods = [
    { id: 'upi', label: 'UPI', icon: '📱' },
    { id: 'bank', label: 'Bank Transfer', icon: '🏦' },
    { id: 'qr', label: 'QR Code', icon: '📷' },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => !submitting && onClose()}>
      <div className="bg-dark-surface border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div>
          <h3 className="font-pixel text-sm text-green-400 mb-1">REQUEST PAYOUT</h3>
          <p className="text-gray-400 text-sm">
            Amount: <span className="text-green-400 font-semibold">₹{pendingCommission.toLocaleString('en-IN')}</span>
            <span className="text-gray-600 text-xs ml-2">(full pending balance)</span>
          </p>
        </div>

        {/* Real Name */}
        <div>
          <label className="text-gray-400 text-xs block mb-1">Real Name *</label>
          <input
            type="text"
            value={realName}
            onChange={(e) => setRealName(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-green-500/50 focus:outline-none transition-colors"
            placeholder="Your legal name (for payment verification)"
          />
        </div>

        {/* Payment Method */}
        <div>
          <label className="text-gray-400 text-xs block mb-2">Payment Method *</label>
          <div className="flex gap-2">
            {methods.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`flex-1 py-2.5 text-xs rounded-lg border transition-all ${
                  method === m.id
                    ? 'bg-green-500/20 border-green-500/50 text-green-400'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                <span className="block text-base mb-0.5">{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* UPI Fields */}
        {method === 'upi' && (
          <div>
            <label className="text-gray-400 text-xs block mb-1">UPI ID *</label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-green-500/50 focus:outline-none transition-colors"
              placeholder="yourname@upi"
            />
          </div>
        )}

        {/* Bank Fields */}
        {method === 'bank' && (
          <div className="space-y-3">
            <div>
              <label className="text-gray-400 text-xs block mb-1">Account Holder Name *</label>
              <input
                type="text"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-green-500/50 focus:outline-none transition-colors"
                placeholder="Name on bank account"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs block mb-1">Account Number *</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-green-500/50 focus:outline-none transition-colors"
                placeholder="Bank account number"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs block mb-1">IFSC Code *</label>
              <input
                type="text"
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-green-500/50 focus:outline-none transition-colors uppercase"
                placeholder="e.g. SBIN0001234"
              />
            </div>
          </div>
        )}

        {/* QR Fields */}
        {method === 'qr' && (
          <div>
            <label className="text-gray-400 text-xs block mb-1">QR Code Image URL *</label>
            <input
              type="url"
              value={qrImageUrl}
              onChange={(e) => setQrImageUrl(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-green-500/50 focus:outline-none transition-colors"
              placeholder="https://... (upload to imgur, etc.)"
            />
            <p className="text-gray-600 text-xs mt-1">Upload your payment QR to any image host and paste the link</p>
            {qrImageUrl && (
              <div className="mt-2 bg-black/30 border border-white/10 rounded-lg p-2 flex justify-center">
                <img src={qrImageUrl} alt="QR Preview" className="max-h-32 rounded" onError={(e) => e.target.style.display = 'none'} />
              </div>
            )}
          </div>
        )}

        {/* Confirmation */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 accent-green-500"
          />
          <span className="text-xs text-gray-400">
            I confirm the payment details are correct. Incorrect details may delay my payout.
          </span>
        </label>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg p-3">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => !submitting && onClose()}
            disabled={submitting}
            className="flex-1 py-2.5 text-xs font-pixel bg-white/5 border border-white/10 text-gray-400 rounded-lg hover:bg-white/10 transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !confirmed}
            className="flex-1 py-2.5 text-xs font-pixel bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
          >
            {submitting ? 'SUBMITTING...' : `REQUEST ₹${pendingCommission.toLocaleString('en-IN')}`}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Page ────────────────────────────────────────────────
const CreatorDashboardPage = () => {
  const { creator, loading: authLoading, logout } = useCreatorAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [insights, setInsights] = useState(null);
  const [payoutStatus, setPayoutStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toasts, setToasts] = useState([]);
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  const showToast = useCallback((msg) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2500);
  }, []);

  const copyToClipboard = useCallback((text, label) => {
    navigator.clipboard.writeText(text).then(() => showToast(`${label} copied!`));
  }, [showToast]);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !creator) {
      navigate('/creator/login', { replace: true });
    }
  }, [creator, authLoading, navigate]);

  // Load data
  useEffect(() => {
    if (!creator) return;
    (async () => {
      try {
        const [dashRes, insightsRes, payoutRes] = await Promise.allSettled([
          fetchCreatorDashboard(),
          fetchCreatorInsights(),
          fetchCreatorPayoutStatus(),
        ]);
        if (dashRes.status === 'fulfilled') setData(dashRes.value);
        else throw new Error(dashRes.reason?.message || 'Failed to load dashboard.');
        if (insightsRes.status === 'fulfilled') setInsights(insightsRes.value);
        if (payoutRes.status === 'fulfilled') setPayoutStatus(payoutRes.value?.request || null);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    })();
  }, [creator]);

  const handleLogout = () => {
    logout();
    navigate('/creator/login', { replace: true });
  };

  // ── Loading ──
  if (authLoading || loading) {
    return (
      <main className="relative z-10 pt-24 pb-20 px-4 max-w-4xl mx-auto min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-400 text-sm">Loading dashboard…</p>
        </div>
      </main>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <main className="relative z-10 pt-24 pb-20 px-4 max-w-md mx-auto min-h-screen">
        <div className="bg-dark-surface border border-red-500/30 rounded-2xl p-8 text-center space-y-4">
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={handleLogout} className="text-gray-400 text-xs hover:text-white underline">
            Sign out &amp; try again
          </button>
        </div>
      </main>
    );
  }

  // ── Banned ──
  if (data?.status === 'banned') {
    return (
      <main className="relative z-10 pt-24 pb-20 px-4 max-w-md mx-auto min-h-screen">
        <div className="bg-dark-surface border border-red-500/30 rounded-2xl p-8 text-center space-y-4">
          <div className="text-4xl">🚫</div>
          <h1 className="font-pixel text-lg text-red-400">ACCOUNT BANNED</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Your referral partner account has been banned. If you believe this is a mistake, please open a support ticket on our Discord.
          </p>
          <button onClick={handleLogout} className="text-gray-500 text-xs hover:text-white underline">Sign out</button>
        </div>
      </main>
    );
  }

  // ── Paused ──
  if (data?.status === 'paused') {
    return (
      <main className="relative z-10 pt-24 pb-20 px-4 max-w-lg mx-auto min-h-screen">
        <div className="bg-dark-surface border border-yellow-500/30 rounded-2xl p-8 text-center space-y-4">
          <div className="text-4xl">⏸️</div>
          <h1 className="font-pixel text-lg text-yellow-400">ACCOUNT PAUSED</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Your referral code is currently paused. Customers cannot use it until an admin reactivates it.
          </p>
          <button onClick={handleLogout} className="text-gray-500 text-xs hover:text-white underline">Sign out</button>
        </div>
      </main>
    );
  }

  // ── Derived values ──
  const storeLink = `https://store.redlinesmp.fun/?ref=${data?.referralCode}`;
  const payoutPct = Math.min(100, Math.round(((data?.pendingCommission ?? 0) / (data?.payoutThreshold ?? 300)) * 100));
  const sessionExpiry = getSessionExpiry();
  const sessionLabel = formatExpiry(sessionExpiry);

  return (
    <>
      <Toast toasts={toasts} />
      <main className="relative z-10 pt-24 sm:pt-28 pb-20 px-4 max-w-4xl mx-auto min-h-screen">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-pixel text-lg sm:text-xl text-red-400 drop-shadow-[0_0_10px_rgba(255,0,0,0.5)]">
              CREATOR DASHBOARD
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Welcome back, <span className="text-white font-medium">{data?.creatorName}</span>
            </p>
            {data?.discordUsername && (
              <p className="text-gray-600 text-xs mt-0.5 flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 71 55" fill="currentColor" className="text-[#5865F2] shrink-0">
                  <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4832 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978Z"/>
                </svg>
                <span className="text-[#5865F2]">{data.discordUsername}</span>
                {sessionLabel && (
                  <span className="text-gray-600">· {sessionLabel}</span>
                )}
              </p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-500 text-xs hover:text-red-400 transition-colors border border-white/10 rounded-lg px-4 py-2 self-start"
          >
            Sign out
          </button>
        </div>

        {/* ── Referral Code Card ── */}
        <div className="bg-dark-surface border border-red-500/20 rounded-2xl p-6 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Your Referral Code</p>
              <p className="text-2xl font-bold text-red-400 font-mono tracking-wider">{data?.referralCode}</p>
              <p className="text-gray-500 text-xs mt-1.5">
                {data?.discountPercent}% off for customers · {data?.commissionPercent}% commission for you
              </p>
            </div>
            <button
              onClick={() => copyToClipboard(data?.referralCode, 'Code')}
              className="flex items-center gap-2 text-xs text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-4 py-2.5 transition-all self-start sm:self-center"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Code
            </button>
          </div>
        </div>

        {/* ── Shareable Store Link ── */}
        <div className="bg-dark-surface border border-white/10 rounded-2xl p-6 mb-4">
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Your Shareable Store Link</p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <code className="flex-1 text-xs text-gray-300 bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 truncate">
              {storeLink}
            </code>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => copyToClipboard(storeLink, 'Store link')}
                className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </button>
              <a
                href={storeLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open
              </a>
            </div>
          </div>
        </div>

        {/* ── Payout Progress Bar ── */}
        <div className="bg-dark-surface border border-white/10 rounded-2xl p-6 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-500 text-xs uppercase tracking-wider">Payout Progress</p>
            <span className="text-xs text-gray-400">
              ₹{(data?.pendingCommission ?? 0).toLocaleString('en-IN')} / ₹{(data?.payoutThreshold ?? 300).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${payoutPct >= 100 ? 'bg-green-500' : 'bg-red-500'}`}
              style={{ width: `${payoutPct}%` }}
            />
          </div>

          {/* Payout status / request button */}
          {payoutStatus && ['pending', 'processing'].includes(payoutStatus.status) ? (
            <div className="mt-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${payoutStatus.status === 'pending' ? 'bg-yellow-400 animate-pulse' : 'bg-blue-400 animate-pulse'}`} />
                <span className="text-xs text-yellow-300 font-medium">
                  {payoutStatus.status === 'pending' ? 'Payout request pending review' : 'Payout being processed'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Amount: ₹{payoutStatus.amount?.toLocaleString('en-IN')} · Requested {new Date(payoutStatus.requestedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </p>
            </div>
          ) : payoutStatus && payoutStatus.status === 'rejected' ? (
            <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-xs text-red-400 font-medium">Last payout request was rejected</p>
              {payoutStatus.rejectionReason && (
                <p className="text-xs text-gray-500 mt-0.5">Reason: {payoutStatus.rejectionReason}</p>
              )}
              {payoutPct >= 100 && data?.status === 'active' && (
                <button
                  onClick={() => setShowPayoutModal(true)}
                  className="mt-2 text-xs font-pixel bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg px-4 py-1.5 hover:bg-green-500/30 transition-colors"
                >
                  REQUEST PAYOUT AGAIN
                </button>
              )}
            </div>
          ) : (
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-gray-600">
                {payoutPct >= 100
                  ? '✅ You\'re eligible for a payout!'
                  : `₹${Math.max(0, (data?.payoutThreshold ?? 300) - (data?.pendingCommission ?? 0)).toLocaleString('en-IN')} more to reach payout threshold`}
              </p>
              {payoutPct >= 100 && data?.status === 'active' && (
                <button
                  onClick={() => setShowPayoutModal(true)}
                  className="text-xs font-pixel bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg px-4 py-2 hover:bg-green-500/30 transition-colors"
                >
                  REQUEST PAYOUT
                </button>
              )}
            </div>
          )}

          {payoutStatus && payoutStatus.status === 'completed' && payoutStatus.transactionId && (
            <div className="mt-3 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <p className="text-xs text-green-400 font-medium">Last payout completed ✓</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Txn: {payoutStatus.transactionId} · {new Date(payoutStatus.processedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              {payoutPct >= 100 && data?.status === 'active' && (
                <button
                  onClick={() => setShowPayoutModal(true)}
                  className="mt-2 text-xs font-pixel bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg px-4 py-1.5 hover:bg-green-500/30 transition-colors"
                >
                  REQUEST NEW PAYOUT
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <StatCard label="Total Uses" value={data?.totalUses ?? 0} />
          <StatCard
            label="Revenue Generated"
            value={`₹${(data?.totalRevenueGenerated ?? 0).toLocaleString('en-IN')}`}
          />
          <StatCard
            label="Total Commission"
            value={`₹${(data?.totalCommissionEarned ?? 0).toLocaleString('en-IN')}`}
          />
          <StatCard
            label="Pending Payout"
            value={`₹${(data?.pendingCommission ?? 0).toLocaleString('en-IN')}`}
            accent
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <StatCard
            label="Total Paid Out"
            value={`₹${(data?.totalPaidOut ?? 0).toLocaleString('en-IN')}`}
          />
          <StatCard
            label="Code Status"
            value={data?.status === 'active' ? '🟢 Active' : data?.status}
          />
        </div>

        {/* ── Performance Insights ── */}
        {insights && (
          <div className="bg-dark-surface border border-white/10 rounded-2xl p-6 mb-4">
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-4">Performance Insights</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600 text-xs mb-1">Uses — last 7 days</p>
                <p className="text-xl font-bold text-white">{insights.last7DaysUses}</p>
              </div>
              <div>
                <p className="text-gray-600 text-xs mb-1">Revenue — last 30 days</p>
                <p className="text-xl font-bold text-white">₹{(insights.last30DaysRevenue ?? 0).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Code Settings (read-only, only if limits are set) ── */}
        {(data?.maxUses || data?.expiresAt) && (
          <div className="bg-dark-surface border border-white/10 rounded-2xl p-6 mb-4">
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">Code Settings</p>
            <div className="space-y-2 text-sm">
              {data?.maxUses && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Max uses</span>
                  <span className="text-white font-mono">{data.totalUses} / {data.maxUses}</span>
                </div>
              )}
              {data?.expiresAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Code expires</span>
                  <span className="text-white">{new Date(data.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Creator Guidelines ── */}
        <div className="bg-dark-surface border border-white/10 rounded-2xl p-6 mb-4">
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-4">Creator Guidelines</p>
          <ul className="space-y-2.5 text-sm text-gray-400">
            {[
              'Share your referral code or store link only with your own audience.',
              'Do not incentivise purchases beyond the built-in discount.',
              'Self-use of your own code is not permitted and will be flagged.',
              'Commissions are reviewed before each payout — fraudulent activity voids earnings.',
              'Maintain a respectful and positive presence when representing Redline SMP.',
              'Contact an admin if your code needs to be updated or if you have payout questions.',
            ].map((rule, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-red-500/60 mt-0.5 shrink-0">›</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Creator Hub ── */}
        <div className="bg-dark-surface border border-[#5865F2]/30 rounded-2xl p-6">
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Creator Hub</p>
          <p className="text-gray-400 text-sm mb-5">
            Join our exclusive Creator Discord channel for announcements, early access, and direct support from the Redline SMP team.
          </p>
          <a
            href="https://discord.redlinesmp.fun"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 py-3 px-6 bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold text-sm rounded-lg transition-all duration-200 shadow-[0_0_20px_rgba(88,101,242,0.25)] hover:shadow-[0_0_30px_rgba(88,101,242,0.4)]"
          >
            <svg width="18" height="14" viewBox="0 0 71 55" fill="currentColor">
              <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4832 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978Z"/>
            </svg>
            Join RedLine Creator Discord
          </a>
        </div>

      </main>

      {/* ── Payout Request Modal ── */}
      {showPayoutModal && (
        <PayoutRequestModal
          pendingCommission={data?.pendingCommission ?? 0}
          onClose={() => setShowPayoutModal(false)}
          onSuccess={(req) => {
            setPayoutStatus(req);
            setShowPayoutModal(false);
            showToast('Payout request submitted!');
          }}
        />
      )}
    </>
  );
};

export default CreatorDashboardPage;
