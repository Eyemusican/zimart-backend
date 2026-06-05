import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import OrdersPage, { OrderDetailPage } from './pages/OrdersPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';

function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F7F8FD' }}>
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="relative overflow-hidden bg-gradient-to-r from-violet-900 via-violet-800 to-indigo-900 text-white mt-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400 rounded-full blur-3xl translate-x-1/3 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400 rounded-full blur-2xl -translate-x-1/3 translate-y-1/2" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
            <div>
              <div className="text-2xl font-extrabold mb-3">
                Zi<span className="text-amber-400">Mart</span>
              </div>
              <p className="text-violet-300 text-sm leading-relaxed">
                Your premium online shopping destination. Quality products, fast delivery, amazing prices.
              </p>
            </div>
            <div>
              <p className="font-semibold text-white mb-3 text-sm uppercase tracking-wider">Shop</p>
              <div className="space-y-2 text-sm text-violet-300">
                <a href="/products" className="block hover:text-white transition-colors">All Products</a>
                <a href="/products?sort=trending" className="block hover:text-white transition-colors">Trending</a>
                <a href="/products?sort=newest" className="block hover:text-white transition-colors">New Arrivals</a>
              </div>
            </div>
            <div>
              <p className="font-semibold text-white mb-3 text-sm uppercase tracking-wider">Account</p>
              <div className="space-y-2 text-sm text-violet-300">
                <a href="/profile" className="block hover:text-white transition-colors">My Profile</a>
                <a href="/orders" className="block hover:text-white transition-colors">My Orders</a>
                <a href="/cart" className="block hover:text-white transition-colors">My Cart</a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-violet-400 text-sm">
              © {new Date().getFullYear()} ZiMart — Built with MongoDB Atlas, Redis Cloud & React
            </p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-violet-400 text-xs">All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Routes>
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/" element={<Layout><HomePage /></Layout>} />
          <Route path="/products" element={<Layout><ProductsPage /></Layout>} />
          <Route path="/products/:id" element={<Layout><ProductDetailPage /></Layout>} />
          <Route path="/cart" element={<Layout><CartPage /></Layout>} />

          <Route path="/orders" element={
            <ProtectedRoute><Layout><OrdersPage /></Layout></ProtectedRoute>
          } />
          <Route path="/orders/:id" element={
            <ProtectedRoute><Layout><OrderDetailPage /></Layout></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute adminOnly><Layout><AdminPage /></Layout></ProtectedRoute>
          } />

          <Route path="*" element={
            <Layout>
              <div className="text-center py-32">
                <p className="text-8xl font-extrabold text-slate-100 mb-4">404</p>
                <p className="text-slate-500 text-xl font-semibold mb-2">Page not found</p>
                <p className="text-slate-400 text-sm mb-8">The page you're looking for doesn't exist.</p>
                <a href="/" className="btn-primary px-8 py-3 text-base">Go Home</a>
              </div>
            </Layout>
          } />
        </Routes>
      </CartProvider>
    </AuthProvider>
  );
}
