import api from './axios'

export const paymentsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/admin/payments', { params }).then((r) => r.data),
  stats: () => api.get('/admin/payments/stats').then((r) => r.data),
  get: (id: string) => api.get(`/admin/payments/${id}`).then((r) => r.data),
  confirmCOD: (orderId: string) =>
    api.post(`/admin/payments/${orderId}/confirm-cod`).then((r) => r.data),
  refund: (id: string, data: { amount?: number; reason?: string }) =>
    api.post(`/admin/payments/${id}/refund`, data).then((r) => r.data),
}
