import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.response.use(
  res => res.data,
  err => {
    const msg = err.response?.data?.message || err.message || 'Request failed';
    return Promise.reject(new Error(msg));
  }
);

// ─── Items ────────────────────────────────────────────────────────────────────
export const itemsApi = {
  getAll:   (page = 0, size = 50) => api.get(`/items?page=${page}&size=${size}`),
  getById:  (id)                   => api.get(`/items/${id}`),
  search:   (q, page = 0)          => api.get(`/items/search?q=${encodeURIComponent(q)}&page=${page}&size=20`),
  create:   (data)                 => api.post('/items', data),
  update:   (id, data)             => api.put(`/items/${id}`, data),
  remove:   (id)                   => api.delete(`/items/${id}`),
  byCategory: (catId)              => api.get(`/items/category/${catId}`),
};

// ─── Locations ────────────────────────────────────────────────────────────────
export const locationsApi = {
  getAll:  ()          => api.get('/locations'),
  getById: (id)        => api.get(`/locations/${id}`),
  create:  (data)      => api.post('/locations', data),
  update:  (id, data)  => api.put(`/locations/${id}`, data),
  remove:  (id)        => api.delete(`/locations/${id}`),
};

// ─── Categories ───────────────────────────────────────────────────────────────
export const categoriesApi = {
  getAll:  ()     => api.get('/categories'),
  create:  (data) => api.post('/categories', data),
};

// ─── Inventory ────────────────────────────────────────────────────────────────
export const inventoryApi = {
  getAll:       ()           => api.get('/inventory'),
  byItem:       (itemId)     => api.get(`/inventory/item/${itemId}`),
  byLocation:   (locationId) => api.get(`/inventory/location/${locationId}`),
  lowStock:     ()           => api.get('/inventory/alerts/low-stock'),
  updateStock:  (data)       => api.post('/inventory/update', data),
  dashboard:    ()           => api.get('/inventory/dashboard'),
};

export default api;
