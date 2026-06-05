import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useState } from 'react';

export default function ProductCard({ product }) {
  const { addItem }         = useCart();
  const [adding, setAdding] = useState(false);
  const [added, setAdded]   = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      await addItem(product._id, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } finally {
      setAdding(false);
    }
  };

  const stars = Math.round(product.avgRating ?? 0);

  return (
    <Link
      to={`/products/${product._id}`}
      className="group flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm
                 hover:shadow-xl hover:shadow-violet-100/60 hover:-translate-y-1.5
                 transition-all duration-300 overflow-hidden"
    >
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-violet-50 via-indigo-50 to-slate-100 overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <svg className="w-16 h-16 text-violet-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
            </svg>
          </div>
        )}

        {/* Stock badges */}
        {product.stock === 0 && (
          <span className="absolute top-2.5 left-2.5 bg-red-500 text-white text-[10px] font-bold
                           px-2 py-0.5 rounded-full shadow-sm">
            Out of Stock
          </span>
        )}
        {product.stock > 0 && product.stock <= (product.lowStockThreshold ?? 10) && (
          <span className="absolute top-2.5 left-2.5 bg-amber-500 text-white text-[10px] font-bold
                           px-2 py-0.5 rounded-full shadow-sm">
            Low Stock
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col px-4 pt-3 pb-1 gap-1.5">
        <span className="text-[11px] font-bold text-violet-500 uppercase tracking-wider">
          {typeof product.category === 'object' ? product.category?.name : product.category}
        </span>
        <h3 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2
                       group-hover:text-violet-700 transition-colors">
          {product.name}
        </h3>

        {/* Stars */}
        <div className="flex items-center gap-1">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(n => (
              <svg key={n} className={`w-3 h-3 ${n <= stars ? 'text-amber-400' : 'text-slate-200'}`}
                fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-xs text-slate-400">({product.reviewCount ?? 0})</span>
        </div>

        <p className="text-xl font-extrabold text-slate-900 mt-auto pt-1">
          ${Number(product.price).toFixed(2)}
        </p>
      </div>

      {/* Add to cart */}
      <div className="px-4 pb-4 pt-2">
        <button
          onClick={handleAdd}
          disabled={adding || product.stock === 0}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
            added
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : product.stock === 0
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-sm hover:shadow-md hover:shadow-violet-200 active:scale-[0.98]'
          }`}
        >
          {added ? '✓ Added to Cart!' : adding ? 'Adding…' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </Link>
  );
}
