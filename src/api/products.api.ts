import api from './axios'

export const productsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/products', { params }).then((r) => r.data),
  get: (id: string) => api.get(`/products/${id}`).then((r) => r.data),
  create: (data: FormData | Record<string, unknown>) =>
    api.post('/products', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/products/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/products/${id}`).then((r) => r.data),
  uploadImages: (id: string, data: FormData) =>
    api.post(`/products/${id}/images`, data, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  deleteImage: (id: string, imageId: string) =>
    api.delete(`/products/${id}/images/${imageId}`).then((r) => r.data),
  setPrimaryImage: (id: string, imageId: string) =>
    api.put(`/products/${id}/images/${imageId}/primary`).then((r) => r.data),
  createVariant: (id: string, data: Record<string, unknown>) =>
    api.post(`/products/${id}/variants`, data).then((r) => r.data),
  updateVariant: (variantId: string, data: Record<string, unknown>) =>
    api.put(`/products/variants/${variantId}`, data).then((r) => r.data),
  deleteVariant: (variantId: string) =>
    api.delete(`/products/variants/${variantId}`).then((r) => r.data),
}
