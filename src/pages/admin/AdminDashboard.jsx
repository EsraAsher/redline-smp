import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchAnalyticsOverview, fetchAnalyticsProducts } from '../../api';
import AdminProducts from './AdminProducts';
import AdminCollections from './AdminCollections';
import AdminTickets from './AdminTickets';
import AdminAnalytics from './AdminAnalytics';
import AdminVotingLinks from './AdminVotingLinks';

const tabs = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'products', label: 'Products', icon: '📦' },
  { id: 'collections', label: 'Collections', icon: '🗂️' },
  { id: 'tickets', label: 'Tickets', icon: '🎫' },
  { id: 'analytics', label: 'Analytics', icon: '💰' },
  { id: 'voting', label: 'Voting Links', icon: '🗳️' },
];

const AdminDashboard = () => {
  const { admin, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [productStats, setProductStats] = useState([]);
  const [loadingOverview, setLoadingOverview] = useState(true);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    setLoadingOverview(true);
    try {
      const [ov, ps] = await Promise.all([
        fetchAnalyticsOverview(),
        fetchAnalyticsProducts(),
      ]);
      setOverview(ov);
      setProductStats(ps);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoadingOverview(false);
    }
  };

  return (
    <main className="relative z-10 pt-20 pb-12 px-4 md:px-6 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-pixel text-lg sm:text-2xl text-red-400 drop-shadow-[0_0_10px_rgba(255,0,0,0.5)]">
            ADMIN PANEL
          </h1>
          <p className="text-gray-500 text-sm mt-1">Welcome, {admin?.username}</p>
        </div>
        <button
          onClick={logout}
          className="self-start md:self-auto px-4 py-2 font-pixel text-xs bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
        >
          LOGOUT
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 font-pixel text-xs rounded-lg transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-red-500/20 border border-red-500/50 text-red-400 shadow-[0_0_10px_rgba(255,0,0,0.2)]'
                : 'bg-dark-surface border border-white/10 text-gray-400 hover:text-white hover:border-white/20'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab
          overview={overview}
          productStats={productStats}
          loading={loadingOverview}
          onRefresh={loadOverview}
        />
      )}
      {activeTab === 'products' && <AdminProducts />}
      {activeTab === 'collections' && <AdminCollections />}
      {activeTab === 'tickets' && <AdminTickets />}
      {activeTab === 'analytics' && <AdminAnalytics />}
      {activeTab === 'voting' && <AdminVotingLinks />}
    </main>
  );
};

// ─── Overview Tab ─────────────────────────────────────────
function OverviewTab({ overview, productStats, loading, onRefresh }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500 font-pixel text-sm animate-pulse">Loading analytics...</div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Products', value: overview?.totalProducts || 0, icon: '📦', color: 'text-blue-400' },
    { label: 'Active Products', value: overview?.activeProducts || 0, icon: '✅', color: 'text-green-400' },
    { label: 'Collections', value: overview?.totalCollections || 0, icon: '🗂️', color: 'text-purple-400' },
    { label: 'Total Sales', value: overview?.totalSales || 0, icon: '🛒', color: 'text-yellow-400' },
    { label: 'Total Revenue', value: `$${(overview?.totalRevenue || 0).toFixed(2)}`, icon: '💰', color: 'text-green-400' },
    { label: 'Items Sold', value: overview?.totalItemsSold || 0, icon: '📈', color: 'text-cyan-400' },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-dark-surface border border-white/10 rounded-xl p-3 sm:p-5 hover:border-red-500/30 transition-all"
          >
            <div className="text-xl sm:text-2xl mb-2">{stat.icon}</div>
            <div className={`text-lg sm:text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-gray-500 text-xs mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Per-Product Sales */}
      <div className="bg-dark-surface border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-pixel text-sm text-red-400">PRODUCT SALES</h2>
          <button
            onClick={onRefresh}
            className="text-gray-500 hover:text-white text-xs transition-colors"
          >
            ↻ Refresh
          </button>
        </div>

        {productStats.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No product data yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-left">
                  <th className="pb-3 font-pixel text-xs">Product</th>
                  <th className="pb-3 font-pixel text-xs">Collection</th>
                  <th className="pb-3 font-pixel text-xs text-right">Price</th>
                  <th className="pb-3 font-pixel text-xs text-right">Sold</th>
                  <th className="pb-3 font-pixel text-xs text-right">Revenue</th>
                  <th className="pb-3 font-pixel text-xs text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {productStats.map((p) => (
                  <tr key={p._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 text-white">{p.title}</td>
                    <td className="py-3 text-gray-400">{p.collection}</td>
                    <td className="py-3 text-gray-300 text-right">${p.price.toFixed(2)}</td>
                    <td className="py-3 text-cyan-400 text-right">{p.totalSold}</td>
                    <td className="py-3 text-green-400 text-right">${p.totalRevenue.toFixed(2)}</td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${
                        p.isActive
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
