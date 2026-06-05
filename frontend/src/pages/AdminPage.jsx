import { useState, useEffect } from 'react';
import {
  getSalesReport,
  getTopProducts,
  getLowStock,
  getViewsVsPurchases,
  getBuyerLeaderboard,
  getSellerLeaderboard,
} from '../api/analytics';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/products';
import { getOrders, updateOrderStatus } from '../api/orders';

const TABS = ['Overview', 'Products', 'Orders', 'Leaderboard', 'Low Stock', 'Views vs Purchases'];

export default function AdminPage() {
  const [tab, setTab] = useState(0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm">ZiMart management & analytics</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-8 overflow-x-auto">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              tab === i ? 'bg-white shadow text-emerald-700' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && <OverviewTab />}
      {tab === 1 && <ProductsTab />}
      {tab === 2 && <OrdersTab />}
      {tab === 3 && <LeaderboardTab />}
      {tab === 4 && <LowStockTab />}
      {tab === 5 && <ViewsTab />}
    </div>
  );
}

/* ─── Overview ─────────────────────────────────────────────────── */
function OverviewTab() {
  const [report, setReport]   = useState(null);
  const [topProd, setTopProd] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getSalesReport(), getTopProducts()])
      .then(([r, t]) => {
        const months = r.data.report ?? [];
        const totalRevenue  = months.reduce((s, m) => s + m.totalRevenue, 0);
        const totalOrders   = months.reduce((s, m) => s + m.orderCount,   0);
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        setReport({ totalRevenue, totalOrders, avgOrderValue, byMonth: months });
        setTopProd(t.data.products ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-slate-200 rounded-xl" />)}</div>;

  const stats = [
    { label: 'Total Revenue',  value: `$${Number(report?.totalRevenue ?? 0).toFixed(2)}`,   color: 'text-emerald-700' },
    { label: 'Total Orders',   value: report?.totalOrders ?? 0,                               color: 'text-blue-700' },
    { label: 'Avg Order Value',value: `$${Number(report?.avgOrderValue ?? 0).toFixed(2)}`,   color: 'text-indigo-700' },
    { label: 'Top Products',   value: topProd.length,                                         color: 'text-amber-700' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="card text-center">
            <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-slate-500 text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="font-bold text-slate-800 mb-4">Top Selling Products</h2>
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-3 text-slate-600 font-medium">#</th>
                <th className="text-left px-4 py-3 text-slate-600 font-medium">Product</th>
                <th className="text-right px-4 py-3 text-slate-600 font-medium">Total Sold</th>
                <th className="text-right px-4 py-3 text-slate-600 font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {topProd.map((p, i) => (
                <tr key={p.productId ?? i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                  <td className="px-4 py-3 text-right font-medium">{p.totalQuantity ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-emerald-700 font-semibold">
                    ${Number(p.totalRevenue ?? 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue by month */}
      {report?.byMonth?.length > 0 && (
        <div>
          <h2 className="font-bold text-slate-800 mb-4">Monthly Revenue</h2>
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-4 py-3 text-slate-600 font-medium">Month</th>
                  <th className="text-right px-4 py-3 text-slate-600 font-medium">Orders</th>
                  <th className="text-right px-4 py-3 text-slate-600 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {report.byMonth.map((m, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700">{m.period}</td>
                    <td className="px-4 py-3 text-right">{m.orderCount}</td>
                    <td className="px-4 py-3 text-right text-emerald-700 font-semibold">${Number(m.totalRevenue).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Products management ─────────────────────────────────────── */
function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEdit]  = useState(null);
  const [form, setForm]         = useState({ name: '', price: '', category: '', stock: '', description: '' });
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const load = () => getProducts({ limit: 50 }).then(r => setProducts(r.data?.products ?? [])).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openNew = () => { setEdit(null); setForm({ name: '', price: '', category: '', stock: '', description: '' }); setShowForm(true); setError(''); };
  const openEdit = (p) => { setEdit(p); setForm({ name: p.name, price: p.price, category: typeof p.category === 'object' ? p.category?.name : p.category, stock: p.stock, description: p.description ?? '' }); setShowForm(true); setError(''); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body = { ...form, price: Number(form.price), stock: Number(form.stock) };
      if (editProduct) await updateProduct(editProduct._id, body);
      else await createProduct(body);
      setShowForm(false);
      setLoading(true);
      load();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    await deleteProduct(id).catch(() => {});
    setProducts(ps => ps.filter(p => p._id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-800">Products ({products.length})</h2>
        <button onClick={openNew} className="btn-primary px-4 py-2 text-sm">+ Add Product</button>
      </div>

      {showForm && (
        <div className="card border-2 border-emerald-200">
          <h3 className="font-bold text-slate-800 mb-4">{editProduct ? 'Edit Product' : 'New Product'}</h3>
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" placeholder="Product name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Price ($)</label>
              <input required type="number" step="0.01" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="input" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Stock</label>
              <input required type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} className="input" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <input required value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input" placeholder="Electronics" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input resize-none" placeholder="Optional description" />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary px-6 py-2 disabled:opacity-60">
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary px-6 py-2">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-slate-200 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-3 text-slate-600 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-slate-600 font-medium hidden sm:table-cell">Category</th>
                <th className="text-right px-4 py-3 text-slate-600 font-medium">Price</th>
                <th className="text-right px-4 py-3 text-slate-600 font-medium hidden sm:table-cell">Stock</th>
                <th className="text-right px-4 py-3 text-slate-600 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {products.map(p => (
                <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                  <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{typeof p.category === 'object' ? p.category?.name : p.category}</td>
                  <td className="px-4 py-3 text-right text-emerald-700 font-semibold">${Number(p.price).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell">
                    <span className={`badge ${p.stock === 0 ? 'bg-red-100 text-red-600' : p.stock <= 10 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(p)} className="text-blue-600 hover:text-blue-800 text-xs font-medium transition-colors">Edit</button>
                      <button onClick={() => handleDelete(p._id)} className="text-red-500 hover:text-red-700 text-xs font-medium transition-colors">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Orders management ─────────────────────────────────────── */
function OrdersTab() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('');

  const load = () => {
    const params = filter ? { status: filter } : {};
    getOrders(params).then(r => setOrders(r.data?.orders ?? r.data ?? [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [filter]);

  const STATUS_COLORS = { Placed: 'bg-amber-100 text-amber-700', Confirmed: 'bg-blue-100 text-blue-700', Shipped: 'bg-indigo-100 text-indigo-700', Delivered: 'bg-emerald-100 text-emerald-700', Cancelled: 'bg-red-100 text-red-700', Returned: 'bg-slate-100 text-slate-600' };

  const handleStatus = async (id, status) => {
    await updateOrderStatus(id, status).catch(() => {});
    setOrders(os => os.map(o => o._id === id ? { ...o, status } : o));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="font-bold text-slate-800">Orders</h2>
        <select value={filter} onChange={e => { setFilter(e.target.value); setLoading(true); }} className="input text-sm w-auto ml-auto">
          <option value="">All statuses</option>
          {['Placed','Confirmed','Shipped','Delivered','Cancelled','Returned'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-slate-200 rounded-xl animate-pulse" />)}</div>
      ) : orders.length === 0 ? (
        <p className="text-slate-400 text-center py-12">No orders found.</p>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-3 text-slate-600 font-medium">Order</th>
                <th className="text-left px-4 py-3 text-slate-600 font-medium hidden sm:table-cell">Customer</th>
                <th className="text-right px-4 py-3 text-slate-600 font-medium">Total</th>
                <th className="text-center px-4 py-3 text-slate-600 font-medium">Status</th>
                <th className="text-right px-4 py-3 text-slate-600 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.map(o => (
                <tr key={o._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">#{o._id?.slice(-8).toUpperCase()}</td>
                  <td className="px-4 py-3 text-slate-700 hidden sm:table-cell">{o.buyer?.name ?? o.user?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-emerald-700">${Number(o.totalAmount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`badge ${STATUS_COLORS[o.status] ?? 'bg-slate-100 text-slate-600'}`}>{o.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {(() => {
                      const next = { Placed: 'Confirmed', Confirmed: 'Shipped', Shipped: 'Delivered' }[o.status];
                      return next ? (
                        <button
                          onClick={() => handleStatus(o._id, next)}
                          className="text-xs border border-slate-200 rounded px-2 py-1 text-slate-600 hover:bg-slate-50"
                        >
                          → {next}
                        </button>
                      ) : null;
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Leaderboard ─────────────────────────────────────────────── */
function LeaderboardTab() {
  const [month, setMonth]       = useState('');
  const [buyers, setBuyers]     = useState([]);
  const [sellers, setSellers]   = useState([]);
  const [loading, setLoading]   = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([getBuyerLeaderboard(month || undefined), getSellerLeaderboard(month || undefined)])
      .then(([b, s]) => {
        setBuyers(b.data.buyers?.map(e => ({ ...e, id: e.userId,   score: e.totalSpent   })) ?? []);
        setSellers(s.data.sellers?.map(e => ({ ...e, id: e.sellerId, score: e.totalRevenue })) ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [month]);

  const medals = ['🥇', '🥈', '🥉'];

  const Board = ({ title, data }) => (
    <div>
      <h3 className="font-bold text-slate-800 mb-3">{title}</h3>
      {data.length === 0 ? (
        <p className="text-slate-400 text-sm">No data for this period.</p>
      ) : (
        <div className="space-y-2">
          {data.map((entry, i) => (
            <div key={entry.id ?? i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <span className="text-xl w-8 text-center">{medals[i] ?? `#${i + 1}`}</span>
              <div className="flex-1">
                <p className="font-semibold text-slate-800">{entry.name ?? entry.id}</p>
                <p className="text-xs text-slate-400">{entry.email}</p>
              </div>
              <span className="font-bold text-emerald-700">${Number(entry.score ?? 0).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="font-bold text-slate-800">Monthly Leaderboard</h2>
        <input
          type="month"
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="input text-sm w-auto"
        />
      </div>
      {loading ? (
        <div className="animate-pulse space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-slate-200 rounded-xl" />)}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Board title="Top Buyers" data={buyers} />
          <Board title="Top Sellers" data={sellers} />
        </div>
      )}
    </div>
  );
}

/* ─── Low stock ───────────────────────────────────────────────── */
function LowStockTab() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLowStock().then(r => setItems(r.data.alerts ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-slate-800">Low Stock Alerts</h2>
      {loading ? (
        <div className="animate-pulse space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-slate-200 rounded-xl" />)}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p className="text-lg">✓ All products are well stocked</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-red-50 border-b border-red-100">
              <tr>
                <th className="text-left px-4 py-3 text-slate-600 font-medium">Product</th>
                <th className="text-right px-4 py-3 text-slate-600 font-medium">Stock</th>
                <th className="text-right px-4 py-3 text-slate-600 font-medium">Threshold</th>
                <th className="text-right px-4 py-3 text-slate-600 font-medium">Deficit</th>
                <th className="text-center px-4 py-3 text-slate-600 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map((p, i) => (
                <tr key={p.productId ?? i} className="hover:bg-red-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                  <td className="px-4 py-3 text-right font-bold text-red-600">{p.currentStock}</td>
                  <td className="px-4 py-3 text-right text-slate-400">{p.lowStockThreshold}</td>
                  <td className="px-4 py-3 text-right text-slate-400">{p.deficit}</td>
                  <td className="px-4 py-3 text-center">
                    {p.currentStock === 0
                      ? <span className="badge bg-red-100 text-red-700">Out of Stock</span>
                      : <span className="badge bg-amber-100 text-amber-700">Low Stock</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Views vs Purchases ─────────────────────────────────────── */
function ViewsTab() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getViewsVsPurchases().then(r => setData(r.data.mostViewed ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-slate-800">Views vs Purchases</h2>
      <p className="text-slate-500 text-sm">Conversion rate analysis — how views translate to purchases per product.</p>

      {loading ? (
        <div className="animate-pulse space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-slate-200 rounded-xl" />)}</div>
      ) : data.length === 0 ? (
        <p className="text-slate-400 text-center py-12">No data yet.</p>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-3 text-slate-600 font-medium">Product</th>
                <th className="text-right px-4 py-3 text-slate-600 font-medium">Views (HLL)</th>
                <th className="text-right px-4 py-3 text-slate-600 font-medium">Purchases</th>
                <th className="text-right px-4 py-3 text-slate-600 font-medium">Conv. Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.map((row, i) => {
                const rateNum = parseFloat(row.conversionRate ?? '0');
                return (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{row.name ?? row.productId}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{row.estimatedViews?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{row.totalPurchased?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`badge ${rateNum >= 5 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {row.conversionRate}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
