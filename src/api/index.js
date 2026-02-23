const API_BASE = import.meta.env.VITE_API_URL || '/api';

// ─── Helper ───────────────────────────────────────────────
async function request(url, options = {}) {
  const token = localStorage.getItem('admin_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  } catch {
    throw new Error('Cannot connect to server. Make sure the backend is running on port 5000.');
  }

  // Handle empty responses (e.g. server crash, proxy not connected)
  const text = await res.text();
  if (!text) {
    throw new Error('Server returned an empty response. Check the backend is running.');
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Server returned invalid response. Check the backend logs.');
  }

  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// ─── Public ───────────────────────────────────────────────
export const fetchHomepageProducts = () => request('/products/homepage');
export const fetchProducts = (params = '') => request(`/products${params ? `?${params}` : ''}`);
export const fetchProduct = (id) => request(`/products/${id}`);
export const fetchCollections = () => request('/collections');
export const fetchCollectionBySlug = (slug) => request(`/collections/${slug}`);

// ─── Admin Auth ───────────────────────────────────────────
export const adminLogin = (username, password) =>
  request('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

export const adminVerify = () => request('/admin/me');

export const adminSetup = (username, password, setupKey) =>
  request('/admin/setup', {
    method: 'POST',
    body: JSON.stringify({ username, password, setupKey }),
  });

// ─── Admin Products ───────────────────────────────────────
export const fetchAllProducts = () => request('/products/admin/all');

export const createProduct = (data) =>
  request('/products', { method: 'POST', body: JSON.stringify(data) });

export const updateProduct = (id, data) =>
  request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteProduct = (id) =>
  request(`/products/${id}`, { method: 'DELETE' });

export const toggleProduct = (id) =>
  request(`/products/${id}/toggle`, { method: 'PATCH' });

// ─── Admin Collections ───────────────────────────────────
export const fetchAllCollections = () => request('/collections/admin/all');

export const createCollection = (data) =>
  request('/collections', { method: 'POST', body: JSON.stringify(data) });

export const updateCollection = (id, data) =>
  request(`/collections/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteCollection = (id) =>
  request(`/collections/${id}`, { method: 'DELETE' });

// ─── Analytics ────────────────────────────────────────────
export const fetchAnalyticsOverview = () => request('/analytics/overview');
export const fetchAnalyticsProducts = () => request('/analytics/products');
export const fetchRecentOrders = () => request('/analytics/recent-orders');

// ─── Store Code ───────────────────────────────────────────
export const verifyStoreCode = (username, code) =>
  request('/storecode/verify', {
    method: 'POST',
    body: JSON.stringify({ username, code }),
  });

// ─── Payments (Razorpay) ──────────────────────────────────
export const createPaymentOrder = (mcUsername, email, items, storeCode) =>
  request('/payments/create-order', {
    method: 'POST',
    body: JSON.stringify({ mcUsername, email, items, storeCode }),
  });

// verifyPayment REMOVED — frontend must NEVER confirm payment status.
// Only Razorpay webhook can mark orders as paid.

export const getOrderStatus = (orderId) => request(`/payments/order/${orderId}`);
