import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    // Generate and persist a guest ID for unauthenticated cart access
    let guestId = localStorage.getItem('guestId');
    if (!guestId) {
      guestId = 'g-' + Math.random().toString(36).slice(2, 11) + Math.random().toString(36).slice(2, 11);
      localStorage.setItem('guestId', guestId);
    }
    config.headers['X-Guest-Id'] = guestId;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(err);
  }
);

export default api;
