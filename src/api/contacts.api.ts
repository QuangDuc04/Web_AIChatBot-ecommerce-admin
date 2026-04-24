import api from './axios'

export const contactsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/admin/contacts', { params }).then((r) => r.data),
  get: (id: string) => api.get(`/admin/contacts/${id}`).then((r) => r.data),
  updateStatus: (id: string, data: Record<string, unknown>) =>
    api.put(`/admin/contacts/${id}/status`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/admin/contacts/${id}`).then((r) => r.data),
}
