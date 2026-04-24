import api from './axios'

export const analyticsApi = {
  dashboard: () => api.get('/admin/analytics/dashboard').then((r) => r.data),
  revenue: (params?: Record<string, unknown>) =>
    api.get('/admin/analytics/revenue', { params }).then((r) => r.data),
  products: (params?: Record<string, unknown>) =>
    api.get('/admin/analytics/products', { params }).then((r) => r.data),
  customers: (params?: Record<string, unknown>) =>
    api.get('/admin/analytics/customers', { params }).then((r) => r.data),
  orders: (params?: Record<string, unknown>) =>
    api.get('/admin/analytics/orders', { params }).then((r) => r.data),
}
