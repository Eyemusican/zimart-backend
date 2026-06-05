import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById } from '../api/products';
import { addToRecentlyViewed } from '../api/cart';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function ProductDetailPage() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { addItem } = useCart();
  const { user }    = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty]         = useState(1);
  const [adding, setAdding]   = useState(false);
  const [added, setAdded]     = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    setLoading(true);
    getProductById(id)
      .then(r => {
        setProduct(r.data);
        addToRecentlyViewed(id).catch(() => {});
      })
      .catch(() => setError('Product not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      await addItem(id, qty);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    navigate('/cart');
  };

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-pulse">
        <div className="h-96 bg-gradient-to-br from-violet-50 to-slate-100 rounded-3xl" />
        <div className="space-y-5">
          <div className="h-4 bg-slate-200 rounded-full w-1/4" />
          <div className="h-8 bg-slate-200 rounded-xl w-3/4" />
          <div className="h-6 bg-slate-200 rounded-full w-1/4" />
          <div className="h-4 bg-slate-200 rounded-full" />
          <div className="h-4 bg-slate-200 rounded-full w-5/6" />
          <div className="h-4 bg-slate-200 rounded-full w-4/5" />
          <div className="h-14 bg-slate-200 rounded-2xl mt-4" />
        </div>
      </div>
    </div>
  );

  if (error || !product) return (
    <div className="text-center py-24 text-slate-400">
      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
        <svg className="w-10 h-10 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <p className="text-lg font-bold text-slate-700 mb-2">{error || 'Product not found.'}</p>
      <button onClick={() => navigate(-1)} className="mt-4 btn-primary px-8 py-2.5">Go Back</button>
    </div>
  );

  const stars   = Math.round(product.avgRating ?? 0);
  const inStock = product.stock > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-400 mb-8">
        <button onClick={() => navigate('/')} className="hover:text-violet-600 font-medium transition-colors">Home</button>
        <span className="text-slate-300">/</span>
        <button onClick={() => navigate('/products')} className="hover:text-violet-600 font-medium transition-colors">Products</button>
        <span className="text-slate-300">/</span>
        <span className="text-slate-600 font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Image */}
        <div className="bg-gradient-to-br from-violet-50 via-indigo-50 to-slate-100 rounded-3xl
                        h-96 flex items-center justify-center overflow-hidden shadow-sm">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name}
              className="h-full w-full object-cover rounded-3xl" />
          ) : (
            <svg className="w-28 h-28 text-violet-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
            </svg>
          )}
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div>
            <span className="badge bg-violet-100 text-violet-700 font-bold mb-3 inline-block">
              {product.category}
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {product.name}
            </h1>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-3">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map(n => (
                <svg key={n} className={`w-5 h-5 ${n <= stars ? 'text-amber-400' : 'text-slate-200'}`}
                  fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-slate-500 text-sm">
              <span className="font-bold text-slate-700">{product.avgRating?.toFixed(1) ?? '0.0'}</span>
              {' '}({product.reviewCount ?? 0} reviews)
            </span>
          </div>

          <p className="text-4xl font-extrabold text-slate-900">
            ${Number(product.price).toFixed(2)}
          </p>

          <p className="text-slate-600 leading-relaxed text-[15px]">{product.description}</p>

          {/* Stock status */}
          <div className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold ${
            inStock
              ? product.stock <= (product.lowStockThreshold ?? 10)
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-600 border border-red-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              inStock
                ? product.stock <= (product.lowStockThreshold ?? 10) ? 'bg-amber-500' : 'bg-emerald-500'
                : 'bg-red-500'
            }`} />
            {inStock
              ? product.stock <= (product.lowStockThreshold ?? 10)
                ? `Only ${product.stock} left!`
                : `In Stock (${product.stock} available)`
              : 'Out of Stock'}
          </div>

          {/* Quantity + actions */}
          {inStock && (
            <div className="space-y-4 pt-1">
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-slate-700">Quantity:</span>
                <div className="flex items-center border-2 border-slate-200 rounded-xl overflow-hidden">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-violet-50
                               text-slate-600 hover:text-violet-700 font-bold text-lg transition-colors">
                    −
                  </button>
                  <span className="w-12 text-center font-bold text-slate-900">{qty}</span>
                  <button onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-violet-50
                               text-slate-600 hover:text-violet-700 font-bold text-lg transition-colors">
                    +
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl border border-red-200">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={adding}
                  className={`flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 ${
                    added
                      ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-200'
                      : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-md hover:shadow-lg hover:shadow-violet-200 active:scale-[0.98]'
                  } disabled:opacity-60`}
                >
                  {added ? '✓ Added to Cart!' : adding ? 'Adding…' : 'Add to Cart'}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={adding}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-sm btn-secondary disabled:opacity-60"
                >
                  Buy Now
                </button>
              </div>
            </div>
          )}

          {/* Seller info */}
          {product.seller?.name && (
            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-full
                              flex items-center justify-center text-violet-600 font-bold text-sm">
                {product.seller.name[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-xs text-slate-400">Sold by</p>
                <p className="text-sm font-bold text-slate-700">{product.seller.name}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
