import api from './axios';
export const placeOrder        = (d)      => api.post('/orders', d);
export const getOrders         = (params) => api.get('/orders', { params });
export const getOrderById      = (id)     => api.get(`/orders/${id}`);
export const updateOrderStatus = (id, s)  => api.put(`/orders/${id}/status`, { status: s });
