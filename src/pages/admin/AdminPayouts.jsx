import { useState, useEffect } from 'react';
import { fetchEligiblePayouts, fetchPayoutHistory, processPayout } from '../../api';

const AdminPayouts = () => {
  const [eligible, setEligible] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('eligible');

  // Payout modal state
  const [payoutModal, setPayoutModal] = useState(null); // partner object or null
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutNote, setPayoutNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [elig, hist] = await Promise.all([
        fetchEligiblePayouts(),
        fetchPayoutHistory(),
      ]);
      setEligible(elig);
      setHistory(hist);
    } catch (err) {
      console.error('Failed to load payout data:', err);
    } finally {
      setLoading(false);
    }
  };

  const openPayoutModal = (partner) => {
    setPayoutModal(partner);
    setPayoutAmount(partner.pendingCommission.toString());
    setPayoutNote('');
    setError('');
    setSuccess('');
  };

  const handlePayout = async () => {
    setError('');
    setSuccess('');

    const amount = Number(payoutAmount);
    if (!amount || amount <= 0) {
      setError('Enter a valid positive amount.');
      return;
    }
    if (amount > payoutModal.pendingCommission) {
      setError(`Amount exceeds pending commission (₹${payoutModal.pendingCommission}).`);
      return;
    }

    setProcessing(true);
    try {
      const res = await processPayout(payoutModal._id, amount, payoutNote);
      setSuccess(res.message);
      // Refresh data
      await loadData();
      // Close modal after short delay
      setTimeout(() => setPayoutModal(null), 1500);
    } catch (err) {
      setError(err.message || 'Payout failed.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500 font-pixel text-sm animate-pulse">Loading payouts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('eligible')}
          className={`px-4 py-2 font-pixel text-xs rounded-lg transition-all ${
            tab === 'eligible'
              ? 'bg-green-500/20 border border-green-500/50 text-green-400'
              : 'bg-dark-surface border border-white/10 text-gray-400 hover:text-white'
          }`}
        >
          💰 Eligible ({eligible.length})
        </button>
        <button
          onClick={() => setTab('history')}
          className={`px-4 py-2 font-pixel text-xs rounded-lg transition-all ${
            tab === 'history'
              ? 'bg-blue-500/20 border border-blue-500/50 text-blue-400'
              : 'bg-dark-surface border border-white/10 text-gray-400 hover:text-white'
          }`}
        >
          📜 History ({history.length})
        </button>
        <button
          onClick={loadData}
          className="ml-auto text-gray-500 hover:text-white text-xs transition-colors px-3 py-2"
        >
          ↻ Refresh
        </button>
      </div>

      {/* ─── Eligible Tab ──────────────────────────── */}
      {tab === 'eligible' && (
        <div className="bg-dark-surface border border-white/10 rounded-xl overflow-hidden">
          {eligible.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-16">
              No creators currently eligible for payout (threshold: ₹300).
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 text-left">
                    <th className="p-4 font-pixel text-xs">Creator</th>
                    <th className="p-4 font-pixel text-xs">Code</th>
                    <th className="p-4 font-pixel text-xs text-right">Uses</th>
                    <th className="p-4 font-pixel text-xs text-right">Revenue</th>
                    <th className="p-4 font-pixel text-xs text-right">Pending</th>
                    <th className="p-4 font-pixel text-xs text-right">Paid Out</th>
                    <th className="p-4 font-pixel text-xs text-center">Status</th>
                    <th className="p-4 font-pixel text-xs text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {eligible.map((p) => (
                    <tr key={p._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="text-white font-medium">{p.creatorName}</div>
                        <div className="text-gray-600 text-xs">{p.discordId}</div>
                      </td>
                      <td className="p-4 font-mono text-red-400 text-xs">{p.referralCode}</td>
                      <td className="p-4 text-right text-gray-300">{p.totalUses}</td>
                      <td className="p-4 text-right text-gray-300">₹{p.totalRevenueGenerated.toLocaleString('en-IN')}</td>
                      <td className="p-4 text-right text-green-400 font-semibold">₹{p.pendingCommission.toLocaleString('en-IN')}</td>
                      <td className="p-4 text-right text-gray-400">₹{p.totalPaidOut.toLocaleString('en-IN')}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${
                          p.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => openPayoutModal(p)}
                          className="px-3 py-1.5 text-xs font-pixel bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                        >
                          PAY
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── History Tab ───────────────────────────── */}
      {tab === 'history' && (
        <div className="bg-dark-surface border border-white/10 rounded-xl overflow-hidden">
          {history.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-16">
              No payouts processed yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 text-left">
                    <th className="p-4 font-pixel text-xs">Date</th>
                    <th className="p-4 font-pixel text-xs">Creator</th>
                    <th className="p-4 font-pixel text-xs">Code</th>
                    <th className="p-4 font-pixel text-xs text-right">Amount</th>
                    <th className="p-4 font-pixel text-xs">Processed By</th>
                    <th className="p-4 font-pixel text-xs">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((p) => (
                    <tr key={p._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(p.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                      </td>
                      <td className="p-4 text-white">{p.creatorName}</td>
                      <td className="p-4 font-mono text-red-400 text-xs">{p.referralCode}</td>
                      <td className="p-4 text-right text-green-400 font-semibold">₹{p.amount.toLocaleString('en-IN')}</td>
                      <td className="p-4 text-gray-400">{p.processedBy?.username || '—'}</td>
                      <td className="p-4 text-gray-500 text-xs max-w-50 truncate">{p.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Payout Modal ──────────────────────────── */}
      {payoutModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => !processing && setPayoutModal(null)}>
          <div className="bg-dark-surface border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-5" onClick={(e) => e.stopPropagation()}>
            <div>
              <h3 className="font-pixel text-sm text-green-400 mb-1">PROCESS PAYOUT</h3>
              <p className="text-gray-400 text-sm">
                {payoutModal.creatorName} — <span className="font-mono text-red-400">{payoutModal.referralCode}</span>
              </p>
            </div>

            <div className="bg-black/30 border border-white/5 rounded-lg p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Pending Commission</span>
                <span className="text-green-400 font-semibold">₹{payoutModal.pendingCommission.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Paid Out</span>
                <span className="text-gray-300">₹{payoutModal.totalPaidOut.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-xs block mb-1">Payout Amount (₹)</label>
              <input
                type="number"
                min="1"
                max={payoutModal.pendingCommission}
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-green-500/50 focus:outline-none transition-colors"
                placeholder="Enter amount"
              />
            </div>

            <div>
              <label className="text-gray-400 text-xs block mb-1">Note (optional)</label>
              <input
                type="text"
                value={payoutNote}
                onChange={(e) => setPayoutNote(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-white/30 focus:outline-none transition-colors"
                placeholder="e.g. UPI transfer, bank transfer"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg p-3">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-xs rounded-lg p-3">
                {success}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => !processing && setPayoutModal(null)}
                className="flex-1 py-2.5 text-xs font-pixel bg-white/5 border border-white/10 text-gray-400 rounded-lg hover:bg-white/10 transition-colors"
                disabled={processing}
              >
                CANCEL
              </button>
              <button
                onClick={handlePayout}
                disabled={processing || !!success}
                className="flex-1 py-2.5 text-xs font-pixel bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
              >
                {processing ? 'PROCESSING...' : `PAY ₹${Number(payoutAmount || 0).toLocaleString('en-IN')}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayouts;
