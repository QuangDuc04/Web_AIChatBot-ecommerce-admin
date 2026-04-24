import api from './axios'

export const couponsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/admin/coupons', { params }).then((r) => r.data),
  get: (id: string) => api.get(`/admin/coupons/${id}`).then((r) => r.data),
  usage: (id: string) => api.get(`/admin/coupons/${id}/usage`).then((r) => r.data),
  create: (data: Record<string, unknown>) =>
    api.post('/admin/coupons', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/admin/coupons/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/admin/coupons/${id}`).then((r) => r.data),
}
