import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount }    = useCart();
  const navigate         = useNavigate();
  const [query, setQuery]    = useState('');
  const [menuOpen, setMenu]  = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/products?search=${encodeURIComponent(query.trim())}`);
  };

  const handleLogout = async () => {
    setMenu(false);
    await logout();
    navigate('/login');
  };

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-violet-950/96 backdrop-blur-md shadow-lg shadow-violet-950/30'
        : 'bg-gradient-to-r from-violet-900 via-violet-800 to-indigo-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16 gap-4">

        {/* Logo */}
        <Link to="/" className="shrink-0 flex items-center gap-1.5">
          <span className="text-xl font-extrabold tracking-tight text-white">Zi</span>
          <span className="text-xl font-extrabold tracking-tight text-amber-400">Mart</span>
          <span className="hidden sm:inline-block ml-1 text-[10px] font-semibold bg-amber-400/20
                           text-amber-300 px-1.5 py-0.5 rounded-full border border-amber-400/30 leading-none">
            SHOP
          </span>
        </Link>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-slate-400 pointer-events-none">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search products, brands, categories…"
              className="w-full pl-10 pr-24 py-2.5 bg-white text-slate-800 rounded-full text-sm
                         focus:outline-none focus:ring-2 focus:ring-amber-400/50 shadow-inner
                         placeholder-slate-400"
            />
            <button type="submit"
              className="absolute right-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white
                         px-4 py-1.5 rounded-full text-sm font-semibold hover:from-violet-700
                         hover:to-indigo-700 transition-all shadow-sm active:scale-95">
              Search
            </button>
          </div>
        </form>

        {/* Right actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Link to="/products"
            className="hidden md:flex items-center gap-1.5 text-sm text-violet-200 hover:text-white
                       transition-colors px-3 py-2 rounded-lg hover:bg-white/10">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Products
          </Link>

          {/* Cart icon */}
          <Link to="/cart"
            className="relative flex items-center justify-center w-10 h-10 text-violet-200
                       hover:text-white hover:bg-white/10 rounded-xl transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.5 6h13M7 13L5.4 5M10 21a1 1 0 11-2 0 1 1 0 012 0zm9 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-amber-400 text-violet-900 text-[10px]
                               rounded-full min-w-[18px] h-[18px] flex items-center justify-center
                               font-bold px-1 shadow-sm">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </Link>

          {/* User menu */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenu(!menuOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/10 transition-all">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full
                                flex items-center justify-center font-bold text-sm text-white shadow-sm">
                  {user.name?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <span className="hidden sm:block text-sm text-violet-100 max-w-[80px] truncate font-medium">
                  {user.name?.split(' ')[0]}
                </span>
                <svg className="w-3.5 h-3.5 text-violet-300 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl shadow-slate-200/80
                                border border-slate-100 py-1.5 z-50 overflow-hidden">
                  <div className="px-4 py-3 bg-gradient-to-r from-violet-50 to-indigo-50 border-b border-slate-100">
                    <p className="font-bold text-sm text-slate-800 truncate">{user.name}</p>
                    <p className="text-xs text-violet-600 capitalize font-semibold mt-0.5">{user.role}</p>
                  </div>

                  {[
                    { to: '/profile', label: 'My Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                    { to: '/orders',  label: 'My Orders',  icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                  ].map(item => (
                    <Link key={item.to} to={item.to} onClick={() => setMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700
                                 hover:bg-violet-50 hover:text-violet-700 transition-colors">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                      {item.label}
                    </Link>
                  ))}

                  {user.role === 'admin' && (
                    <Link to="/admin" onClick={() => setMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-violet-700 font-semibold
                                 hover:bg-violet-50 transition-colors">
                      <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Admin Dashboard
                    </Link>
                  )}

                  <div className="border-t border-slate-100 mt-1">
                    <button onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600
                                 hover:bg-red-50 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login"
                className="text-sm text-violet-200 hover:text-white transition-colors px-3 py-2
                           hover:bg-white/10 rounded-lg font-medium">
                Log in
              </Link>
              <Link to="/register"
                className="text-sm font-bold bg-gradient-to-r from-amber-400 to-orange-400
                           text-violet-900 px-4 py-2 rounded-xl hover:from-amber-300
                           hover:to-orange-300 transition-all shadow-sm active:scale-95">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>

      {menuOpen && <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />}
    </nav>
  );
}
