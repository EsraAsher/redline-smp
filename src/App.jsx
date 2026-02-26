import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Particles from './components/Particles';
import ProductSection from './components/ProductSection';
import UsernameModal from './components/UsernameModal';
import CartDrawer from './components/CartDrawer';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CreatorAuthProvider } from './context/CreatorAuthContext';
import { fetchHomepageProducts } from './api';
import LandingPage from './pages/LandingPage';
import HelpPage from './pages/HelpPage';
import AboutPage from './pages/AboutPage';
import CollectionPage from './pages/CollectionPage';
import VotePage from './pages/VotePage';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import TermsPage from './pages/TermsPage';
import ReferralApplyPage from './pages/ReferralApplyPage';
import CreatorLoginPage from './pages/CreatorLoginPage';
import CreatorCallbackPage from './pages/CreatorCallbackPage';
import CreatorDashboardPage from './pages/CreatorDashboardPage';
import CreatorProgramPage from './pages/CreatorProgramPage';

function StorePage() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await fetchHomepageProducts();
      setSections(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative z-10 w-full">
      <div className="space-y-6 sm:space-y-8 md:space-y-10 pb-12 sm:pb-20 pt-24 sm:pt-28">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-gray-500 font-pixel text-sm animate-pulse">Loading store...</div>
          </div>
        ) : sections.length === 0 ? (
          <div className="text-center py-32">
            <span className="text-5xl block mb-4">🏪</span>
            <p className="text-gray-500 font-pixel text-xs">Store coming soon</p>
          </div>
        ) : (
          sections.map((section) => (
            <ProductSection
              key={section.collection._id}
              id={section.collection.slug}
              title={section.collection.name.toUpperCase()}
              slug={section.collection.slug}
              products={section.products}
            />
          ))
        )}
      </div>

      <footer className="py-8 sm:py-12 border-t border-white/10 mt-12 sm:mt-20 text-center text-gray-500 text-xs sm:text-sm px-4">
        &copy; 2026 Redline SMP. Not affiliated with Mojang AB or Microsoft.
      </footer>
    </main>
  );
}

// Protected admin route wrapper
function AdminRoute({ children }) {
  const { admin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 font-pixel text-sm animate-pulse">Loading...</div>
      </div>
    );
  }

  return admin ? children : <AdminLogin />;
}

function App() {
  const [username, setUsername] = useState(localStorage.getItem('mc_username') || '');

  return (
    <Router>
      <AuthProvider>
        <CreatorAuthProvider>
          <CartProvider>
            <div className="min-h-screen text-white font-sans selection:bg-neon-purple selection:text-white overflow-x-hidden">
              <Particles />
              <Navbar username={username} />

              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/store" element={<StorePage />} />
                <Route path="/vote" element={<VotePage />} />
                <Route path="/help" element={<HelpPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/collection/:slug" element={<CollectionPage />} />
                <Route path="/creators" element={<CreatorProgramPage />} />
                <Route path="/apply" element={<ReferralApplyPage />} />

                {/* Creator dashboard routes */}
                <Route path="/creator/login" element={<CreatorLoginPage />} />
                <Route path="/creator/callback" element={<CreatorCallbackPage />} />
                <Route path="/creator/dashboard" element={<CreatorDashboardPage />} />

                {/* Hidden admin route */}
                <Route
                  path="/adminishere"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>

              <CartDrawer />
              <UsernameModal onClose={setUsername} />
            </div>
          </CartProvider>
        </CreatorAuthProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
