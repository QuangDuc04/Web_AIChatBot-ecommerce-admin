import api from './axios'

export const reviewsApi = {
  listByProduct: (productId: string, params?: Record<string, unknown>) =>
    api.get(`/reviews/product/${productId}`, { params }).then((r) => r.data),
  get: (id: string) => api.get(`/reviews/${id}`).then((r) => r.data),
  delete: (id: string) => api.delete(`/reviews/${id}`).then((r) => r.data),
  reply: (id: string, data: { content: string }) =>
    api.post(`/reviews/${id}/reply`, data).then((r) => r.data),
  deleteReply: (replyId: string) =>
    api.delete(`/reviews/replies/${replyId}`).then((r) => r.data),
}
