import api from './axios';
export const getProducts    = (params) => api.get('/products', { params });
export const getProductById = (id)     => api.get(`/products/${id}`);
export const getTrending    = ()       => api.get('/products/trending');
export const createProduct  = (d)      => api.post('/products', d);
export const updateProduct  = (id, d)  => api.put(`/products/${id}`, d);
export const deleteProduct  = (id)     => api.delete(`/products/${id}`);
