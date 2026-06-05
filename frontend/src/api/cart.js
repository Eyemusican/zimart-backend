import api from './axios';
export const getCart             = ()          => api.get('/cart');
export const addToCart           = (d)         => api.post('/cart', d);
export const updateCartItem      = (pid, d)    => api.put(`/cart/${pid}`, d);
export const removeFromCart      = (pid)       => api.delete(`/cart/${pid}`);
export const clearCart           = ()          => api.delete('/cart');
export const getRecentlyViewed   = ()          => api.get('/cart/recent');
export const addToRecentlyViewed = (productId) => api.post('/cart/recent', { productId });
export const mergeCart           = (guestId)   => api.post('/cart/merge', { guestId });
