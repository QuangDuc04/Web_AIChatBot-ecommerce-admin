import api from './axios'

export const settingsApi = {
  list: () => api.get('/admin/settings').then((r) => r.data),
  get: (key: string) => api.get(`/admin/settings/${key}`).then((r) => r.data),
  update: (key: string, value: unknown) =>
    api.put(`/admin/settings/${key}`, { value }).then((r) => r.data),
  bulkUpdate: (settings: Record<string, unknown>) =>
    api.put('/admin/settings', {
      settings: Object.entries(settings).map(([key, value]) => ({ key, value })),
    }).then((r) => r.data),
}
