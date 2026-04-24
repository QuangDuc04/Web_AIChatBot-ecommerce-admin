import api from './axios'

export const brandsApi = {
  list: () => api.get('/brands').then((r) => r.data),
  get: (id: string) => api.get(`/brands/${id}`).then((r) => r.data),
  create: (data: FormData) =>
    api.post('/brands', data, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  update: (id: string, data: FormData) =>
    api.put(`/brands/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  delete: (id: string) => api.delete(`/brands/${id}`).then((r) => r.data),
}
