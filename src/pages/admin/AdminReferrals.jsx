import { useState, useEffect } from 'react';
import { fetchAdminApplications, approveReferral, rejectReferral } from '../../api';

const statusColors = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  approved: 'bg-green-500/20 text-green-400 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const AdminReferrals = () => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [actionId, setActionId] = useState(null);

  // Approval modal state
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveTarget, setApproveTarget] = useState(null);
  const [approveForm, setApproveForm] = useState({
    referralCode: '',
    discountPercent: 10,
    commissionPercent: 10,
  });
  const [approveError, setApproveError] = useState('');

  // Reject modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Expanded row
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadReferrals();
  }, []);

  const loadReferrals = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminApplications();
      setReferrals(data);
    } catch (err) {
      console.error('Failed to load referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Approve flow ──────────────────────────────────────────
  const openApproveModal = (ref) => {
    setApproveTarget(ref);
    setApproveForm({
      referralCode: '',
      discountPercent: 10,
      commissionPercent: 10,
    });
    setApproveError('');
    setShowApproveModal(true);
  };

  const handleApprove = async () => {
    setActionId(approveTarget._id);
    setApproveError('');
    try {
      const res = await approveReferral(approveTarget._id, approveForm);
      setReferrals((prev) =>
        prev.map((r) => (r._id === approveTarget._id ? res.application : r))
      );
      setShowApproveModal(false);
    } catch (err) {
      setApproveError(err.message || 'Failed to approve.');
    } finally {
      setActionId(null);
    }
  };

  // ── Reject flow ───────────────────────────────────────────
  const openRejectModal = (ref) => {
    setRejectTarget(ref);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    setActionId(rejectTarget._id);
    try {
      const res = await rejectReferral(rejectTarget._id, rejectReason);
      setReferrals((prev) =>
        prev.map((r) => (r._id === rejectTarget._id ? res.application : r))
      );
      setShowRejectModal(false);
    } catch (err) {
      console.error('Failed to reject:', err);
    } finally {
      setActionId(null);
    }
  };

  const filtered = filter === 'all' ? referrals : referrals.filter((r) => r.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500 font-pixel text-sm animate-pulse">Loading referrals...</div>
      </div>
    );
  }

  const pendingCount = referrals.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="font-pixel text-sm text-red-400">
          REFERRAL APPLICATIONS ({referrals.length})
          {pendingCount > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded">
              {pendingCount} pending
            </span>
          )}
        </h2>
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'approved', 'rejected'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-pixel rounded-lg transition-all ${
                filter === f
                  ? 'bg-red-500/20 border border-red-500/50 text-red-400'
                  : 'bg-dark-surface border border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              {f.toUpperCase()}
            </button>
          ))}
          <button
            onClick={loadReferrals}
            className="px-3 py-1.5 text-xs text-gray-500 hover:text-white transition-colors"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-4xl mb-4 block">🤝</span>
          <p className="text-gray-500 font-pixel text-xs">
            {filter === 'all' ? 'No referral applications yet' : `No ${filter} applications`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ref) => (
            <div
              key={ref._id}
              className="bg-dark-surface border border-white/10 rounded-xl p-4 sm:p-5 hover:border-red-500/20 transition-all"
            >
              {/* Row header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg">🤝</span>
                  <div className="min-w-0">
                    <div className="text-white font-medium text-sm flex items-center gap-2 flex-wrap">
                      {ref.creatorName}
                      <span className={`px-2 py-0.5 text-xs rounded border ${statusColors[ref.status]}`}>
                        {ref.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-gray-500 text-xs mt-0.5 truncate">
                      {ref.email} · MC: {ref.minecraftUsername}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {ref.status === 'pending' && (
                    <>
                      <button
                        onClick={() => openApproveModal(ref)}
                        disabled={actionId === ref._id}
                        className="px-3 py-1.5 text-xs font-pixel bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors disabled:opacity-50"
                      >
                        APPROVE
                      </button>
                      <button
                        onClick={() => openRejectModal(ref)}
                        disabled={actionId === ref._id}
                        className="px-3 py-1.5 text-xs font-pixel bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
                      >
                        REJECT
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setExpandedId(expandedId === ref._id ? null : ref._id)}
                    className="px-2 py-1.5 text-xs text-gray-500 hover:text-white transition-colors"
                  >
                    {expandedId === ref._id ? '▲' : '▼'}
                  </button>
                </div>
              </div>

              {/* Expanded details */}
              {expandedId === ref._id && (
                <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500">Discord ID:</span>{' '}
                    <span className="text-gray-300">{ref.discordId}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Channel:</span>{' '}
                    <a
                      href={ref.channelLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-400 hover:underline"
                    >
                      {ref.channelLink}
                    </a>
                  </div>
                  <div>
                    <span className="text-gray-500">Applied:</span>{' '}
                    <span className="text-gray-300">
                      {new Date(ref.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {ref.reviewedBy && (
                    <div>
                      <span className="text-gray-500">Reviewed by:</span>{' '}
                      <span className="text-gray-300">{ref.reviewedBy?.username || '—'}</span>
                    </div>
                  )}
                  {ref.reviewedAt && (
                    <div>
                      <span className="text-gray-500">Reviewed at:</span>{' '}
                      <span className="text-gray-300">
                        {new Date(ref.reviewedAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                  {ref.description && (
                    <div className="sm:col-span-2 bg-black/30 border border-white/5 rounded-lg p-3 mt-1">
                      <span className="text-gray-500 block mb-1">Description:</span>
                      <p className="text-gray-300 whitespace-pre-wrap">{ref.description}</p>
                    </div>
                  )}
                  {ref.reviewReason && (
                    <div className="sm:col-span-2 bg-red-500/5 border border-red-500/10 rounded-lg p-3 mt-1">
                      <span className="text-gray-500 block mb-1">Review Reason:</span>
                      <p className="text-gray-300 whitespace-pre-wrap">{ref.reviewReason}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Approve Modal ──────────────────────────────────── */}
      {showApproveModal && approveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 sm:p-8 w-full max-w-md space-y-5">
            <div className="text-center">
              <div className="text-3xl mb-2">✅</div>
              <h3 className="font-pixel text-sm text-green-400 mb-1">APPROVE REFERRAL</h3>
              <p className="text-gray-500 text-xs">
                Approving <strong className="text-white">{approveTarget.creatorName}</strong>
              </p>
            </div>

            {approveError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg p-3">
                {approveError}
              </div>
            )}

            <div>
              <label className="block text-gray-400 text-xs mb-1">
                Referral Code <span className="text-gray-600">(leave empty to auto-generate)</span>
              </label>
              <input
                type="text"
                value={approveForm.referralCode}
                onChange={(e) =>
                  setApproveForm((p) => ({ ...p, referralCode: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') }))
                }
                placeholder="e.g. STEVE10 (auto if empty)"
                maxLength={20}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white font-mono placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition-colors uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 text-xs mb-1">Buyer Discount %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={approveForm.discountPercent}
                  onChange={(e) =>
                    setApproveForm((p) => ({ ...p, discountPercent: Number(e.target.value) }))
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-yellow-400 focus:outline-none focus:border-green-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">Commission %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={approveForm.commissionPercent}
                  onChange={(e) =>
                    setApproveForm((p) => ({ ...p, commissionPercent: Number(e.target.value) }))
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-green-400 focus:outline-none focus:border-green-500/50 transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowApproveModal(false)}
                className="flex-1 py-2.5 text-xs font-pixel bg-dark-surface border border-white/10 text-gray-400 rounded-lg hover:text-white transition-colors"
              >
                CANCEL
              </button>
              <button
                onClick={handleApprove}
                disabled={actionId === approveTarget._id}
                className="flex-1 py-2.5 text-xs font-pixel bg-green-500/20 border border-green-500/50 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
              >
                {actionId === approveTarget._id ? 'APPROVING...' : 'CONFIRM APPROVE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Modal ───────────────────────────────────── */}
      {showRejectModal && rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 sm:p-8 w-full max-w-md space-y-5">
            <div className="text-center">
              <div className="text-3xl mb-2">❌</div>
              <h3 className="font-pixel text-sm text-red-400 mb-1">REJECT APPLICATION</h3>
              <p className="text-gray-500 text-xs">
                Rejecting <strong className="text-white">{rejectTarget.creatorName}</strong>
              </p>
            </div>

            <div>
              <label className="block text-gray-400 text-xs mb-1">Reason (optional)</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Reason for rejection (internal)"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-colors resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-2.5 text-xs font-pixel bg-dark-surface border border-white/10 text-gray-400 rounded-lg hover:text-white transition-colors"
              >
                CANCEL
              </button>
              <button
                onClick={handleReject}
                disabled={actionId === rejectTarget._id}
                className="flex-1 py-2.5 text-xs font-pixel bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                {actionId === rejectTarget._id ? 'REJECTING...' : 'CONFIRM REJECT'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReferrals;
