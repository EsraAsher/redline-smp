import { useState, useEffect } from 'react';
import {
  fetchEligiblePayouts,
  fetchPayoutHistory,
  processPayout,
  fetchPayoutRequests,
  markPayoutRequestProcessing,
  completePayoutRequest,
  rejectPayoutRequest,
  fetchSettings,
  updateSettings,
} from '../../api';

const AdminPayouts = () => {
  const [eligible, setEligible] = useState([]);
  const [history, setHistory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('requests');

  // Payout modal state
  const [payoutModal, setPayoutModal] = useState(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutNote, setPayoutNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Request action state
  const [actionModal, setActionModal] = useState(null); // { request, action: 'complete'|'reject' }
  const [txnId, setTxnId] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [actionProcessing, setActionProcessing] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Settings state
  const [threshold, setThreshold] = useState(300);
  const [editingThreshold, setEditingThreshold] = useState(false);
  const [newThreshold, setNewThreshold] = useState('');
  const [thresholdSaving, setThresholdSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [elig, hist, reqs, settings] = await Promise.all([
        fetchEligiblePayouts(),
        fetchPayoutHistory(),
        fetchPayoutRequests(),
        fetchSettings(),
      ]);
      setEligible(elig);
      setHistory(hist);
      setRequests(reqs);
      if (settings?.globalPayoutThreshold) {
        setThreshold(settings.globalPayoutThreshold);
      }
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
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTab('requests')}
          className={`px-4 py-2 font-pixel text-xs rounded-lg transition-all ${
            tab === 'requests'
              ? 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-400'
              : 'bg-dark-surface border border-white/10 text-gray-400 hover:text-white'
          }`}
        >
          📨 Requests ({requests.length})
        </button>
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
        <div className="ml-auto flex items-center gap-3">
          {/* Threshold control */}
          <div className="flex items-center gap-2">
            {editingThreshold ? (
              <>
                <span className="text-gray-500 text-xs">Threshold: ₹</span>
                <input
                  type="number"
                  className="w-20 bg-black/30 border border-white/10 rounded px-2 py-1 text-white text-xs focus:border-green-500/50 focus:outline-none"
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(e.target.value)}
                  min="0"
                />
                <button
                  onClick={async () => {
                    const val = Number(newThreshold);
                    if (!val || val < 0) return;
                    setThresholdSaving(true);
                    try {
                      await updateSettings({ globalPayoutThreshold: val });
                      setThreshold(val);
                      setEditingThreshold(false);
                    } catch {}
                    setThresholdSaving(false);
                  }}
                  disabled={thresholdSaving}
                  className="text-green-400 text-xs hover:text-green-300"
                >
                  {thresholdSaving ? '...' : '✓'}
                </button>
                <button onClick={() => setEditingThreshold(false)} className="text-gray-500 text-xs hover:text-white">✕</button>
              </>
            ) : (
              <button
                onClick={() => { setNewThreshold(threshold.toString()); setEditingThreshold(true); }}
                className="text-gray-500 text-xs hover:text-white transition-colors"
                title="Edit payout threshold"
              >
                Threshold: ₹{threshold}  ✎
              </button>
            )}
          </div>
          <button
            onClick={loadData}
            className="text-gray-500 hover:text-white text-xs transition-colors px-3 py-2"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* ─── Eligible Tab ──────────────────────────── */}
      {tab === 'eligible' && (
        <div className="bg-dark-surface border border-white/10 rounded-xl overflow-hidden">
          {eligible.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-16">
              No creators currently eligible for payout (threshold: ₹{threshold}).
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

      {/* ─── Requests Tab ──────────────────────────── */}
      {tab === 'requests' && (
        <div className="bg-dark-surface border border-white/10 rounded-xl overflow-hidden">
          {requests.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-16">
              No pending payout requests.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 text-left">
                    <th className="p-4 font-pixel text-xs">Requested</th>
                    <th className="p-4 font-pixel text-xs">Creator</th>
                    <th className="p-4 font-pixel text-xs">Real Name</th>
                    <th className="p-4 font-pixel text-xs text-right">Amount</th>
                    <th className="p-4 font-pixel text-xs">Method</th>
                    <th className="p-4 font-pixel text-xs">Details</th>
                    <th className="p-4 font-pixel text-xs text-center">Status</th>
                    <th className="p-4 font-pixel text-xs text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(r.requestedAt).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td className="p-4">
                        <div className="text-white font-medium">{r.creatorName}</div>
                        <div className="text-gray-600 text-xs font-mono">{r.referralCode}</div>
                      </td>
                      <td className="p-4 text-gray-300 text-xs">{r.realName}</td>
                      <td className="p-4 text-right text-green-400 font-semibold">₹{r.amount.toLocaleString('en-IN')}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded text-xs bg-white/5 border border-white/10 text-gray-300 uppercase">
                          {r.method}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-gray-400 max-w-48">
                        {r.method === 'upi' && r.payoutDetails?.upiId && (
                          <span className="font-mono">{r.payoutDetails.upiId}</span>
                        )}
                        {r.method === 'bank' && r.payoutDetails && (
                          <div className="space-y-0.5">
                            <div>{r.payoutDetails.accountHolderName}</div>
                            <div className="font-mono text-gray-500">{r.payoutDetails.accountNumber}</div>
                            <div className="text-gray-500">IFSC: {r.payoutDetails.ifscCode}</div>
                          </div>
                        )}
                        {r.method === 'qr' && (r.qrImageUrl || r.payoutDetails?.qrImageUrl) && (
                          <a
                            href={r.qrImageUrl || r.payoutDetails.qrImageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 underline"
                          >
                            View QR
                          </a>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${
                          r.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          r.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
                          r.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {r.status === 'pending' && (
                            <>
                              <button
                                onClick={async () => {
                                  try {
                                    await markPayoutRequestProcessing(r._id);
                                    await loadData();
                                  } catch (err) {
                                    console.error(err);
                                  }
                                }}
                                className="px-2 py-1 text-xs bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                                title="Mark as processing"
                              >
                                ⏳
                              </button>
                              <button
                                onClick={() => { setActionModal({ request: r, action: 'complete' }); setTxnId(''); setActionError(''); setActionSuccess(''); }}
                                className="px-2 py-1 text-xs bg-green-500/20 border border-green-500/30 text-green-400 rounded hover:bg-green-500/30 transition-colors"
                                title="Complete payout"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => { setActionModal({ request: r, action: 'reject' }); setRejectReason(''); setActionError(''); setActionSuccess(''); }}
                                className="px-2 py-1 text-xs bg-red-500/20 border border-red-500/30 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                                title="Reject request"
                              >
                                ✕
                              </button>
                            </>
                          )}
                          {r.status === 'processing' && (
                            <>
                              <button
                                onClick={() => { setActionModal({ request: r, action: 'complete' }); setTxnId(''); setActionError(''); setActionSuccess(''); }}
                                className="px-2 py-1 text-xs bg-green-500/20 border border-green-500/30 text-green-400 rounded hover:bg-green-500/30 transition-colors"
                                title="Complete payout"
                              >
                                ✓ Complete
                              </button>
                              <button
                                onClick={() => { setActionModal({ request: r, action: 'reject' }); setRejectReason(''); setActionError(''); setActionSuccess(''); }}
                                className="px-2 py-1 text-xs bg-red-500/20 border border-red-500/30 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                                title="Reject request"
                              >
                                ✕
                              </button>
                            </>
                          )}
                        </div>
                      </td>
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

      {/* ─── Request Action Modal (Complete / Reject) ──── */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => !actionProcessing && setActionModal(null)}>
          <div className="bg-dark-surface border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-5" onClick={(e) => e.stopPropagation()}>
            <div>
              <h3 className={`font-pixel text-sm mb-1 ${actionModal.action === 'complete' ? 'text-green-400' : 'text-red-400'}`}>
                {actionModal.action === 'complete' ? 'COMPLETE PAYOUT' : 'REJECT REQUEST'}
              </h3>
              <p className="text-gray-400 text-sm">
                {actionModal.request.creatorName} — <span className="font-mono text-red-400">{actionModal.request.referralCode}</span>
              </p>
            </div>

            <div className="bg-black/30 border border-white/5 rounded-lg p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Amount</span>
                <span className="text-green-400 font-semibold">₹{actionModal.request.amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Method</span>
                <span className="text-gray-300 uppercase">{actionModal.request.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Real Name</span>
                <span className="text-gray-300">{actionModal.request.realName}</span>
              </div>
              {actionModal.request.method === 'upi' && actionModal.request.payoutDetails?.upiId && (
                <div className="flex justify-between">
                  <span className="text-gray-500">UPI ID</span>
                  <span className="text-gray-300 font-mono">{actionModal.request.payoutDetails.upiId}</span>
                </div>
              )}
              {actionModal.request.method === 'bank' && actionModal.request.payoutDetails && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Account</span>
                    <span className="text-gray-300 font-mono">{actionModal.request.payoutDetails.accountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">IFSC</span>
                    <span className="text-gray-300 font-mono">{actionModal.request.payoutDetails.ifscCode}</span>
                  </div>
                </>
              )}
              {actionModal.request.method === 'qr' && (actionModal.request.qrImageUrl || actionModal.request.payoutDetails?.qrImageUrl) && (
                <div className="text-center pt-2">
                  <img
                    src={actionModal.request.qrImageUrl || actionModal.request.payoutDetails.qrImageUrl}
                    alt="QR Code"
                    className="max-h-40 mx-auto rounded border border-white/10"
                  />
                </div>
              )}
            </div>

            {actionModal.action === 'complete' ? (
              <div>
                <label className="text-gray-400 text-xs block mb-1">Transaction ID / Reference *</label>
                <input
                  type="text"
                  value={txnId}
                  onChange={(e) => setTxnId(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-green-500/50 focus:outline-none transition-colors"
                  placeholder="Enter transaction ID or payment reference"
                />
              </div>
            ) : (
              <div>
                <label className="text-gray-400 text-xs block mb-1">Rejection Reason (optional)</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-red-500/50 focus:outline-none transition-colors resize-none"
                  rows={3}
                  placeholder="Reason for rejection..."
                />
              </div>
            )}

            {actionError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg p-3">
                {actionError}
              </div>
            )}
            {actionSuccess && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-xs rounded-lg p-3">
                {actionSuccess}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => !actionProcessing && setActionModal(null)}
                className="flex-1 py-2.5 text-xs font-pixel bg-white/5 border border-white/10 text-gray-400 rounded-lg hover:bg-white/10 transition-colors"
                disabled={actionProcessing}
              >
                CANCEL
              </button>
              <button
                onClick={async () => {
                  setActionError('');
                  setActionSuccess('');
                  setActionProcessing(true);
                  try {
                    if (actionModal.action === 'complete') {
                      if (!txnId.trim()) { setActionError('Transaction ID is required.'); setActionProcessing(false); return; }
                      const res = await completePayoutRequest(actionModal.request._id, txnId.trim());
                      setActionSuccess(res.message);
                    } else {
                      const res = await rejectPayoutRequest(actionModal.request._id, rejectReason.trim());
                      setActionSuccess(res.message);
                    }
                    await loadData();
                    setTimeout(() => setActionModal(null), 1500);
                  } catch (err) {
                    setActionError(err.message || 'Action failed.');
                  } finally {
                    setActionProcessing(false);
                  }
                }}
                disabled={actionProcessing || !!actionSuccess}
                className={`flex-1 py-2.5 text-xs font-pixel rounded-lg transition-colors disabled:opacity-50 ${
                  actionModal.action === 'complete'
                    ? 'bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30'
                    : 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30'
                }`}
              >
                {actionProcessing ? 'PROCESSING...' : actionModal.action === 'complete' ? 'COMPLETE PAYOUT' : 'REJECT REQUEST'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayouts;
