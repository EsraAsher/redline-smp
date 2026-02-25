import { useState, useEffect } from 'react';
import {
  fetchAllVotingSites,
  createVotingSite,
  updateVotingSite,
  toggleVotingSite,
  deleteVotingSite,
} from '../../api';

const AdminVotingLinks = () => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', url: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    setLoading(true);
    try {
      const data = await fetchAllVotingSites();
      setSites(data);
    } catch (err) {
      console.error('Failed to load voting sites:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ name: '', description: '', url: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (site) => {
    setForm({ name: site.name, description: site.description || '', url: site.url });
    setEditingId(site._id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.url.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateVotingSite(editingId, form);
      } else {
        await createVotingSite(form);
      }
      resetForm();
      await loadSites();
    } catch (err) {
      console.error('Failed to save voting site:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleVotingSite(id);
      await loadSites();
    } catch (err) {
      console.error('Failed to toggle voting site:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this voting site?')) return;
    try {
      await deleteVotingSite(id);
      await loadSites();
    } catch (err) {
      console.error('Failed to delete voting site:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-pixel text-sm text-red-400">VOTING LINKS</h2>
        <div className="flex gap-2">
          <button
            onClick={loadSites}
            className="text-gray-500 hover:text-white text-xs transition-colors"
          >
            ↻ Refresh
          </button>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="px-3 py-1.5 bg-red-600 text-white font-pixel text-xs rounded-lg hover:bg-red-500 transition-colors"
          >
            + ADD SITE
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-dark-surface border border-red-500/30 rounded-xl p-5 space-y-4">
          <h3 className="font-pixel text-xs text-white">
            {editingId ? 'EDIT VOTING SITE' : 'NEW VOTING SITE'}
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-xs mb-1 font-pixel">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. TopG"
                className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-xs mb-1 font-pixel">URL *</label>
              <input
                type="url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://topg.org/minecraft/server/..."
                className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-xs mb-1 font-pixel">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Short description of the voting site"
              rows={2}
              className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !form.name.trim() || !form.url.trim()}
              className="px-5 py-2 bg-red-600 text-white font-pixel text-xs rounded-lg hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : editingId ? 'UPDATE' : 'CREATE'}
            </button>
            <button
              onClick={resetForm}
              className="px-5 py-2 bg-white/10 text-gray-300 font-pixel text-xs rounded-lg hover:bg-white/20 transition-colors"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* Sites list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-gray-500 font-pixel text-sm animate-pulse">Loading voting sites...</div>
        </div>
      ) : sites.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-4xl block mb-4">🗳️</span>
          <p className="text-gray-500 font-pixel text-xs">No voting sites yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sites.map((site) => (
            <div
              key={site._id}
              className={`bg-dark-surface border rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-all ${
                site.isActive ? 'border-white/10' : 'border-red-500/20 opacity-60'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-white font-bold text-sm truncate">{site.name}</h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-pixel ${
                      site.isActive
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {site.isActive ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </div>
                {site.description && (
                  <p className="text-gray-500 text-xs mb-1 truncate">{site.description}</p>
                )}
                <a
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 text-xs hover:underline truncate block"
                >
                  {site.url}
                </a>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleEdit(site)}
                  className="px-3 py-1.5 bg-white/10 text-gray-300 text-xs font-pixel rounded hover:bg-white/20 transition-colors"
                >
                  EDIT
                </button>
                <button
                  onClick={() => handleToggle(site._id)}
                  className={`px-3 py-1.5 text-xs font-pixel rounded transition-colors ${
                    site.isActive
                      ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                      : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                  }`}
                >
                  {site.isActive ? 'DISABLE' : 'ENABLE'}
                </button>
                <button
                  onClick={() => handleDelete(site._id)}
                  className="px-3 py-1.5 bg-red-500/20 text-red-400 text-xs font-pixel rounded hover:bg-red-500/30 transition-colors"
                >
                  DELETE
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminVotingLinks;
