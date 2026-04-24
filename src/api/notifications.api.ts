import api from './axios'

export const notificationsApi = {
  // Send notifications to customers
  create: (data: Record<string, unknown>) =>
    api.post('/admin/notifications', data).then((r) => r.data),
  bulk: (data: Record<string, unknown>) =>
    api.post('/admin/notifications/bulk', data).then((r) => r.data),
  // Admin's own notifications
  myList: (params?: Record<string, unknown>) =>
    api.get('/admin/notifications/me', { params }).then((r) => r.data),
  unreadCount: () => api.get('/admin/notifications/me/unread-count').then((r) => r.data),
  markAllRead: () => api.put('/admin/notifications/me/mark-all-read').then((r) => r.data),
  markRead: (id: string) => api.put(`/admin/notifications/me/${id}/read`).then((r) => r.data),
  delete: (id: string) => api.delete(`/admin/notifications/me/${id}`).then((r) => r.data),
}
