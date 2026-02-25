import { useState } from 'react';
import { useCart } from '../context/CartContext';

const ProductCard = ({ id, title, price, features, image }) => {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addToCart({ id, title, price, image });
    setAdded(true);
    setTimeout(() => setAdded(false), 800);
  };

  return (
    <div className="group relative bg-dark-surface/80 border border-white/10 rounded-xl overflow-hidden hover:border-red-500/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,0,0,0.2)] transform hover:-translate-y-2">
      <div className="absolute inset-0 bg-linear-to-br from-red-500/5 to-red-900/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {/* Image Area */}
      <div className="h-36 sm:h-48 bg-black/50 flex items-center justify-center relative overflow-hidden">
        {image ? (
          <img src={image} alt={title} className="object-cover w-full h-full" />
        ) : (
          <div className="text-red-400 font-pixel text-4xl opacity-50">?</div>
        )}
        <div className="absolute top-2 right-2 bg-red-600 text-white font-bold px-2 py-1 rounded text-xs font-pixel">
          ₹{price}
        </div>
      </div>

      <div className="p-4 sm:p-6 relative z-10">
        <h3 className="text-base sm:text-xl font-bold font-pixel text-white mb-3 sm:mb-4 group-hover:text-red-400 transition-colors">{title}</h3>
        
        <ul className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6 text-sm text-gray-300">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-center">
              <span className="text-red-400 mr-2">›</span> {feature}
            </li>
          ))}
        </ul>

        <button
          onClick={handleAdd}
          className={`w-full py-3 font-pixel text-sm rounded transition-all duration-300 ${
            added
              ? 'bg-green-600 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]'
              : 'bg-red-500/10 border border-red-500 text-red-400 hover:bg-red-500 hover:text-white shadow-[0_0_10px_rgba(255,0,0,0.1)] hover:shadow-[0_0_20px_rgba(255,0,0,0.4)]'
          }`}
        >
          {added ? '✓ Added!' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
