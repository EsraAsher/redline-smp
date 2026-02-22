import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Hero from './components/Hero';
import Navbar from './components/Navbar';
import Particles from './components/Particles';
import ProductSection from './components/ProductSection';
import UsernameModal from './components/UsernameModal';
import CartDrawer from './components/CartDrawer';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { fetchHomepageProducts } from './api';
import HelpPage from './pages/HelpPage';
import AboutPage from './pages/AboutPage';
import CollectionPage from './pages/CollectionPage';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';

function HomePage() {
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
      <Hero />

      <div className="space-y-20 pb-20">
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

      <footer className="py-12 border-t border-white/10 mt-20 text-center text-gray-500 text-sm">
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
        <CartProvider>
          <div className="min-h-screen text-white font-sans selection:bg-neon-purple selection:text-white overflow-x-hidden">
            <Particles />
            <Navbar username={username} />

            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/collection/:slug" element={<CollectionPage />} />

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
      </AuthProvider>
    </Router>
  );
}

export default App;
