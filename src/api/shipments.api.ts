import api from './axios'

export const shipmentsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/admin/shipments', { params }).then((r) => r.data),
  stats: () => api.get('/admin/shipments/stats').then((r) => r.data),
  get: (id: string) => api.get(`/admin/shipments/${id}`).then((r) => r.data),
  create: (data: Record<string, unknown>) =>
    api.post('/admin/shipments', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/admin/shipments/${id}`, data).then((r) => r.data),
  addUpdate: (data: Record<string, unknown>) =>
    api.post('/admin/shipments/update', data).then((r) => r.data),
  markDelivered: (id: string) =>
    api.put(`/admin/shipments/${id}/deliver`).then((r) => r.data),
  markFailed: (id: string, data: { reason?: string }) =>
    api.put(`/admin/shipments/${id}/fail`, data).then((r) => r.data),
}
