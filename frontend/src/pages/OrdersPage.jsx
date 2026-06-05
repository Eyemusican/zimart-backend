import { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { getOrders, getOrderById, updateOrderStatus } from '../api/orders';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
  Placed:    'bg-amber-100 text-amber-700',
  Confirmed: 'bg-blue-100 text-blue-700',
  Shipped:   'bg-indigo-100 text-indigo-700',
  Delivered: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-red-100 text-red-700',
  Returned:  'bg-slate-100 text-slate-600',
};

export default function OrdersPage() {
  const { user }    = useAuth();
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrders()
      .then(r => setOrders(r.data?.orders ?? r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="card animate-pulse h-24" />
      ))}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <svg className="w-16 h-16 mx-auto mb-4 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-lg font-medium">No orders yet</p>
          <Link to="/products" className="mt-4 btn-primary px-6 py-2 inline-block">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <Link key={order._id} to={`/orders/${order._id}`}
              className="card flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-md transition-shadow">
              <div>
                <p className="text-xs text-slate-400 mb-1">Order #{order._id?.slice(-8).toUpperCase()}</p>
                <p className="font-semibold text-slate-800">{order.items?.length ?? 0} item{order.items?.length !== 1 ? 's' : ''}</p>
                <p className="text-sm text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`badge ${STATUS_COLORS[order.status] ?? 'bg-slate-100 text-slate-600'}`}>
                  {order.status}
                </span>
                <span className="font-bold text-emerald-700">${Number(order.totalAmount).toFixed(2)}</span>
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function OrderDetailPage() {
  const { id }       = useParams();
  const location     = useLocation();
  const { user }     = useAuth();
  const isNew        = location.state?.newOrder;

  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError]     = useState('');

  const reload = () => getOrderById(id).then(r => setOrder(r.data)).catch(() => setError('Order not found'));

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (status) => {
    setUpdating(true);
    try {
      await updateOrderStatus(id, status);
      await reload();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="card animate-pulse h-64" />
    </div>
  );

  if (error || !order) return (
    <div className="text-center py-24 text-slate-400">
      <p>{error || 'Order not found.'}</p>
      <Link to="/orders" className="mt-4 btn-primary px-6 py-2 inline-block">Back to Orders</Link>
    </div>
  );

  const STATUS_STEPS = ['Placed', 'Confirmed', 'Shipped', 'Delivered'];
  const currentStep  = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      {isNew && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-700 font-medium text-center">
          🎉 Order placed successfully! Thank you for shopping with ZiMart.
        </div>
      )}

      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-400">Order ID</p>
            <p className="font-mono font-semibold text-slate-700">#{order._id?.slice(-12).toUpperCase()}</p>
            <p className="text-sm text-slate-500 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <span className={`badge text-sm ${STATUS_COLORS[order.status] ?? 'bg-slate-100 text-slate-600'}`}>
            {order.status}
          </span>
        </div>
      </div>

      {/* Progress tracker (not for cancelled) */}
      {order.status !== 'Cancelled' && order.status !== 'Returned' && (
        <div className="card">
          <div className="flex items-center justify-between">
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    i <= currentStep ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {i < currentStep ? '✓' : i + 1}
                  </div>
                  <span className="text-xs text-slate-500 mt-1 capitalize">{step}</span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`flex-1 h-1 mx-1 rounded ${i < currentStep ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Items */}
      <div className="card">
        <h2 className="font-bold text-slate-800 mb-4">Items</h2>
        <div className="space-y-3">
          {order.items?.map((item, i) => {
            const name  = item.name ?? 'Product';
            const price = item.price ?? 0;
            return (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div>
                  <p className="font-medium text-slate-800">{name}</p>
                  <p className="text-sm text-slate-400">Qty: {item.quantity} × ${Number(price).toFixed(2)}</p>
                </div>
                <span className="font-semibold text-slate-700">${(item.quantity * price).toFixed(2)}</span>
              </div>
            );
          })}
          <div className="flex justify-between font-bold text-slate-800 pt-2">
            <span>Total</span>
            <span className="text-emerald-700">${Number(order.totalAmount).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Shipping & payment */}
      <div className="card grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="font-medium text-slate-700 mb-1">Shipping Address</p>
          <p className="text-slate-500">
            {order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.country}
          </p>
        </div>
        <div>
          <p className="font-medium text-slate-700 mb-1">Payment</p>
          <p className="text-slate-500 capitalize">{order.paymentMethod?.replace('_', ' ')}</p>
        </div>
      </div>

      {/* Admin status updater */}
      {user?.role === 'admin' && order.status !== 'Delivered' && order.status !== 'Cancelled' && order.status !== 'Returned' && (
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-3">Update Order Status</h3>
          {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
          <div className="flex flex-wrap gap-2">
            {(() => {
              const next = { Placed: 'Confirmed', Confirmed: 'Shipped', Shipped: 'Delivered' }[order.status];
              return next ? (
                <button
                  onClick={() => handleStatusChange(next)}
                  disabled={updating}
                  className="btn-secondary px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  Mark as {next}
                </button>
              ) : null;
            })()}
          </div>
        </div>
      )}

      <Link to="/orders" className="block text-center text-emerald-600 text-sm hover:underline">
        ← Back to all orders
      </Link>
    </div>
  );
}
