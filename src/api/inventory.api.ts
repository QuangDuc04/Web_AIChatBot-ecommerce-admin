import api from './axios'

export const inventoryApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/admin/inventory', { params }).then((r) => r.data),
  stats: () =>
    api.get('/admin/inventory/stats').then((r) => r.data),
  get: (id: string) =>
    api.get(`/admin/inventory/${id}`).then((r) => r.data),
  updateStock: (id: string, data: { quantity: number; reason: string }) =>
    api.put(`/admin/inventory/${id}/stock`, data).then((r) => r.data),
  restock: (id: string, data: { quantity: number; reason?: string }) =>
    api.post(`/admin/inventory/${id}/restock`, data).then((r) => r.data),
  adjust: (id: string, data: { adjustment: number; reason: string }) =>
    api.post(`/admin/inventory/${id}/adjust`, data).then((r) => r.data),
  transactions: (id: string, params?: Record<string, unknown>) =>
    api.get(`/admin/inventory/${id}/transactions`, { params }).then((r) => r.data),
  allTransactions: (params?: Record<string, unknown>) =>
    api.get('/admin/inventory/transactions', { params }).then((r) => r.data),
}
