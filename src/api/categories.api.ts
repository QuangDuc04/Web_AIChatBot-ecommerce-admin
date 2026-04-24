import api from './axios'

export const categoriesApi = {
  list: () => api.get('/categories').then((r) => r.data),
  tree: () => api.get('/categories/tree').then((r) => r.data),
  get: (id: string) => api.get(`/categories/${id}`).then((r) => r.data),
  create: (data: FormData) =>
    api.post('/categories', data, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  update: (id: string, data: FormData) =>
    api.put(`/categories/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  delete: (id: string) => api.delete(`/categories/${id}`).then((r) => r.data),
}
