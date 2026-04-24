import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from './useDebounce'

describe('useDebounce()', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('trả về giá trị ban đầu ngay lập tức', () => {
    const { result } = renderHook(() => useDebounce('hello', 400))
    expect(result.current).toBe('hello')
  })

  it('không cập nhật giá trị trước khi hết delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 400 } }
    )

    rerender({ value: 'ab', delay: 400 })
    act(() => { vi.advanceTimersByTime(200) })
    expect(result.current).toBe('a')
  })

  it('cập nhật giá trị sau khi hết delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 400 } }
    )

    rerender({ value: 'ab', delay: 400 })
    act(() => { vi.advanceTimersByTime(400) })
    expect(result.current).toBe('ab')
  })

  it('reset timer khi value thay đổi liên tục', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 400 } }
    )

    rerender({ value: 'ab', delay: 400 })
    act(() => { vi.advanceTimersByTime(200) })

    rerender({ value: 'abc', delay: 400 })
    act(() => { vi.advanceTimersByTime(200) })

    // Chưa đủ 400ms từ lần thay đổi cuối
    expect(result.current).toBe('a')

    act(() => { vi.advanceTimersByTime(200) })
    // Bây giờ đủ 400ms
    expect(result.current).toBe('abc')
  })

  it('dùng delay mặc định 400ms', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 'test' } }
    )

    rerender({ value: 'test2' })
    act(() => { vi.advanceTimersByTime(399) })
    expect(result.current).toBe('test')

    act(() => { vi.advanceTimersByTime(1) })
    expect(result.current).toBe('test2')
  })

  it('hoạt động với số', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 1 } }
    )

    rerender({ value: 42 })
    act(() => { vi.advanceTimersByTime(300) })
    expect(result.current).toBe(42)
  })

  it('hoạt động với object', () => {
    const obj1 = { a: 1 }
    const obj2 = { a: 2 }
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 200),
      { initialProps: { value: obj1 } }
    )

    rerender({ value: obj2 })
    act(() => { vi.advanceTimersByTime(200) })
    expect(result.current).toEqual({ a: 2 })
  })
})
