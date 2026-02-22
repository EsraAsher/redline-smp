import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';

const ProductSection = ({ id, title, slug, products }) => {
  return (
    <section id={id} className="py-20 px-6 max-w-7xl mx-auto border-t border-white/5">
      <div className="flex items-center mb-12">
        <div className="h-1 bg-linear-to-r from-transparent via-neon-purple to-transparent grow rounded-full opacity-50"></div>
        <h2 className="mx-8 text-4xl font-pixel text-center text-neon-cyan drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
          {title}
        </h2>
        <div className="h-1 bg-linear-to-r from-transparent via-neon-purple to-transparent grow rounded-full opacity-50"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((product) => (
          <ProductCard
            key={product._id || product.id}
            id={product._id || product.id}
            title={product.title}
            price={product.price}
            features={product.features}
            image={product.image}
          />
        ))}
      </div>

      {slug && (
        <div className="text-center mt-10">
          <Link
            to={`/collection/${slug}`}
            className="inline-block px-8 py-3 font-pixel text-xs bg-red-500/10 border border-red-500 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all duration-300 shadow-[0_0_10px_rgba(255,0,0,0.1)] hover:shadow-[0_0_20px_rgba(255,0,0,0.4)]"
          >
            VIEW ALL {title} →
          </Link>
        </div>
      )}
    </section>
  );
};

export default ProductSection;
