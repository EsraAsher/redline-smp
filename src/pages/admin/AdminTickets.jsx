import { useState, useEffect } from 'react';
import { fetchAdminTickets, updateTicketStatus } from '../../api';

const statusColors = {
  open: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  resolved: 'bg-green-500/20 text-green-400 border-green-500/30',
  declined: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const AdminTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | open | resolved | declined
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminTickets();
      setTickets(data);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    setUpdatingId(id);
    try {
      await updateTicketStatus(id, status);
      setTickets((prev) =>
        prev.map((t) => (t._id === id ? { ...t, status } : t))
      );
    } catch (err) {
      console.error('Failed to update ticket:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = filter === 'all' ? tickets : tickets.filter((t) => t.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500 font-pixel text-sm animate-pulse">Loading tickets...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="font-pixel text-sm text-red-400">
          SUPPORT TICKETS ({tickets.length})
        </h2>
        <div className="flex gap-2 flex-wrap">
          {['all', 'open', 'resolved', 'declined'].map((f) => (
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
            onClick={loadTickets}
            className="px-3 py-1.5 text-xs text-gray-500 hover:text-white transition-colors"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Tickets List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-4xl mb-4 block">🎫</span>
          <p className="text-gray-500 font-pixel text-xs">
            {filter === 'all' ? 'No tickets yet' : `No ${filter} tickets`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket) => (
            <div
              key={ticket._id}
              className="bg-dark-surface border border-white/10 rounded-xl p-4 sm:p-5 hover:border-red-500/20 transition-all"
            >
              {/* Top row: email + status + date */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-white text-sm font-mono truncate">{ticket.email}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-pixel border shrink-0 ${
                      statusColors[ticket.status]
                    }`}
                  >
                    {ticket.status.toUpperCase()}
                  </span>
                </div>
                <span className="text-gray-600 text-xs shrink-0">
                  {new Date(ticket.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {/* Category */}
              <div className="mb-2">
                <span className="text-xs text-red-400 font-pixel">{ticket.category}</span>
              </div>

              {/* Message preview */}
              <p className="text-gray-400 text-sm leading-relaxed mb-4 whitespace-pre-wrap wrap-break-word">
                {ticket.message.length > 300
                  ? ticket.message.slice(0, 300) + '…'
                  : ticket.message}
              </p>

              {/* Actions */}
              {ticket.status === 'open' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatusChange(ticket._id, 'resolved')}
                    disabled={updatingId === ticket._id}
                    className="px-4 py-1.5 text-xs font-pixel bg-green-500/10 border border-green-500/30 text-green-400 rounded hover:bg-green-500/20 transition-colors disabled:opacity-50"
                  >
                    {updatingId === ticket._id ? '...' : '✓ Resolve'}
                  </button>
                  <button
                    onClick={() => handleStatusChange(ticket._id, 'declined')}
                    disabled={updatingId === ticket._id}
                    className="px-4 py-1.5 text-xs font-pixel bg-red-500/10 border border-red-500/30 text-red-400 rounded hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    {updatingId === ticket._id ? '...' : '✕ Decline'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminTickets;
