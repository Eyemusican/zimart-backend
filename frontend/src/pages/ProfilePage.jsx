import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { profile } from '../api/auth';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user: authUser, logout } = useAuth();
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    profile()
      .then(r => setUser(r.data.user))
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="card animate-pulse h-20" />)}
    </div>
  );

  if (error) return (
    <div className="text-center py-24 text-slate-400">
      <p>{error}</p>
      <Link to="/" className="mt-4 btn-primary px-6 py-2 inline-block">Go Home</Link>
    </div>
  );

  const ROLE_COLOR = { admin: 'bg-purple-100 text-purple-700', seller: 'bg-blue-100 text-blue-700', customer: 'bg-emerald-100 text-emerald-700' };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>

      <div className="card space-y-5">
        {/* Avatar + name */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-2xl font-bold text-emerald-700 shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xl font-bold text-slate-800">{user?.name}</p>
            <span className={`badge mt-1 ${ROLE_COLOR[user?.role] ?? 'bg-slate-100 text-slate-600'}`}>
              {user?.role}
            </span>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Details */}
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Email</span>
            <span className="font-medium text-slate-700">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Account ID</span>
            <span className="font-mono text-xs text-slate-400">{user?._id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Member since</span>
            <span className="text-slate-700">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</span>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4">
        <Link to="/orders" className="card text-center hover:shadow-md transition-shadow">
          <svg className="w-8 h-8 mx-auto text-emerald-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="font-medium text-slate-700">My Orders</p>
        </Link>
        <Link to="/products" className="card text-center hover:shadow-md transition-shadow">
          <svg className="w-8 h-8 mx-auto text-emerald-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <p className="font-medium text-slate-700">Browse Products</p>
        </Link>
      </div>

      {authUser?.role === 'admin' && (
        <Link to="/admin" className="card flex items-center gap-3 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-slate-700">Admin Dashboard</p>
            <p className="text-xs text-slate-400">Manage products, orders & analytics</p>
          </div>
        </Link>
      )}

      <button
        onClick={logout}
        className="w-full py-3 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
}
