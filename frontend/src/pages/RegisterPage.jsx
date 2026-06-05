import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [form, setForm]       = useState({ name: '', email: '', password: '', role: 'customer' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.role);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message ?? 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — brand panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-indigo-950 via-violet-800 to-violet-900
                      flex-col items-center justify-center p-16 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-indigo-500/25 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-violet-500/30 rounded-full blur-3xl translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 max-w-sm w-full">
          <div className="text-4xl font-extrabold text-white mb-1">
            Zi<span className="text-amber-400">Mart</span>
          </div>
          <p className="text-violet-300 text-base mb-12 leading-relaxed">
            Join thousands of happy shoppers and sellers
          </p>

          <div className="space-y-4">
            {[
              { icon: '🎁', title: 'Exclusive Deals',     desc: 'Members get first access to sales & offers' },
              { icon: '📦', title: 'Order Tracking',      desc: 'Track every order in real time' },
              { icon: '🏪', title: 'Sell Your Products',  desc: 'List and manage your own store easily' },
            ].map(f => (
              <div key={f.title}
                className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4
                           border border-white/15 hover:bg-white/15 transition-colors">
                <span className="text-2xl mt-0.5">{f.icon}</span>
                <div>
                  <p className="font-bold text-white text-sm">{f.title}</p>
                  <p className="text-violet-300 text-xs mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="text-4xl font-extrabold">
              Zi<span className="text-amber-400">Mart</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Create your account</h2>
            <p className="text-slate-500">It's free and takes less than a minute</p>
          </div>

          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl
                            text-sm flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Full Name</label>
              <input
                type="text" required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="input"
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Email address</label>
              <input
                type="email" required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="input"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Password</label>
              <input
                type="password" required
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="input"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Account Type</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'customer', label: 'Customer', desc: 'Browse & buy products', icon: '🛍️' },
                  { value: 'seller',   label: 'Seller',   desc: 'List & sell products',  icon: '🏪' },
                ].map(opt => (
                  <label key={opt.value}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      form.role === opt.value
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-slate-200 hover:border-violet-300 hover:bg-slate-50'
                    }`}>
                    <input
                      type="radio" name="role" value={opt.value}
                      checked={form.role === opt.value}
                      onChange={() => setForm(f => ({ ...f, role: opt.value }))}
                      className="sr-only"
                    />
                    <span className="text-xl mt-0.5">{opt.icon}</span>
                    <div>
                      <p className={`text-sm font-bold ${form.role === opt.value ? 'text-violet-700' : 'text-slate-700'}`}>
                        {opt.label}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3 text-base font-bold">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account…
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-violet-600 font-bold hover:text-violet-800 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
