import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'
import { ReactNode } from 'react'

// Mock authApi
vi.mock('@/api/auth.api', () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
  },
}))

// Mock cookie module
vi.mock('@/lib/cookie', () => {
  let store: Record<string, string> = {}
  return {
    tokenCookie: {
      getAccessToken: () => store['accessToken'] ?? null,
      getRefreshToken: () => store['refreshToken'] ?? null,
      setAccessToken: (token: string) => { store['accessToken'] = token },
      setRefreshToken: (token: string) => { store['refreshToken'] = token },
      setTokens: (at: string, rt: string) => { store['accessToken'] = at; store['refreshToken'] = rt },
      clearAll: () => { store = {} },
      _getStore: () => store,
      _reset: () => { store = {} },
    },
  }
})

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}))

import { authApi } from '@/api/auth.api'
import { tokenCookie } from '@/lib/cookie'

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(tokenCookie as any)._reset()
  })

  it('ban đầu loading=true, sau khi mount loading=false', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.user).toBeNull()
  })

  it('tự động gọi me() nếu có accessToken trong cookie', async () => {
    ;(tokenCookie as any).setAccessToken('test-token')
    const mockUser = { id: '1', email: 'a@b.com', firstName: 'A', lastName: 'B', role: 'admin' }
    vi.mocked(authApi.me).mockResolvedValue({ data: mockUser })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(authApi.me).toHaveBeenCalledTimes(1)
    expect(result.current.user).toEqual(mockUser)
  })

  it('xóa cookie khi me() thất bại', async () => {
    ;(tokenCookie as any).setAccessToken('bad-token')
    vi.mocked(authApi.me).mockRejectedValue(new Error('Invalid'))

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.user).toBeNull()
    expect(tokenCookie.getAccessToken()).toBeNull()
  })

  it('login thành công: lưu cookie, set user', async () => {
    const mockUser = { id: '1', email: 'a@b.com', firstName: 'Test', lastName: 'User', role: 'admin' }
    vi.mocked(authApi.login).mockResolvedValue({
      data: {
        tokens: { accessToken: 'access123', refreshToken: 'refresh123' },
        user: mockUser,
      },
    })

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.login('a@b.com', 'pass')
    })

    expect(authApi.login).toHaveBeenCalledWith('a@b.com', 'pass')
    expect(tokenCookie.getAccessToken()).toBe('access123')
    expect(tokenCookie.getRefreshToken()).toBe('refresh123')
    expect(result.current.user).toEqual(mockUser)
  })

  it('login từ chối role không hợp lệ', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      data: {
        tokens: { accessToken: 'x', refreshToken: 'y' },
        user: { id: '1', email: 'c@d.com', firstName: 'C', lastName: 'D', role: 'customer' as any },
      },
    })

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await expect(
      act(async () => {
        await result.current.login('c@d.com', 'pass')
      })
    ).rejects.toThrow('Bạn không có quyền truy cập trang quản trị')
  })

  it('logout: xóa cookie, set user = null', async () => {
    ;(tokenCookie as any).setTokens('token', 'refresh')
    const mockUser = { id: '1', email: 'a@b.com', firstName: 'A', lastName: 'B', role: 'admin' }
    vi.mocked(authApi.me).mockResolvedValue({ data: mockUser })
    vi.mocked(authApi.logout).mockResolvedValue({} as any)

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.user).toEqual(mockUser))

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(tokenCookie.getAccessToken()).toBeNull()
  })

  it('logout không crash nếu API lỗi', async () => {
    ;(tokenCookie as any).setTokens('token', 'refresh')
    vi.mocked(authApi.me).mockResolvedValue({ data: { id: '1', email: 'a@b.com', firstName: 'A', lastName: 'B', role: 'admin' } })
    vi.mocked(authApi.logout).mockRejectedValue(new Error('Network'))

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.user).not.toBeNull())

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.user).toBeNull()
  })
})
