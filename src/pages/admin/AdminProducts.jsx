import { useState, useEffect } from 'react';
import {
  fetchAllProducts,
  fetchAllCollections,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProduct,
} from '../../api';

const emptyProduct = {
  title: '',
  price: '',
  image: '',
  features: [''],
  commands: '',
  collection: '',
  isFeatured: false,
  order: 0,
};

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, cols] = await Promise.all([
        fetchAllProducts(),
        fetchAllCollections(),
      ]);
      setProducts(prods);
      setCollections(cols);
    } catch (err) {
      console.error('Load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditing(product._id);
    setForm({
      title: product.title,
      price: product.price,
      image: product.image || '',
      features: product.features.length > 0 ? product.features : [''],
      commands: (product.commands || []).join('\n'),
      collection: product.collection?._id || '',
      isFeatured: product.isFeatured,
      order: product.order || 0,
    });
    setShowForm(true);
    setError('');
  };

  const handleNew = () => {
    setEditing(null);
    setForm({ ...emptyProduct, collection: collections[0]?._id || '' });
    setShowForm(true);
    setError('');
  };

  const handleFeatureChange = (idx, val) => {
    const updated = [...form.features];
    updated[idx] = val;
    setForm({ ...form, features: updated });
  };

  const addFeature = () => setForm({ ...form, features: [...form.features, ''] });

  const removeFeature = (idx) => {
    const updated = form.features.filter((_, i) => i !== idx);
    setForm({ ...form, features: updated.length > 0 ? updated : [''] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const data = {
        ...form,
        price: parseFloat(form.price),
        order: parseInt(form.order) || 0,
        features: form.features.filter((f) => f.trim()),
        commands: form.commands
          .split('\n')
          .map((cmd) => cmd.trim())
          .filter(Boolean),
      };

      if (editing) {
        await updateProduct(editing, data);
      } else {
        await createProduct(data);
      }

      await loadData();
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleProduct(id);
      await loadData();
    } catch (err) {
      console.error('Toggle failed:', err);
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deleteProduct(id);
      await loadData();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500 font-pixel text-sm animate-pulse">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-pixel text-sm text-red-400">
          MANAGE PRODUCTS ({products.length})
        </h2>
        <button
          onClick={handleNew}
          className="px-4 py-2 font-pixel text-xs bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors shadow-[0_0_15px_rgba(255,0,0,0.3)]"
        >
          + ADD PRODUCT
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-dark-surface border border-red-500/20 rounded-xl p-6 shadow-[0_0_20px_rgba(255,0,0,0.1)]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-pixel text-sm text-white">
              {editing ? 'EDIT PRODUCT' : 'NEW PRODUCT'}
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
                <label className="block text-gray-400 text-xs font-pixel mb-2">TITLE</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-pixel mb-2">PRICE ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-pixel mb-2">IMAGE URL</label>
              <input
                type="url"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50"
                placeholder="https://..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-400 text-xs font-pixel mb-2">COLLECTION</label>
                <select
                  value={form.collection}
                  onChange={(e) => setForm({ ...form, collection: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50"
                  required
                >
                  <option value="">Select...</option>
                  {collections.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-pixel mb-2">ORDER</label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50"
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                    className="accent-red-500 w-4 h-4"
                  />
                  <span className="text-gray-300 text-sm">Featured on homepage</span>
                </label>
              </div>
            </div>

            {/* Features */}
            <div>
              <label className="block text-gray-400 text-xs font-pixel mb-2">FEATURES</label>
              {form.features.map((f, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={f}
                    onChange={(e) => handleFeatureChange(idx, e.target.value)}
                    className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-red-500/50"
                    placeholder={`Feature ${idx + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeFeature(idx)}
                    className="px-3 text-red-400 hover:text-red-300 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addFeature}
                className="text-xs text-gray-500 hover:text-red-400 transition-colors mt-1"
              >
                + Add feature
              </button>
            </div>

            {/* Execution Commands */}
            <div>
              <label className="block text-gray-400 text-xs font-pixel mb-2">EXECUTION COMMANDS</label>
              <textarea
                value={form.commands}
                onChange={(e) => setForm({ ...form, commands: e.target.value })}
                rows={4}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50 font-mono resize-y"
                placeholder={`lp user {username} parent add vip\neco give {username} 1000\ncrate give {username} mythic 1`}
              />
              <p className="text-[10px] text-gray-500 mt-1">
                One command per line. Use <span className="text-red-400 font-mono">{'{username}'}</span> as placeholder for the buyer's Minecraft username.
              </p>
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

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <div
            key={product._id}
            className={`bg-dark-surface border rounded-xl overflow-hidden transition-all ${
              product.isActive
                ? 'border-white/10 hover:border-red-500/30'
                : 'border-red-500/20 opacity-60'
            }`}
          >
            {/* Image */}
            <div className="h-32 bg-black/50 flex items-center justify-center relative overflow-hidden">
              {product.image ? (
                <img src={product.image} alt={product.title} className="object-cover w-full h-full" />
              ) : (
                <span className="text-gray-600 text-3xl">📦</span>
              )}
              {!product.isActive && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="font-pixel text-xs text-red-400">INACTIVE</span>
                </div>
              )}
              {product.isFeatured && (
                <div className="absolute top-2 left-2 bg-yellow-500/90 text-black text-xs px-2 py-0.5 rounded font-bold">
                  ⭐ Featured
                </div>
              )}
              <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded font-pixel">
                ${product.price.toFixed(2)}
              </div>
            </div>

            <div className="p-4">
              <h3 className="text-white font-bold text-sm mb-1">{product.title}</h3>
              <p className="text-gray-500 text-xs mb-3">
                {product.collection?.name || 'No collection'}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(product)}
                  className="flex-1 px-3 py-1.5 text-xs bg-white/5 border border-white/10 text-gray-300 rounded hover:text-white hover:border-white/20 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleToggle(product._id)}
                  className={`flex-1 px-3 py-1.5 text-xs rounded transition-colors ${
                    product.isActive
                      ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20'
                      : 'bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20'
                  }`}
                >
                  {product.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDelete(product._id, product.title)}
                  className="px-3 py-1.5 text-xs bg-red-500/10 border border-red-500/30 text-red-400 rounded hover:bg-red-500/20 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-16">
          <span className="text-4xl mb-4 block">📦</span>
          <p className="text-gray-500 font-pixel text-xs">No products yet</p>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
