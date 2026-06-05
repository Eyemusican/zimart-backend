import api from './axios';
export const getSalesReport       = ()      => api.get('/analytics/sales');
export const getTopProducts       = ()      => api.get('/analytics/top-products');
export const getLowStock          = ()      => api.get('/analytics/low-stock');
export const getViewsVsPurchases  = ()      => api.get('/analytics/views-vs-purchases');
export const getBuyerLeaderboard  = (month) => api.get('/analytics/leaderboard/buyers',  { params: { month } });
export const getSellerLeaderboard = (month) => api.get('/analytics/leaderboard/sellers', { params: { month } });
