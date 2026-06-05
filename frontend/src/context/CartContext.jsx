import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as cartApi from '../api/cart';
import { useAuth } from './AuthContext';

const Ctx = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart]   = useState({ items: [], total: 0 });
  const { user }          = useAuth();

  const fetchCart = useCallback(async () => {
    try {
      const { data } = await cartApi.getCart();
      setCart(data);
    } catch (_) {}
  }, []);

  // Reload cart whenever the logged-in user changes
  useEffect(() => { fetchCart(); }, [fetchCart, user]);

  const addItem    = async (productId, quantity = 1) => { await cartApi.addToCart({ productId, quantity });      await fetchCart(); };
  const updateItem = async (productId, quantity)     => { await cartApi.updateCartItem(productId, { quantity }); await fetchCart(); };
  const removeItem = async (productId)               => { await cartApi.removeFromCart(productId);               await fetchCart(); };
  const clear      = async ()                        => { await cartApi.clearCart();  setCart({ items: [], total: 0 }); };

  const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <Ctx.Provider value={{ cart, addItem, updateItem, removeItem, clear, fetchCart, itemCount }}>
      {children}
    </Ctx.Provider>
  );
}

export const useCart = () => useContext(Ctx);
