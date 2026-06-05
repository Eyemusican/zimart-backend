import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getProducts } from '../api/products';
import ProductCard from '../components/ProductCard';

const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Food', 'Home', 'Sports', 'Beauty', 'Toys'];
const SORTS = [
  { value: 'newest',     label: 'Newest First' },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating',     label: 'Top Rated' },
  { value: 'trending',   label: 'Trending' },
];

const CAT_ICONS = {
  Electronics: '💻', Clothing: '👔', Books: '📚', Food: '🛒',
  Home: '🏠', Sports: '⚽', Beauty: '💄', Toys: '🎮',
};

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const limit = 12;

  const search   = searchParams.get('search')   ?? '';
  const category = searchParams.get('category') ?? '';
  const sort     = searchParams.get('sort')     ?? 'newest';
  const minPrice = searchParams.get('minPrice') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit, sort };
      if (search)   params.search   = search;
      if (category) params.category = category;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      const { data } = await getProducts(params);
      setProducts(data.products ?? []);
      setTotal(data.total ?? 0);
    } catch (_) {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, category, sort, minPrice, maxPrice]);

  useEffect(() => { setPage(1); }, [search, category, sort, minPrice, maxPrice]);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const setParam = (key, val) => {
    const p = new URLSearchParams(searchParams);
    if (val) p.set(key, val); else p.delete(key);
    setSearchParams(p);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-7">

        {/* ── Sidebar ── */}
        <aside className="w-full lg:w-60 shrink-0 space-y-5">
          {/* Categories */}
          <div className="card !p-5">
            <h3 className="font-extrabold text-slate-800 mb-4 text-sm uppercase tracking-wider">Category</h3>
            <div className="space-y-1">
              <button
                onClick={() => setParam('category', '')}
                className={`flex items-center gap-2.5 w-full text-left text-sm px-3 py-2 rounded-xl
                            font-medium transition-all ${
                  !category
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm shadow-violet-200'
                    : 'text-slate-600 hover:bg-violet-50 hover:text-violet-700'
                }`}
              >
                <span>🗂️</span> All Categories
              </button>
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => setParam('category', c)}
                  className={`flex items-center gap-2.5 w-full text-left text-sm px-3 py-2 rounded-xl
                              font-medium transition-all ${
                    category === c
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm shadow-violet-200'
                      : 'text-slate-600 hover:bg-violet-50 hover:text-violet-700'
                  }`}
                >
                  <span>{CAT_ICONS[c]}</span> {c}
                </button>
              ))}
            </div>
          </div>

          {/* Price range */}
          <div className="card !p-5">
            <h3 className="font-extrabold text-slate-800 mb-4 text-sm uppercase tracking-wider">Price Range</h3>
            <div className="space-y-2.5">
              <div>
                <label className="text-xs text-slate-500 font-semibold mb-1 block">Min Price ($)</label>
                <input
                  type="number" min="0" placeholder="0"
                  value={minPrice}
                  onChange={e => setParam('minPrice', e.target.value)}
                  className="input text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-semibold mb-1 block">Max Price ($)</label>
                <input
                  type="number" min="0" placeholder="Any"
                  value={maxPrice}
                  onChange={e => setParam('maxPrice', e.target.value)}
                  className="input text-sm"
                />
              </div>
              {(minPrice || maxPrice) && (
                <button
                  onClick={() => { setParam('minPrice', ''); setParam('maxPrice', ''); }}
                  className="w-full text-xs text-violet-600 font-semibold hover:text-violet-800
                             transition-colors py-1"
                >
                  Clear price filter
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {search ? `Results for "${search}"` : category ? `${CAT_ICONS[category] ?? ''} ${category}` : 'All Products'}
              </h1>
              <p className="text-sm text-slate-400 mt-0.5 font-medium">
                {total} product{total !== 1 ? 's' : ''} found
              </p>
            </div>
            <select
              value={sort}
              onChange={e => setParam('sort', e.target.value)}
              className="input text-sm w-auto min-w-[170px]"
            >
              {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {/* Active filters */}
          {(category || search || minPrice || maxPrice) && (
            <div className="flex flex-wrap gap-2 mb-5">
              {category && (
                <span className="flex items-center gap-1.5 bg-violet-100 text-violet-700 text-xs font-semibold
                                 px-3 py-1.5 rounded-full">
                  {CAT_ICONS[category]} {category}
                  <button onClick={() => setParam('category', '')} className="hover:text-violet-900 ml-0.5">×</button>
                </span>
              )}
              {search && (
                <span className="flex items-center gap-1.5 bg-indigo-100 text-indigo-700 text-xs font-semibold
                                 px-3 py-1.5 rounded-full">
                  🔍 "{search}"
                  <button onClick={() => setParam('search', '')} className="hover:text-indigo-900 ml-0.5">×</button>
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs font-semibold
                                 px-3 py-1.5 rounded-full">
                  💰 ${minPrice || '0'} – ${maxPrice || '∞'}
                  <button onClick={() => { setParam('minPrice', ''); setParam('maxPrice', ''); }}
                    className="hover:text-amber-900 ml-0.5">×</button>
                </span>
              )}
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
                  <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200" />
                  <div className="p-4 space-y-2.5">
                    <div className="h-2.5 bg-slate-200 rounded-full w-1/3" />
                    <div className="h-3.5 bg-slate-200 rounded-full" />
                    <div className="h-3.5 bg-slate-200 rounded-full w-4/5" />
                    <div className="h-9 bg-slate-100 rounded-xl mt-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-20 h-20 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-10 h-10 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-lg font-bold text-slate-700 mb-1">No products found</p>
              <p className="text-sm text-slate-400">Try different filters or search terms</p>
              <button
                onClick={() => { setSearchParams({}); }}
                className="mt-5 btn-secondary text-sm"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
              >
                ← Prev
              </button>
              {[...Array(totalPages)]
                .map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
                      page === i + 1
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-200'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-violet-300 hover:text-violet-700'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))
                .slice(Math.max(0, page - 3), page + 2)}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
