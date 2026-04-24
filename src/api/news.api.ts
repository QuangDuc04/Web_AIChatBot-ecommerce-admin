import api from './axios'

export const newsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/admin/news', { params }).then((r) => r.data),
  get: (id: string) =>
    api.get(`/admin/news/${id}`).then((r) => r.data),
  create: (data: FormData) =>
    api.post('/admin/news', data, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  update: (id: string, data: FormData) =>
    api.put(`/admin/news/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  delete: (id: string) =>
    api.delete(`/admin/news/${id}`).then((r) => r.data),
}
