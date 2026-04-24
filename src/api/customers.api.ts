import api from './axios'

export const customersApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/admin/customers', { params }).then((r) => r.data),
  get: (id: string) => api.get(`/admin/customers/${id}`).then((r) => r.data),
  create: (data: FormData) =>
    api.post('/admin/customers', data, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  update: (id: string, data: FormData) =>
    api.put(`/admin/customers/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  delete: (id: string) => api.delete(`/admin/customers/${id}`).then((r) => r.data),
  uploadImages: (id: string, data: FormData) =>
    api.post(`/admin/customers/${id}/images`, data, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  deleteImage: (id: string, imageId: string) =>
    api.delete(`/admin/customers/${id}/images/${imageId}`).then((r) => r.data),
}
