import axios from 'axios'
import toast from 'react-hot-toast'
import { tokenCookie } from '@/lib/cookie'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const token = tokenCookie.getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let failedQueue: { resolve: (v: string) => void; reject: (e: unknown) => void }[] = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)))
  failedQueue = []
}

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry && !original._skipAuthRetry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }
      original._retry = true
      isRefreshing = true
      const refreshToken = tokenCookie.getRefreshToken()
      if (!refreshToken) {
        isRefreshing = false
        tokenCookie.clearAll()
        window.location.href = '/login'
        return Promise.reject(error)
      }
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/refresh-token`,
          { refreshToken }
        )
        const newToken = data.data.accessToken
        tokenCookie.setAccessToken(newToken)
        if (data.data.refreshToken) tokenCookie.setRefreshToken(data.data.refreshToken)
        processQueue(null, newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch (err) {
        processQueue(err, null)
        tokenCookie.clearAll()
        window.location.href = '/login'
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }
    const msg = error.response?.data?.message || 'Có lỗi xảy ra'
    if (error.response?.status !== 401) toast.error(msg)
    return Promise.reject(error)
  }
)

export default api
