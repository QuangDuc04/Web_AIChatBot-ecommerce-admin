import api from './axios'

export const chatbotHistoryApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/admin/chatbot-history', { params }).then((r) => r.data),
  get: (id: string) =>
    api.get(`/admin/chatbot-history/${id}`).then((r) => r.data),
}
