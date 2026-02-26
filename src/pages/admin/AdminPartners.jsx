import { useState, useEffect } from 'react';
import { fetchAdminPartners, updatePartner, updatePartnerStatus, adjustPartnerCommission, fetchReferralAnalytics } from '../../api';

const statusColors = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  paused: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  banned: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const AdminPartners = () => {
  const [partners, setPartners] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  // Edit modal
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // Status modal
  const [statusModal, setStatusModal] = useState(null);
  const [statusTarget, setStatusTarget] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  // Adjust modal
  const [adjustModal, setAdjustModal] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  const [adjustError, setAdjustError] = useState('');
  const [adjustSuccess, setAdjustSuccess] = useState('');

  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, a] = await Promise.all([
        fetchAdminPartners(),
        fetchReferralAnalytics(),
      ]);
      setPartners(p);
      setAnalytics(a);
    } catch (err) {
      console.error('Failed to load partners:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Edit handlers ─────────────────────────────────────
  const openEdit = (p) => {
    setEditModal(p);
    setEditForm({
      discountPercent: p.discountPercent,
      commissionPercent: p.commissionPercent,
      maxUses: p.maxUses || '',
      expiresAt: p.expiresAt ? new Date(p.expiresAt).toISOString().split('T')[0] : '',
      referralCode: '',
    });
    setEditError('');
    setEditSuccess('');
  };

  const handleEdit = async () => {
    setEditError('');
    setActionLoading(true);
    try {
      const payload = {
        discountPercent: Number(editForm.discountPercent),
        commissionPercent: Number(editForm.commissionPercent),
        maxUses: editForm.maxUses ? Number(editForm.maxUses) : null,
        expiresAt: editForm.expiresAt || null,
      };
      if (editForm.referralCode.trim()) {
        payload.referralCode = editForm.referralCode.trim().toUpperCase();
      }
      await updatePartner(editModal._id, payload);
      setEditSuccess('Partner updated.');
      await loadData();
      setTimeout(() => setEditModal(null), 1000);
    } catch (err) {
      setEditError(err.message || 'Update failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Status handlers ───────────────────────────────────
  const openStatus = (p, status) => {
    setStatusModal(p);
    setStatusTarget(status);
  };

  const handleStatusChange = async () => {
    setStatusLoading(true);
    try {
      await updatePartnerStatus(statusModal._id, statusTarget);
      await loadData();
      setStatusModal(null);
    } catch (err) {
      console.error('Status change failed:', err);
    } finally {
      setStatusLoading(false);
    }
  };

  // ── Adjust handlers ───────────────────────────────────
  const openAdjust = (p) => {
    setAdjustModal(p);
    setAdjustAmount('');
    setAdjustNote('');
    setAdjustError('');
    setAdjustSuccess('');
  };

  const handleAdjust = async () => {
    setAdjustError('');
    const amt = Number(adjustAmount);
    if (!amt) {
      setAdjustError('Enter a valid amount (positive to add, negative to deduct).');
      return;
    }
    setActionLoading(true);
    try {
      const res = await adjustPartnerCommission(adjustModal._id, amt, adjustNote);
      setAdjustSuccess(res.message);
      await loadData();
      setTimeout(() => setAdjustModal(null), 1200);
    } catch (err) {
      setAdjustError(err.message || 'Adjustment failed.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500 font-pixel text-sm animate-pulse">Loading partners...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Summary */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total Partners', value: analytics.totalPartners, color: 'text-blue-400' },
            { label: 'Active', value: analytics.activePartners, color: 'text-green-400' },
            { label: 'Revenue Generated', value: `₹${(analytics.totalRevenueGenerated || 0).toLocaleString('en-IN')}`, color: 'text-cyan-400' },
            { label: 'Commission Pending', value: `₹${(analytics.totalCommissionLiability || 0).toLocaleString('en-IN')}`, color: 'text-yellow-400' },
            { label: 'Commission Paid', value: `₹${(analytics.totalCommissionPaid || 0).toLocaleString('en-IN')}`, color: 'text-green-400' },
          ].map((s) => (
            <div key={s.label} className="bg-dark-surface border border-white/10 rounded-xl p-4">
              <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
              <div className="text-gray-500 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Partners list header */}
      <div className="flex items-center justify-between">
        <h2 className="font-pixel text-sm text-red-400">PARTNERS ({partners.length})</h2>
        <button onClick={loadData} className="text-gray-500 hover:text-white text-xs transition-colors">↻ Refresh</button>
      </div>

      {partners.length === 0 ? (
        <div className="text-center py-16 text-gray-500 text-sm">No referral partners yet.</div>
      ) : (
        <div className="space-y-3">
          {partners.map((p) => (
            <div key={p._id} className="bg-dark-surface border border-white/10 rounded-xl p-4 hover:border-red-500/20 transition-all">
              {/* Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-white font-medium text-sm flex items-center gap-2 flex-wrap">
                    {p.creatorName}
                    <span className="font-mono text-red-400 text-xs">{p.referralCode}</span>
                    <span className={`px-2 py-0.5 text-xs rounded border ${statusColors[p.status]}`}>{p.status.toUpperCase()}</span>
                  </div>
                  <div className="text-gray-500 text-xs mt-0.5">
                    {p.discountPercent}% discount · {p.commissionPercent}% commission · {p.totalUses} uses · ₹{(p.totalRevenueGenerated || 0).toLocaleString('en-IN')} revenue
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  <button onClick={() => openEdit(p)} className="px-2.5 py-1 text-xs font-pixel bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors">EDIT</button>
                  {p.status === 'active' && (
                    <button onClick={() => openStatus(p, 'paused')} className="px-2.5 py-1 text-xs font-pixel bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-lg hover:bg-yellow-500/20 transition-colors">PAUSE</button>
                  )}
                  {p.status === 'paused' && (
                    <button onClick={() => openStatus(p, 'active')} className="px-2.5 py-1 text-xs font-pixel bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors">ACTIVATE</button>
                  )}
                  {p.status !== 'banned' && (
                    <button onClick={() => openStatus(p, 'banned')} className="px-2.5 py-1 text-xs font-pixel bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors">BAN</button>
                  )}
                  {p.status === 'banned' && (
                    <button onClick={() => openStatus(p, 'active')} className="px-2.5 py-1 text-xs font-pixel bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors">UNBAN</button>
                  )}
                  <button onClick={() => openAdjust(p)} className="px-2.5 py-1 text-xs font-pixel bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-lg hover:bg-purple-500/20 transition-colors">ADJUST ₹</button>
                  <button onClick={() => setExpandedId(expandedId === p._id ? null : p._id)} className="px-2 py-1 text-xs text-gray-500 hover:text-white transition-colors">
                    {expandedId === p._id ? '▲' : '▼'}
                  </button>
                </div>
              </div>

              {/* Expanded details */}
              {expandedId === p._id && (
                <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div><span className="text-gray-500">Pending:</span> <span className="text-yellow-400">₹{(p.pendingCommission || 0).toLocaleString('en-IN')}</span></div>
                  <div><span className="text-gray-500">Paid Out:</span> <span className="text-green-400">₹{(p.totalPaidOut || 0).toLocaleString('en-IN')}</span></div>
                  <div><span className="text-gray-500">Total Earned:</span> <span className="text-gray-300">₹{(p.totalCommissionEarned || 0).toLocaleString('en-IN')}</span></div>
                  <div><span className="text-gray-500">Discord:</span> <span className="text-gray-300">{p.discordId}</span></div>
                  {p.minecraftUsername && <div><span className="text-gray-500">MC:</span> <span className="text-gray-300">{p.minecraftUsername}</span></div>}
                  {p.maxUses && <div><span className="text-gray-500">Max Uses:</span> <span className="text-gray-300">{p.totalUses}/{p.maxUses}</span></div>}
                  {p.expiresAt && <div><span className="text-gray-500">Expires:</span> <span className="text-gray-300">{new Date(p.expiresAt).toLocaleDateString()}</span></div>}
                  <div><span className="text-gray-500">Created:</span> <span className="text-gray-300">{new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Edit Modal ─────────────────────────────────── */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => !actionLoading && setEditModal(null)}>
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-pixel text-sm text-blue-400">EDIT PARTNER — {editModal.creatorName}</h3>
            {editError && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg p-3">{editError}</div>}
            {editSuccess && <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-xs rounded-lg p-3">{editSuccess}</div>}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 text-xs block mb-1">Discount %</label>
                <input type="number" min={0} max={100} value={editForm.discountPercent} onChange={(e) => setEditForm((f) => ({ ...f, discountPercent: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1">Commission %</label>
                <input type="number" min={0} max={100} value={editForm.commissionPercent} onChange={(e) => setEditForm((f) => ({ ...f, commissionPercent: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1">Max Uses <span className="text-gray-600">(empty=∞)</span></label>
                <input type="number" min={0} value={editForm.maxUses} onChange={(e) => setEditForm((f) => ({ ...f, maxUses: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50" placeholder="∞" />
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1">Expires At <span className="text-gray-600">(empty=never)</span></label>
                <input type="date" value={editForm.expiresAt} onChange={(e) => setEditForm((f) => ({ ...f, expiresAt: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50" />
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-xs block mb-1">New Referral Code <span className="text-gray-600">(leave empty to keep: {editModal.referralCode})</span></label>
              <input type="text" value={editForm.referralCode} onChange={(e) => setEditForm((f) => ({ ...f, referralCode: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') }))} maxLength={20} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono uppercase focus:outline-none focus:border-blue-500/50" placeholder={editModal.referralCode} />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setEditModal(null)} disabled={actionLoading} className="flex-1 py-2.5 text-xs font-pixel bg-dark-surface border border-white/10 text-gray-400 rounded-lg hover:text-white transition-colors">CANCEL</button>
              <button onClick={handleEdit} disabled={actionLoading} className="flex-1 py-2.5 text-xs font-pixel bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50">{actionLoading ? 'SAVING...' : 'SAVE'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Status Modal ───────────────────────────────── */}
      {statusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => !statusLoading && setStatusModal(null)}>
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="text-3xl">{statusTarget === 'banned' ? '🚫' : statusTarget === 'paused' ? '⏸️' : '✅'}</div>
            <h3 className="font-pixel text-sm text-white">
              {statusTarget === 'banned' ? 'BAN' : statusTarget === 'paused' ? 'PAUSE' : 'ACTIVATE'} {statusModal.creatorName}?
            </h3>
            <p className="text-gray-400 text-xs">
              Code: <span className="font-mono text-red-400">{statusModal.referralCode}</span> → Status: <span className="font-semibold">{statusTarget.toUpperCase()}</span>
            </p>
            <div className="flex gap-3">
              <button onClick={() => setStatusModal(null)} disabled={statusLoading} className="flex-1 py-2.5 text-xs font-pixel bg-dark-surface border border-white/10 text-gray-400 rounded-lg hover:text-white transition-colors">CANCEL</button>
              <button onClick={handleStatusChange} disabled={statusLoading} className={`flex-1 py-2.5 text-xs font-pixel rounded-lg transition-colors disabled:opacity-50 ${statusTarget === 'banned' ? 'bg-red-500/20 border border-red-500/50 text-red-400' : statusTarget === 'paused' ? 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-400' : 'bg-green-500/20 border border-green-500/50 text-green-400'}`}>
                {statusLoading ? 'UPDATING...' : 'CONFIRM'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Adjust Commission Modal ────────────────────── */}
      {adjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => !actionLoading && setAdjustModal(null)}>
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-pixel text-sm text-purple-400">ADJUST COMMISSION — {adjustModal.creatorName}</h3>
            <div className="bg-black/30 border border-white/5 rounded-lg p-3 text-sm">
              <span className="text-gray-500">Current Pending:</span>{' '}
              <span className="text-yellow-400 font-semibold">₹{(adjustModal.pendingCommission || 0).toLocaleString('en-IN')}</span>
            </div>
            {adjustError && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg p-3">{adjustError}</div>}
            {adjustSuccess && <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-xs rounded-lg p-3">{adjustSuccess}</div>}
            <div>
              <label className="text-gray-400 text-xs block mb-1">Amount (positive = add, negative = deduct)</label>
              <input type="number" value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50" placeholder="e.g. 50 or -100" />
            </div>
            <div>
              <label className="text-gray-400 text-xs block mb-1">Note (reason)</label>
              <input type="text" value={adjustNote} onChange={(e) => setAdjustNote(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50" placeholder="e.g. Payout correction, bonus" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setAdjustModal(null)} disabled={actionLoading} className="flex-1 py-2.5 text-xs font-pixel bg-dark-surface border border-white/10 text-gray-400 rounded-lg hover:text-white transition-colors">CANCEL</button>
              <button onClick={handleAdjust} disabled={actionLoading} className="flex-1 py-2.5 text-xs font-pixel bg-purple-500/20 border border-purple-500/50 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors disabled:opacity-50">{actionLoading ? 'ADJUSTING...' : 'ADJUST'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPartners;
