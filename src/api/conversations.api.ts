import api from './axios'

export const conversationsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/admin/conversations', { params }).then((r) => r.data),
  stats: () => api.get('/admin/conversations/stats').then((r) => r.data),
  get: (id: string) => api.get(`/admin/conversations/${id}`).then((r) => r.data),
  assign: (id: string, data: { staffId: string }) =>
    api.post(`/admin/conversations/${id}/assign`, data).then((r) => r.data),
  close: (id: string) => api.put(`/admin/conversations/${id}/close`).then((r) => r.data),
  reopen: (id: string) => api.put(`/admin/conversations/${id}/reopen`).then((r) => r.data),
  getMessages: (id: string) =>
    api.get(`/admin/conversations/${id}/messages`).then((r) => r.data),
  sendMessage: (id: string, data: { message: string }) =>
    api.post(`/admin/conversations/${id}/messages`, data).then((r) => r.data),
}
