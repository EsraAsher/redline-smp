import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { fetchCollections } from '../api';

const Navbar = ({ username }) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const [collections, setCollections] = useState([]);
  const [scrolled, setScrolled] = useState(false);
  const mobileDropdownRef = useRef(null);
  const { cartCount, setCartOpen, justAdded } = useCart();
  const location = useLocation();

  // Check if we're on the store or a store-related page
  const isStorePage = location.pathname === '/store' || location.pathname.startsWith('/collection/');

  // Scroll detection for blur effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetchCollections()
      .then(setCollections)
      .catch(() => setCollections([]));
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mobileDropdownRef.current && mobileDropdownRef.current.contains(e.target)) return;
      setMoreOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className={`fixed w-full z-40 top-0 left-0 p-3 sm:p-4 md:p-6 transition-all duration-300 ${scrolled ? 'bg-dark-bg/70 backdrop-blur-md shadow-[0_2px_20px_rgba(0,0,0,0.5)]' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/">
          <img
            src="https://i.postimg.cc/ZRSXwVzv/logo-nobg-png.png"
            alt="Redline SMP"
            className="h-8 sm:h-10 md:h-12 w-auto object-contain"
          />
        </Link>

        <div className="hidden md:flex gap-8 font-pixel text-xs text-gray-300 items-center">
          <Link to="/store" className="hover:text-red-400 transition-colors">STORE</Link>
          <Link to="/vote" className="hover:text-red-400 transition-colors">VOTE US</Link>

          {/* Collections shown only on store pages */}
          {isStorePage && collections.map((col) => (
            <Link
              key={col._id}
              to={`/collection/${col.slug}`}
              className="hover:text-red-400 transition-colors"
            >
              {col.name.toUpperCase()}
            </Link>
          ))}

          <Link to="/help" className="hover:text-red-400 transition-colors">HELP</Link>
          <Link to="/about" className="hover:text-red-400 transition-colors">ABOUT US</Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile MENU button */}
          <div className="relative md:hidden" ref={mobileDropdownRef}>
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className="font-pixel text-sm text-gray-300 hover:text-red-400 transition-colors flex items-center gap-2"
            >
              <span>MENU</span>
              <span className="text-base leading-none">☰</span>
            </button>
            {moreOpen && (
              <div className="absolute top-full right-0 mt-3 w-52 bg-dark-surface border border-red-500/30 rounded-lg shadow-[0_0_20px_rgba(255,0,0,0.15)] overflow-hidden">
                <Link to="/store" className="block px-6 py-3.5 text-gray-300 hover:text-white hover:bg-red-500/10 transition-all font-pixel text-sm border-b border-white/5" onClick={() => setMoreOpen(false)}>
                  🛒 STORE
                </Link>
                <Link to="/vote" className="block px-6 py-3.5 text-gray-300 hover:text-white hover:bg-red-500/10 transition-all font-pixel text-sm border-b border-white/5" onClick={() => setMoreOpen(false)}>
                  🗳️ VOTE US
                </Link>
                {collections.map((col) => (
                  <Link
                    key={col._id}
                    to={`/collection/${col.slug}`}
                    className="block px-6 py-3.5 text-gray-300 hover:text-white hover:bg-red-500/10 transition-all font-pixel text-sm border-b border-white/5"
                    onClick={() => setMoreOpen(false)}
                  >
                    {col.name.toUpperCase()}
                  </Link>
                ))}
                <Link to="/help" className="block px-6 py-3.5 text-gray-300 hover:text-white hover:bg-red-500/10 transition-all font-pixel text-sm border-b border-white/5" onClick={() => setMoreOpen(false)}>
                  🎫 HELP
                </Link>
                <Link to="/about" className="block px-6 py-3.5 text-gray-300 hover:text-white hover:bg-red-500/10 transition-all font-pixel text-sm" onClick={() => setMoreOpen(false)}>
                  ℹ️ ABOUT US
                </Link>
              </div>
            )}
          </div>

          {isStorePage && username && (
            <span className="hidden sm:inline-block text-red-400 font-mono text-xs border border-red-500/30 px-3 py-1 rounded bg-black/50">
              <span className="text-gray-400 mr-2">User:</span>
              {username}
            </span>
          )}
          {isStorePage && (
            <button
              onClick={() => setCartOpen(true)}
              className={`font-pixel text-[10px] sm:text-xs px-3 py-1.5 sm:px-4 sm:py-2 rounded transition-all duration-300 ${
                justAdded
                  ? 'bg-red-400 text-black shadow-[0_0_20px_rgba(255,0,0,0.6)] scale-110'
                  : 'bg-red-500 text-black hover:bg-white'
              }`}
            >
              CART ({cartCount})
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
