import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Only show on store-related pages (/store, /collection/*)
const STORE_ROUTES = ['/store'];
const isStorePage = (pathname) =>
  STORE_ROUTES.includes(pathname) || pathname.startsWith('/collection/');

const UsernameModal = ({ onClose }) => {
  const [username, setUsername] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();

  useEffect(() => {
    const stored = localStorage.getItem('mc_username');
    if (!stored && isStorePage(location.pathname)) {
      setIsOpen(true);
    }
  }, [location.pathname]);

  const validate = (name) => {
    if (!name.trim()) return 'Username is required.';
    if (name.trim().length < 3 || name.trim().length > 16) return 'Must be 3–16 characters.';
    if (!/^[a-zA-Z0-9_]+$/.test(name.trim())) return 'Only letters, numbers, and underscores.';
    return '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const err = validate(username);
    if (err) { setError(err); return; }
    localStorage.setItem('mc_username', username.trim());
    setIsOpen(false);
    onClose && onClose(username.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="bg-dark-surface border border-white/10 w-full sm:max-w-md sm:rounded-xl rounded-t-2xl p-6 sm:p-8 relative animate-bounce-in shadow-[0_-4px_40px_rgba(255,0,0,0.15)] sm:shadow-[0_0_40px_rgba(255,0,0,0.15)]">

        {/* Decorative top bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-red-600 via-red-500 to-red-600 sm:rounded-t-xl rounded-t-2xl" />

        {/* Mobile drag indicator */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5 sm:hidden" />

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <span className="text-2xl sm:text-3xl">⛏️</span>
          </div>
        </div>

        <h2 className="text-base sm:text-lg font-pixel text-white mb-1.5 text-center leading-relaxed">
          What's Your IGN?
        </h2>
        <p className="text-gray-400 text-xs sm:text-sm text-center mb-5 sm:mb-6">
          Enter your Minecraft username so we can deliver purchases to your account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                className={`w-full bg-black/40 border rounded-lg px-4 py-3.5 sm:py-3 text-white text-sm sm:text-base placeholder-gray-600 focus:outline-none transition-all font-mono ${
                  error
                    ? 'border-red-500/70 focus:border-red-400 focus:shadow-[0_0_10px_rgba(255,0,0,0.2)]'
                    : 'border-white/10 focus:border-red-500/60 focus:shadow-[0_0_10px_rgba(255,0,0,0.15)]'
                }`}
                placeholder="Enter username..."
                autoFocus
                maxLength={16}
                required
              />
              {username.trim() && !error && (
                <img
                  src={`https://mc-heads.net/avatar/${username.trim()}/32`}
                  alt=""
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded border border-white/10"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
            </div>
            {error && (
              <p className="text-red-400 text-xs mt-1.5 pl-1">{error}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 sm:py-3 rounded-lg font-pixel text-xs sm:text-sm transition-all duration-300 bg-red-500/10 border border-red-500 text-red-400 hover:bg-red-500 hover:text-white active:scale-[0.98] hover:shadow-[0_0_20px_rgba(255,0,0,0.3)]"
          >
            Continue to Store
          </button>
        </form>

        <p className="text-gray-600 text-[10px] sm:text-xs text-center mt-4">
          This is stored locally and never shared.
        </p>
      </div>
    </div>
  );
};

export default UsernameModal;
