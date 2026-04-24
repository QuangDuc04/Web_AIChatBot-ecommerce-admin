import api from './axios'

export const flashSalesApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/admin/flash-sales', { params }).then((r) => r.data),
  get: (id: string) => api.get(`/admin/flash-sales/${id}`).then((r) => r.data),
  create: (data: Record<string, unknown>) =>
    api.post('/admin/flash-sales', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/admin/flash-sales/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/admin/flash-sales/${id}`).then((r) => r.data),
  addItem: (flashSaleId: string, data: Record<string, unknown>) =>
    api.post(`/admin/flash-sales/${flashSaleId}/items`, data).then((r) => r.data),
  updateItem: (itemId: string, data: Record<string, unknown>) =>
    api.put(`/admin/flash-sales/items/${itemId}`, data).then((r) => r.data),
  removeItem: (itemId: string) =>
    api.delete(`/admin/flash-sales/items/${itemId}`).then((r) => r.data),
}
