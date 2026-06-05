import { createContext, useContext, useState } from 'react';
import * as authApi from '../api/auth';
import { mergeCart } from '../api/cart';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });

  const login = async (email, password) => {
    const { data } = await authApi.login({ email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    // Merge any guest cart items after login
    const guestId = localStorage.getItem('guestId');
    if (guestId) {
      mergeCart(guestId).catch(() => {});
      localStorage.removeItem('guestId');
    }
    return data;
  };

  const register = async (name, email, password, role) => {
    const { data } = await authApi.register({ name, email, password, role });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try { await authApi.logout(); } catch (_) {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return <Ctx.Provider value={{ user, login, register, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
