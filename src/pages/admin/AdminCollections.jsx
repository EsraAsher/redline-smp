import { useState, useEffect } from 'react';
import {
  fetchAllCollections,
  createCollection,
  updateCollection,
  deleteCollection,
} from '../../api';

const AdminCollections = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', order: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    setLoading(true);
    try {
      const data = await fetchAllCollections();
      setCollections(data);
    } catch (err) {
      console.error('Load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setEditing(null);
    setForm({ name: '', description: '', order: 0 });
    setShowForm(true);
    setError('');
  };

  const handleEdit = (col) => {
    setEditing(col._id);
    setForm({
      name: col.name,
      description: col.description || '',
      order: col.order || 0,
    });
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const data = { ...form, order: parseInt(form.order) || 0 };
      if (editing) {
        await updateCollection(editing, data);
      } else {
        await createCollection(data);
      }
      await loadCollections();
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id, isActive) => {
    try {
      await updateCollection(id, { isActive: !isActive });
      await loadCollections();
    } catch (err) {
      console.error('Toggle failed:', err);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"? Products in this collection must be moved first.`)) return;
    try {
      await deleteCollection(id);
      await loadCollections();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500 font-pixel text-sm animate-pulse">Loading collections...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-pixel text-sm text-red-400">
          MANAGE COLLECTIONS ({collections.length})
        </h2>
        <button
          onClick={handleNew}
          className="px-4 py-2 font-pixel text-xs bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors shadow-[0_0_15px_rgba(255,0,0,0.3)]"
        >
          + ADD COLLECTION
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-dark-surface border border-red-500/20 rounded-xl p-6 shadow-[0_0_20px_rgba(255,0,0,0.1)]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-pixel text-sm text-white">
              {editing ? 'EDIT COLLECTION' : 'NEW COLLECTION'}
            </h3>
            <button
              onClick={() => { setShowForm(false); setEditing(null); }}
              className="text-gray-500 hover:text-white text-xl"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-xs font-pixel mb-2">NAME</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50"
                  placeholder="e.g. Ranks, Crates, Coins"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-pixel mb-2">SORT ORDER</label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-pixel mb-2">DESCRIPTION</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50 h-20 resize-none"
                placeholder="Brief description of this collection..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 font-pixel text-xs bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                {saving ? 'SAVING...' : editing ? 'UPDATE' : 'CREATE'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditing(null); }}
                className="px-6 py-2.5 font-pixel text-xs bg-white/5 border border-white/10 text-gray-400 rounded-lg hover:text-white transition-colors"
              >
                CANCEL
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Collections List */}
      <div className="space-y-3">
        {collections.map((col) => (
          <div
            key={col._id}
            className={`bg-dark-surface border rounded-xl p-5 flex flex-col md:flex-row md:items-center gap-4 transition-all ${
              col.isActive
                ? 'border-white/10 hover:border-red-500/30'
                : 'border-red-500/20 opacity-60'
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-white font-bold">{col.name}</h3>
                <span className="text-gray-500 text-xs font-mono">/{col.slug}</span>
                {!col.isActive && (
                  <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded">Inactive</span>
                )}
              </div>
              {col.description && (
                <p className="text-gray-500 text-sm truncate">{col.description}</p>
              )}
              <p className="text-gray-600 text-xs mt-1">Order: {col.order}</p>
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => handleEdit(col)}
                className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 text-gray-300 rounded hover:text-white hover:border-white/20 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => handleToggle(col._id, col.isActive)}
                className={`px-3 py-1.5 text-xs rounded transition-colors ${
                  col.isActive
                    ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20'
                    : 'bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20'
                }`}
              >
                {col.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={() => handleDelete(col._id, col.name)}
                className="px-3 py-1.5 text-xs bg-red-500/10 border border-red-500/30 text-red-400 rounded hover:bg-red-500/20 transition-colors"
              >
                ✕ Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {collections.length === 0 && (
        <div className="text-center py-16">
          <span className="text-4xl mb-4 block">🗂️</span>
          <p className="text-gray-500 font-pixel text-xs">No collections yet</p>
        </div>
      )}
    </div>
  );
};

export default AdminCollections;
