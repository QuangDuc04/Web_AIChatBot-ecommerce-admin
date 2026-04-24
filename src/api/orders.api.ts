import api from './axios'

export const ordersApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/admin/orders', { params }).then((r) => r.data),
  stats: () => api.get('/admin/orders/stats').then((r) => r.data),
  revenue: (params?: Record<string, unknown>) =>
    api.get('/admin/orders/revenue', { params }).then((r) => r.data),
  get: (id: string) => api.get(`/admin/orders/${id}`).then((r) => r.data),
  updateStatus: (id: string, data: { status: string; note?: string }) =>
    api.put(`/admin/orders/${id}/status`, data).then((r) => r.data),
  bulkUpdateStatus: (data: { orderIds: string[]; status: string }) =>
    api.put('/admin/orders/bulk-update-status', data).then((r) => r.data),
}
