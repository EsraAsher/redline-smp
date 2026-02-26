import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreatorAuth } from '../context/CreatorAuthContext';
import { fetchCreatorDashboard } from '../api';

const StatCard = ({ label, value, accent = false, sub = '' }) => (
  <div className="bg-dark-surface border border-white/10 rounded-xl p-5">
    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">{label}</p>
    <p className={`text-2xl font-bold ${accent ? 'text-red-400' : 'text-white'}`}>{value}</p>
    {sub && <p className="text-gray-600 text-xs mt-1">{sub}</p>}
  </div>
);

const CreatorDashboardPage = () => {
  const { creator, loading: authLoading, logout } = useCreatorAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !creator) {
      navigate('/creator/login', { replace: true });
    }
  }, [creator, authLoading, navigate]);

  useEffect(() => {
    if (!creator) return;
    (async () => {
      try {
        const res = await fetchCreatorDashboard();
        setData(res);
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

  // Banned state
  if (data?.status === 'banned') {
    return (
      <main className="relative z-10 pt-24 pb-20 px-4 max-w-md mx-auto min-h-screen">
        <div className="bg-dark-surface border border-red-500/30 rounded-2xl p-8 text-center space-y-4">
          <div className="text-4xl">🚫</div>
          <h1 className="font-pixel text-lg text-red-400">ACCOUNT BANNED</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Your referral partner account has been banned. If you believe this is a mistake, please open a support ticket on our Discord.
          </p>
          <button onClick={handleLogout} className="text-gray-500 text-xs hover:text-white underline">
            Sign out
          </button>
        </div>
      </main>
    );
  }

  // Paused state
  if (data?.status === 'paused') {
    return (
      <main className="relative z-10 pt-24 pb-20 px-4 max-w-lg mx-auto min-h-screen">
        <div className="bg-dark-surface border border-yellow-500/30 rounded-2xl p-8 text-center space-y-4">
          <div className="text-4xl">⏸️</div>
          <h1 className="font-pixel text-lg text-yellow-400">ACCOUNT PAUSED</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Your referral code is currently paused. Customers cannot use it until an admin reactivates it.
          </p>
          <button onClick={handleLogout} className="text-gray-500 text-xs hover:text-white underline">
            Sign out
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative z-10 pt-24 sm:pt-28 pb-20 px-4 max-w-4xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-pixel text-lg sm:text-xl text-red-400 drop-shadow-[0_0_10px_rgba(255,0,0,0.5)]">
            CREATOR DASHBOARD
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Welcome back, <span className="text-white font-medium">{data?.creatorName}</span>
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="text-gray-500 text-xs hover:text-red-400 transition-colors border border-white/10 rounded-lg px-4 py-2"
        >
          Sign out
        </button>
      </div>

      {/* Referral Code Card */}
      <div className="bg-dark-surface border border-red-500/20 rounded-2xl p-6 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Your Referral Code</p>
          <p className="text-2xl font-bold text-red-400 font-mono tracking-wider">{data?.referralCode}</p>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>{data?.discountPercent}% discount for customers</span>
          <span className="text-white/20">|</span>
          <span>{data?.commissionPercent}% commission for you</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
          sub={data?.payoutEligible ? '✅ Eligible for payout' : `Threshold: ₹${data?.payoutThreshold ?? 300}`}
        />
      </div>

      {/* Paid Out */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatCard
          label="Total Paid Out"
          value={`₹${(data?.totalPaidOut ?? 0).toLocaleString('en-IN')}`}
        />
        <StatCard
          label="Code Status"
          value={data?.status === 'active' ? '🟢 Active' : data?.status}
        />
      </div>

      {/* Limits Info */}
      {(data?.maxUses || data?.expiresAt) && (
        <div className="bg-dark-surface border border-white/10 rounded-xl p-5 text-sm text-gray-400 space-y-1">
          {data?.maxUses && (
            <p>Max uses: <span className="text-white">{data.totalUses}/{data.maxUses}</span></p>
          )}
          {data?.expiresAt && (
            <p>Expires: <span className="text-white">{new Date(data.expiresAt).toLocaleDateString()}</span></p>
          )}
        </div>
      )}
    </main>
  );
};

export default CreatorDashboardPage;
