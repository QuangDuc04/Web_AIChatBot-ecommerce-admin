import api from './axios'

export const bannersApi = {
  list: () => api.get('/admin/banners').then((r) => r.data),
  create: (data: FormData) =>
    api.post('/admin/banners', data, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  update: (id: string, data: FormData) =>
    api.put(`/admin/banners/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  delete: (id: string) => api.delete(`/admin/banners/${id}`).then((r) => r.data),
}
