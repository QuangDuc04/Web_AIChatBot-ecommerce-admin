import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { ThemeProvider, useTheme } from './ThemeContext'
import { ReactNode } from 'react'

const wrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
)

describe('ThemeContext', () => {
  it('mặc định là light khi chưa có localStorage', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe('light')
  })

  it('đọc theme từ localStorage', () => {
    localStorage.setItem('theme', 'dark')
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe('dark')
  })

  it('toggleTheme chuyển từ light sang dark', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe('light')

    act(() => { result.current.toggleTheme() })
    expect(result.current.theme).toBe('dark')
  })

  it('toggleTheme chuyển từ dark sang light', () => {
    localStorage.setItem('theme', 'dark')
    const { result } = renderHook(() => useTheme(), { wrapper })

    act(() => { result.current.toggleTheme() })
    expect(result.current.theme).toBe('light')
  })

  it('lưu theme vào localStorage khi thay đổi', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })

    act(() => { result.current.toggleTheme() })
    expect(localStorage.getItem('theme')).toBe('dark')

    act(() => { result.current.toggleTheme() })
    expect(localStorage.getItem('theme')).toBe('light')
  })

  it('setTheme trực tiếp', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })

    act(() => { result.current.setTheme('dark') })
    expect(result.current.theme).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('thêm class vào document.documentElement', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })

    act(() => { result.current.setTheme('dark') })
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    act(() => { result.current.setTheme('light') })
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
