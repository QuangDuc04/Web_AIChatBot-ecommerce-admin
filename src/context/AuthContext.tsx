import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { authApi } from '@/api/auth.api'
import { tokenCookie } from '@/lib/cookie'
import toast from 'react-hot-toast'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'staff'
  avatar?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>(null!)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = tokenCookie.getAccessToken()
    if (!token) { setLoading(false); return }
    authApi.me()
      .then((res) => setUser(res.data))
      .catch(() => tokenCookie.clearAll())
      .finally(() => setLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login(email, password)

    const { tokens, user } = data
    if (!['admin', 'staff'].includes(user.role)) {
      throw new Error('Bạn không có quyền truy cập trang quản trị')
    }
    const { accessToken, refreshToken } = tokens
    tokenCookie.setTokens(accessToken, refreshToken)
    setUser(user)
    toast.success(`Chào mừng, ${user.firstName} ${user.lastName}!`)
  }

  const logout = async () => {
    try { await authApi.logout() } catch {}
    tokenCookie.clearAll()
    setUser(null)
    toast.success('Đã đăng xuất')
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
