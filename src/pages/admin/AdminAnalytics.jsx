import { useState, useEffect } from 'react';
import { fetchRevenueAnalytics, fetchSalesLogs } from '../../api';

const deliveryColors = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  delivered: 'bg-green-500/20 text-green-400',
  failed: 'bg-red-500/20 text-red-400',
  skipped: 'bg-gray-500/20 text-gray-400',
};

const AdminAnalytics = () => {
  const [revenue, setRevenue] = useState(null);
  const [sales, setSales] = useState([]);
  const [loadingRevenue, setLoadingRevenue] = useState(true);
  const [loadingSales, setLoadingSales] = useState(true);

  useEffect(() => {
    loadRevenue();
    loadSales();
  }, []);

  const loadRevenue = async () => {
    setLoadingRevenue(true);
    try {
      const data = await fetchRevenueAnalytics();
      setRevenue(data);
    } catch (err) {
      console.error('Revenue load error:', err);
    } finally {
      setLoadingRevenue(false);
    }
  };

  const loadSales = async () => {
    setLoadingSales(true);
    try {
      const data = await fetchSalesLogs();
      setSales(data);
    } catch (err) {
      console.error('Sales load error:', err);
    } finally {
      setLoadingSales(false);
    }
  };

  const fmt = (v) => `₹${(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-8">
      {/* ─── Revenue Cards ──────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-pixel text-sm text-red-400">REVENUE</h2>
          <button
            onClick={() => { loadRevenue(); loadSales(); }}
            className="text-gray-500 hover:text-white text-xs transition-colors"
          >
            ↻ Refresh
          </button>
        </div>

        {loadingRevenue ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500 font-pixel text-sm animate-pulse">Loading revenue...</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {[
              { label: 'Today', value: revenue?.todayRevenue, icon: '📅', color: 'text-cyan-400' },
              { label: 'This Week', value: revenue?.weeklyRevenue, icon: '📆', color: 'text-blue-400' },
              { label: 'This Month', value: revenue?.monthlyRevenue, icon: '🗓️', color: 'text-purple-400' },
              { label: 'This Year', value: revenue?.yearlyRevenue, icon: '📊', color: 'text-yellow-400' },
              { label: 'All Time', value: revenue?.totalRevenue, icon: '💰', color: 'text-green-400' },
            ].map((card) => (
              <div
                key={card.label}
                className="bg-dark-surface border border-white/10 rounded-xl p-3 sm:p-5 hover:border-red-500/30 transition-all"
              >
                <div className="text-xl sm:text-2xl mb-2">{card.icon}</div>
                <div className={`text-base sm:text-xl font-bold ${card.color} truncate`}>{fmt(card.value)}</div>
                <div className="text-gray-500 text-xs mt-1">{card.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Sales Logs ─────────────────────────────────── */}
      <div className="bg-dark-surface border border-white/10 rounded-xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-pixel text-sm text-red-400">SALES LOG</h2>
          <span className="text-gray-500 text-xs">{sales.length} orders</span>
        </div>

        {loadingSales ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500 font-pixel text-sm animate-pulse">Loading sales...</div>
          </div>
        ) : sales.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl block mb-4">🧾</span>
            <p className="text-gray-500 font-pixel text-xs">No verified sales yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-left">
                  <th className="pb-3 font-pixel text-xs pr-4">Player</th>
                  <th className="pb-3 font-pixel text-xs pr-4 hidden sm:table-cell">Email</th>
                  <th className="pb-3 font-pixel text-xs pr-4">Items</th>
                  <th className="pb-3 font-pixel text-xs pr-4 text-right">Total</th>
                  <th className="pb-3 font-pixel text-xs pr-4 hidden md:table-cell">Paid At</th>
                  <th className="pb-3 font-pixel text-xs text-center">Delivery</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((order) => (
                  <tr key={order.orderId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 pr-4">
                      <span className="text-white font-mono text-xs">{order.mcUsername}</span>
                    </td>
                    <td className="py-3 pr-4 hidden sm:table-cell">
                      <span className="text-gray-400 text-xs truncate max-w-35 inline-block">{order.email || '—'}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="space-y-0.5">
                        {order.items.map((item, i) => (
                          <div key={i} className="text-gray-300 text-xs">
                            {item.title} <span className="text-gray-500">×{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <span className="text-green-400 font-mono text-xs">₹{order.total?.toFixed(2)}</span>
                    </td>
                    <td className="py-3 pr-4 hidden md:table-cell">
                      <span className="text-gray-500 text-xs">
                        {order.paidAt
                          ? new Date(order.paidAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-pixel ${
                          deliveryColors[order.deliveryStatus] || 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {(order.deliveryStatus || 'unknown').toUpperCase()}
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
};

export default AdminAnalytics;
