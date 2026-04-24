import api from './axios'
import { tokenCookie } from '@/lib/cookie'

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }, { _skipAuthRetry: true } as any).then((r) => r.data),
  register: (data: { firstName: string; lastName: string; email: string; password: string }) =>
    api.post('/auth/register', data).then((r) => r.data),
  logout: () => api.post('/auth/logout', { refreshToken: tokenCookie.getRefreshToken() }),
  me: () => api.get('/auth/me').then((r) => r.data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data).then((r) => r.data),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }).then((r) => r.data),
  resetPassword: (data: { token: string; newPassword: string }) =>
    api.post('/auth/reset-password', data).then((r) => r.data),
}
