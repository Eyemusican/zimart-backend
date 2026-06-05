import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTrending, getProducts } from '../api/products';
import { getRecentlyViewed } from '../api/cart';
import ProductCard from '../components/ProductCard';

const CATEGORIES = [
  { name: 'Electronics', icon: '💻' },
  { name: 'Clothing',    icon: '👔' },
  { name: 'Books',       icon: '📚' },
  { name: 'Food',        icon: '🛒' },
  { name: 'Home',        icon: '🏠' },
  { name: 'Sports',      icon: '⚽' },
  { name: 'Beauty',      icon: '💄' },
  { name: 'Toys',        icon: '🎮' },
];

function SkeletonGrid({ count = 4, cols = 4 }) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-${cols} gap-4`}>
      {[...Array(count)].map((_, i) => (
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
  );
}

function SectionHeader({ icon, title, subtitle, link }) {
  return (
    <div className="flex items-end justify-between mb-7">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">{icon}</span>
          <h2 className="text-2xl font-extrabold text-slate-900">{title}</h2>
        </div>
        {subtitle && <p className="text-slate-500 text-sm">{subtitle}</p>}
      </div>
      {link && (
        <Link to={link}
          className="text-sm font-semibold text-violet-600 hover:text-violet-800
                     flex items-center gap-1 transition-all group">
          View all
          <span className="group-hover:translate-x-0.5 transition-transform">→</span>
        </Link>
      )}
    </div>
  );
}

export default function HomePage() {
  const [trending, setTrending]  = useState([]);
  const [recent, setRecent]      = useState([]);
  const [featured, setFeatured]  = useState([]);
  const [loadingT, setLT]        = useState(true);

  useEffect(() => {
    getTrending()
      .then(r => setTrending(r.data?.slice(0, 8) ?? []))
      .catch(() => {})
      .finally(() => setLT(false));

    getProducts({ limit: 8, sort: 'newest' })
      .then(r => setFeatured(r.data?.products ?? []))
      .catch(() => {});

    getRecentlyViewed()
      .then(r => setRecent(r.data?.products?.slice(0, 6) ?? []))
      .catch(() => {});
  }, []);

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-950 via-violet-800 to-indigo-900">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-500/20 rounded-full
                        blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/25 rounded-full
                        blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-amber-400/10 rounded-full
                        blur-2xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 py-24 flex flex-col lg:flex-row items-center gap-16">
          {/* Text */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-amber-300
                            text-xs font-semibold px-4 py-1.5 rounded-full mb-6 border border-white/20">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
              50+ Products Available Now
            </div>
            <h1 className="text-5xl lg:text-6xl font-extrabold leading-[1.1] text-white mb-5 tracking-tight">
              Shop Everything<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                You Love
              </span>
            </h1>
            <p className="text-violet-200 text-lg max-w-md mx-auto lg:mx-0 mb-9 leading-relaxed">
              Discover thousands of products, track orders in real time, and enjoy lightning-fast checkout.
            </p>
            <div className="flex gap-4 flex-wrap justify-center lg:justify-start">
              <Link to="/products"
                className="bg-gradient-to-r from-amber-400 to-orange-400 text-violet-950 font-bold
                           px-9 py-3.5 rounded-2xl hover:from-amber-300 hover:to-orange-300
                           transition-all shadow-lg shadow-amber-500/30 hover:shadow-xl
                           hover:shadow-amber-500/40 hover:-translate-y-0.5 active:translate-y-0">
                Shop Now →
              </Link>
              <Link to="/register"
                className="bg-white/10 backdrop-blur-sm text-white font-semibold border border-white/30
                           px-9 py-3.5 rounded-2xl hover:bg-white/20 transition-all active:scale-95">
                Join Free
              </Link>
            </div>
          </div>

          {/* Stats cards */}
          <div className="flex lg:flex-col gap-4 shrink-0">
            {[
              { value: '50+',  label: 'Products', icon: '📦' },
              { value: 'Fast', label: 'Delivery',  icon: '⚡' },
              { value: '24/7', label: 'Support',   icon: '💬' },
            ].map(s => (
              <div key={s.label}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl
                           p-4 text-center min-w-[100px] hover:bg-white/15 transition-colors">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-2xl font-extrabold text-white">{s.value}</div>
                <div className="text-xs text-violet-300 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Category chips ── */}
      <section className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex gap-2.5 overflow-x-auto pb-0.5 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <Link key={cat.name} to={`/products?category=${cat.name}`}
                className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-violet-50
                           border border-slate-200 hover:border-violet-300 rounded-full text-sm
                           font-semibold text-slate-600 hover:text-violet-700 transition-all
                           whitespace-nowrap shrink-0 active:scale-95">
                <span>{cat.icon}</span>
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-4 py-14 space-y-16">

        {/* Trending */}
        <section>
          <SectionHeader
            icon="🔥" title="Trending Now"
            subtitle="Most popular products this week"
            link="/products?sort=trending"
          />
          {loadingT
            ? <SkeletonGrid />
            : trending.length > 0
            ? <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {trending.map(p => <ProductCard key={p._id} product={p} />)}
              </div>
            : <p className="text-slate-400 text-sm">No trending products yet.</p>
          }
        </section>

        {/* Recently viewed */}
        {recent.length > 0 && (
          <section>
            <SectionHeader
              icon="👁️" title="Recently Viewed"
              subtitle="Pick up where you left off"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {recent.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </section>
        )}

        {/* New arrivals */}
        <section>
          <SectionHeader
            icon="✨" title="New Arrivals"
            subtitle="Fresh picks just added"
            link="/products?sort=newest"
          />
          {featured.length > 0
            ? <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {featured.map(p => <ProductCard key={p._id} product={p} />)}
              </div>
            : <SkeletonGrid />
          }
        </section>

        {/* Seller CTA */}
        <section className="relative overflow-hidden rounded-3xl
                             bg-gradient-to-r from-violet-900 via-violet-800 to-indigo-900
                             p-12 text-center text-white">
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-2xl translate-x-1/3 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-400 rounded-full blur-2xl -translate-x-1/3 translate-y-1/2" />
          </div>
          <div className="relative">
            <span className="inline-block bg-amber-400/20 text-amber-300 text-xs font-bold px-4 py-1.5
                             rounded-full border border-amber-400/30 mb-5 uppercase tracking-wider">
              For Sellers
            </span>
            <h2 className="text-4xl font-extrabold mb-4">Become a Seller on ZiMart</h2>
            <p className="text-violet-200 mb-9 max-w-lg mx-auto text-lg leading-relaxed">
              List your products and reach thousands of customers. It's free to get started.
            </p>
            <Link to="/register"
              className="inline-block bg-gradient-to-r from-amber-400 to-orange-400 text-violet-950
                         font-bold px-10 py-4 rounded-2xl hover:from-amber-300 hover:to-orange-300
                         transition-all shadow-lg shadow-amber-500/30 hover:-translate-y-0.5 active:scale-95">
              Start Selling Today →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
