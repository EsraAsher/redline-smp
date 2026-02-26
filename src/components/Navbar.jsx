import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { fetchCollections } from '../api';

const Navbar = ({ username }) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collections, setCollections] = useState([]);
  const [scrolled, setScrolled] = useState(false);
  const mobileDropdownRef = useRef(null);
  const { cartCount, setCartOpen, justAdded } = useCart();
  const location = useLocation();

  // Check if we're on the store or a store-related page
  const isStorePage = location.pathname === '/store' || location.pathname.startsWith('/collection/');

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
    setMoreOpen(false);
  }, [location.pathname]);

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

  // Close mobile dropdown when clicking outside (non-store pages)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mobileDropdownRef.current && mobileDropdownRef.current.contains(e.target)) return;
      setMoreOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  /* ═══════════════════ STORE NAVBAR ═══════════════════ */
  if (isStorePage) {
    return (
      <>
        <nav className={`fixed w-full z-40 top-0 left-0 p-3 sm:p-4 md:p-6 transition-all duration-300 ${scrolled ? 'bg-dark-bg/70 backdrop-blur-md shadow-[0_2px_20px_rgba(0,0,0,0.5)]' : 'bg-transparent'}`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Left - Hamburger */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="text-gray-300 hover:text-red-400 transition-colors p-1"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Center - Logo */}
            <Link to="/" className="absolute left-1/2 -translate-x-1/2">
              <img
                src="https://i.postimg.cc/ZRSXwVzv/logo-nobg-png.png"
                alt="Redline SMP"
                className="h-8 sm:h-10 md:h-12 w-auto object-contain"
              />
            </Link>

            {/* Right - Username + Cart */}
            <div className="flex items-center gap-2 sm:gap-4">
              {username && (
                <span className="hidden sm:inline-block text-red-400 font-mono text-xs border border-red-500/30 px-3 py-1 rounded bg-black/50">
                  <span className="text-gray-400 mr-2">User:</span>
                  {username}
                </span>
              )}
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
            </div>
          </div>
        </nav>

        {/* Off-canvas backdrop */}
        <div
          className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setDrawerOpen(false)}
        />

        {/* Off-canvas drawer */}
        <aside
          className={`fixed top-0 left-0 z-50 h-full w-72 sm:w-80 bg-dark-surface border-r border-white/10 shadow-[5px_0_30px_rgba(0,0,0,0.5)] transform transition-transform duration-300 ease-in-out ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between p-5 border-b border-white/10">
            <Link to="/" onClick={() => setDrawerOpen(false)}>
              <img
                src="https://i.postimg.cc/ZRSXwVzv/logo-nobg-png.png"
                alt="Redline SMP"
                className="h-8 w-auto"
              />
            </Link>
            <button
              onClick={() => setDrawerOpen(false)}
              className="text-gray-400 hover:text-white transition-colors p-1"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Drawer navigation */}
          <nav className="flex flex-col py-4 overflow-y-auto h-[calc(100%-65px)]">
            {/* Main links */}
            <Link
              to="/store"
              className="px-6 py-3.5 text-gray-300 hover:text-white hover:bg-red-500/10 transition-all font-pixel text-sm border-l-2 border-transparent hover:border-red-500"
              onClick={() => setDrawerOpen(false)}
            >
              🛒 STORE
            </Link>
            <Link
              to="/vote"
              className="px-6 py-3.5 text-gray-300 hover:text-white hover:bg-red-500/10 transition-all font-pixel text-sm border-l-2 border-transparent hover:border-red-500"
              onClick={() => setDrawerOpen(false)}
            >
              🗳️ VOTE US
            </Link>

            {/* Collections divider */}
            {collections.length > 0 && (
              <>
                <div className="px-6 pt-5 pb-2">
                  <span className="font-pixel text-[10px] text-gray-500 tracking-widest uppercase">Collections</span>
                </div>
                {collections.map((col) => (
                  <Link
                    key={col._id}
                    to={`/collection/${col.slug}`}
                    className={`px-6 py-3 text-sm transition-all font-pixel border-l-2 ${
                      location.pathname === `/collection/${col.slug}`
                        ? 'text-red-400 bg-red-500/10 border-red-500'
                        : 'text-gray-400 hover:text-white hover:bg-red-500/10 border-transparent hover:border-red-500'
                    }`}
                    onClick={() => setDrawerOpen(false)}
                  >
                    {col.name.toUpperCase()}
                  </Link>
                ))}
              </>
            )}

            {/* Other links divider */}
            <div className="px-6 pt-5 pb-2">
              <span className="font-pixel text-[10px] text-gray-500 tracking-widest uppercase">More</span>
            </div>
            <Link
              to="/help"
              className="px-6 py-3.5 text-gray-300 hover:text-white hover:bg-red-500/10 transition-all font-pixel text-sm border-l-2 border-transparent hover:border-red-500"
              onClick={() => setDrawerOpen(false)}
            >
              🎫 HELP
            </Link>
            <Link
              to="/about"
              className="px-6 py-3.5 text-gray-300 hover:text-white hover:bg-red-500/10 transition-all font-pixel text-sm border-l-2 border-transparent hover:border-red-500"
              onClick={() => setDrawerOpen(false)}
            >
              ℹ️ ABOUT US
            </Link>
            <a
              href="https://discord.gg/wBNMMj2PE4"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 text-gray-300 hover:text-white hover:bg-red-500/10 transition-all font-pixel text-sm border-l-2 border-transparent hover:border-red-500"
              onClick={() => setDrawerOpen(false)}
            >
              💬 DISCORD ↗
            </a>
          </nav>
        </aside>
      </>
    );
  }

  /* ═══════════════════ DEFAULT NAVBAR (non-store) ═══════════════════ */
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
                <Link to="/help" className="block px-6 py-3.5 text-gray-300 hover:text-white hover:bg-red-500/10 transition-all font-pixel text-sm border-b border-white/5" onClick={() => setMoreOpen(false)}>
                  🎫 HELP
                </Link>
                <Link to="/about" className="block px-6 py-3.5 text-gray-300 hover:text-white hover:bg-red-500/10 transition-all font-pixel text-sm" onClick={() => setMoreOpen(false)}>
                  ℹ️ ABOUT US
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
