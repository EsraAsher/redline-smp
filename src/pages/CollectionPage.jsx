import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchCollectionBySlug } from '../api';
import ProductCard from '../components/ProductCard';

const CollectionPage = () => {
  const { slug } = useParams();
  const [collection, setCollection] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCollection();
  }, [slug]);

  const loadCollection = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchCollectionBySlug(slug);
      setCollection(data.collection);
      setProducts(data.products);
    } catch (err) {
      setError(err.message || 'Collection not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="relative z-10 pt-20 sm:pt-28 pb-12 sm:pb-20 px-4 sm:px-6 max-w-7xl mx-auto min-h-screen">
        <div className="flex items-center justify-center py-32">
          <div className="text-gray-500 font-pixel text-sm animate-pulse">Loading...</div>
        </div>
      </main>
    );
  }

  if (error || !collection) {
    return (
      <main className="relative z-10 pt-20 sm:pt-28 pb-12 sm:pb-20 px-4 sm:px-6 max-w-7xl mx-auto min-h-screen text-center">
        <h1 className="font-pixel text-2xl sm:text-3xl text-red-400 mb-4">NOT FOUND</h1>
        <p className="text-gray-500 mb-8">{error || 'This collection does not exist.'}</p>
        <Link
          to="/"
          className="inline-block px-6 py-3 font-pixel text-xs bg-red-500/10 border border-red-500 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all"
        >
          ← BACK TO STORE
        </Link>
      </main>
    );
  }

  return (
    <main className="relative z-10 pt-20 sm:pt-28 pb-12 sm:pb-20 px-4 sm:px-6 max-w-7xl mx-auto min-h-screen">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 sm:mb-8">
        <Link to="/" className="hover:text-red-400 transition-colors">Store</Link>
        <span>›</span>
        <span className="text-red-400">{collection.name}</span>
      </div>

      {/* Header */}
      <div className="text-center mb-8 sm:mb-12 md:mb-16">
        <div className="flex items-center mb-4 sm:mb-6">
          <div className="h-1 bg-linear-to-r from-transparent via-red-500/50 to-transparent grow rounded-full"></div>
          <h1 className="mx-4 sm:mx-8 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-pixel text-red-500 drop-shadow-[0_0_15px_rgba(255,0,0,0.5)]">
            {collection.name.toUpperCase()}
          </h1>
          <div className="h-1 bg-linear-to-r from-transparent via-red-500/50 to-transparent grow rounded-full"></div>
        </div>
        {collection.description && (
          <p className="text-gray-400 max-w-xl mx-auto">{collection.description}</p>
        )}
      </div>

      {/* Products */}
      {products.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-5xl block mb-4">📦</span>
          <p className="text-gray-500 font-pixel text-xs">No products in this collection yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              id={product._id}
              title={product.title}
              price={product.price}
              features={product.features}
              image={product.image}
            />
          ))}
        </div>
      )}

      {/* Back */}
      <div className="text-center mt-10 sm:mt-16">
        <Link
          to="/"
          className="inline-block px-6 py-3 font-pixel text-xs bg-red-500/10 border border-red-500 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-[0_0_10px_rgba(255,0,0,0.1)] hover:shadow-[0_0_20px_rgba(255,0,0,0.4)]"
        >
          ← BACK TO STORE
        </Link>
      </div>
    </main>
  );
};

export default CollectionPage;
