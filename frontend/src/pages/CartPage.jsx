import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { placeOrder } from '../api/orders';

export default function CartPage() {
  const { cart, updateItem, removeItem, clear } = useCart();
  const { user }    = useAuth();
  const navigate    = useNavigate();

  const [form, setForm]       = useState({ street: '', city: '', country: '', paymentMethod: 'card' });
  const [placing, setPlacing] = useState(false);
  const [error, setError]     = useState('');

  const handleQty = async (productId, qty) => {
    if (qty < 1) return removeItem(productId);
    await updateItem(productId, qty);
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login', { state: { from: '/cart' } }); return; }
    if (!form.street.trim() || !form.city.trim() || !form.country.trim()) {
      setError('Please fill in all address fields.');
      return;
    }
    setPlacing(true);
    setError('');
    try {
      const items           = cart.items.map(i => ({ productId: i.productId, quantity: i.quantity }));
      const shippingAddress = { street: form.street, city: form.city, country: form.country };
      const { data }        = await placeOrder({ items, shippingAddress, paymentMethod: form.paymentMethod });
      await clear();
      navigate(`/orders/${data.order._id}`, { state: { newOrder: true } });
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to place order. Try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (cart.items.length === 0) return (
    <div className="max-w-2xl mx-auto px-4 py-28 text-center">
      <div className="w-24 h-24 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-7">
        <svg className="w-12 h-12 text-violet-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.5 6h13M7 13L5.4 5M10 21a1 1 0 11-2 0 1 1 0 012 0zm9 0a1 1 0 11-2 0 1 1 0 012 0z" />
        </svg>
      </div>
      <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Your cart is empty</h2>
      <p className="text-slate-400 mb-8 text-[15px]">Explore our products and add something you love!</p>
      <Link to="/products" className="btn-primary px-8 py-3 text-base font-bold">Browse Products</Link>
    </div>
  );

  const PAYMENT_ICONS = { card: '💳', paypal: '🅿️', cod: '💵' };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Shopping Cart</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {cart.items.length} item{cart.items.length !== 1 ? 's' : ''} in your cart
          </p>
        </div>
        <button onClick={clear}
          className="text-sm text-red-500 hover:text-red-700 font-semibold transition-colors
                     flex items-center gap-1.5 hover:bg-red-50 px-3 py-1.5 rounded-lg">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Clear cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-3">
          {cart.items.map(item => {
            const productId = item.productId;
            const name      = item.name  ?? 'Product';
            const price     = item.price ?? 0;

            return (
              <div key={productId}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex gap-4
                           hover:shadow-md hover:border-violet-100 transition-all">
                {/* Image */}
                <div className="w-20 h-20 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-xl
                                shrink-0 flex items-center justify-center overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <svg className="w-8 h-8 text-violet-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                    </svg>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 text-sm truncate mb-0.5">{name}</h3>
                  <p className="text-violet-600 font-extrabold text-base">${Number(price).toFixed(2)}</p>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border-2 border-slate-200 rounded-xl overflow-hidden">
                      <button onClick={() => handleQty(productId, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-violet-50
                                   text-slate-600 hover:text-violet-700 font-bold transition-colors text-base">
                        −
                      </button>
                      <span className="w-10 text-center text-sm font-bold text-slate-900">{item.quantity}</span>
                      <button onClick={() => handleQty(productId, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-violet-50
                                   text-slate-600 hover:text-violet-700 font-bold transition-colors text-base">
                        +
                      </button>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-extrabold text-slate-800 text-base">
                        ${(price * item.quantity).toFixed(2)}
                      </span>
                      <button onClick={() => removeItem(productId)}
                        className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600
                                   hover:bg-red-50 rounded-lg transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Order summary */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-violet-50 to-indigo-50 px-6 py-4 border-b border-slate-100">
              <h2 className="font-extrabold text-slate-800">Order Summary</h2>
            </div>
            <div className="px-6 py-5 space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({cart.items.length} items)</span>
                <span className="font-semibold">${Number(cart.total).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span className="text-emerald-600 font-semibold">Free</span>
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between font-extrabold
                              text-slate-900 text-base">
                <span>Total</span>
                <span className="text-violet-700">${Number(cart.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Checkout form */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-violet-50 to-indigo-50 px-6 py-4 border-b border-slate-100">
              <h2 className="font-extrabold text-slate-800">Checkout</h2>
            </div>
            <div className="px-6 py-5">
              {!user && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                  <Link to="/login" state={{ from: '/cart' }} className="font-bold underline">Sign in</Link>{' '}
                  to save your order history, or continue as guest.
                </div>
              )}
              <form onSubmit={handleCheckout} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Street address</label>
                  <input required type="text" value={form.street} placeholder="123 Main St"
                    onChange={e => setForm(f => ({ ...f, street: e.target.value }))}
                    className="input" />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">City</label>
                    <input required type="text" value={form.city} placeholder="Thimphu"
                      onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                      className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Country</label>
                    <input required type="text" value={form.country} placeholder="Bhutan"
                      onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                      className="input" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Payment Method</label>
                  <div className="space-y-2">
                    {[
                      { value: 'card',   label: 'Credit / Debit Card', icon: '💳' },
                      { value: 'paypal', label: 'PayPal',              icon: '🅿️' },
                      { value: 'cod',    label: 'Cash on Delivery',    icon: '💵' },
                    ].map(opt => (
                      <label key={opt.value}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          form.paymentMethod === opt.value
                            ? 'border-violet-400 bg-violet-50'
                            : 'border-slate-200 hover:border-violet-200'
                        }`}>
                        <input type="radio" name="payment" value={opt.value}
                          checked={form.paymentMethod === opt.value}
                          onChange={() => setForm(f => ({ ...f, paymentMethod: opt.value }))}
                          className="sr-only" />
                        <span className="text-lg">{opt.icon}</span>
                        <span className={`text-sm font-semibold ${
                          form.paymentMethod === opt.value ? 'text-violet-700' : 'text-slate-700'
                        }`}>{opt.label}</span>
                        {form.paymentMethod === opt.value && (
                          <span className="ml-auto">
                            <svg className="w-4 h-4 text-violet-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                <button type="submit" disabled={placing}
                  className="btn-primary w-full py-3.5 text-base font-bold mt-2">
                  {placing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Placing Order…
                    </span>
                  ) : `Place Order · $${Number(cart.total).toFixed(2)}`}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
