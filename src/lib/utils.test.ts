import { describe, it, expect } from 'vitest'
import { cn, formatCurrency, formatDate, formatShortDate, getStatusColor, getStatusLabel } from './utils'

// ===== cn() =====
describe('cn()', () => {
  it('kết hợp nhiều class thành chuỗi', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2')
  })

  it('xử lý conditional classes', () => {
    expect(cn('base', true && 'active', false && 'hidden')).toBe('base active')
  })

  it('merge tailwind classes trùng lặp', () => {
    expect(cn('px-4', 'px-6')).toBe('px-6')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('bỏ qua giá trị falsy', () => {
    expect(cn('base', null, undefined, '', 0, false)).toBe('base')
  })

  it('trả về chuỗi rỗng khi không có input', () => {
    expect(cn()).toBe('')
  })
})

// ===== formatCurrency() =====
describe('formatCurrency()', () => {
  it('format số thành VND', () => {
    const result = formatCurrency(100000)
    expect(result).toContain('100.000')
    expect(result).toContain('₫')
  })

  it('format số 0', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0')
    expect(result).toContain('₫')
  })

  it('format số lớn', () => {
    const result = formatCurrency(1500000)
    expect(result).toContain('1.500.000')
  })

  it('format chuỗi số', () => {
    const result = formatCurrency('250000')
    expect(result).toContain('250.000')
  })

  it('format số âm', () => {
    const result = formatCurrency(-50000)
    expect(result).toContain('50.000')
  })
})

// ===== formatDate() =====
describe('formatDate()', () => {
  it('format ISO string thành dd/MM/yyyy HH:mm', () => {
    const result = formatDate('2024-01-15T14:30:00.000Z')
    expect(result).toMatch(/15\/01\/2024/)
  })

  it('trả về "—" khi date rỗng', () => {
    expect(formatDate('')).toBe('—')
  })

  it('dùng format tùy chỉnh', () => {
    const result = formatDate('2024-06-20T10:00:00.000Z', 'dd/MM/yyyy')
    expect(result).toBe('20/06/2024')
  })

  it('xử lý Date object', () => {
    const result = formatDate(new Date(2024, 0, 1), 'dd/MM/yyyy')
    expect(result).toBe('01/01/2024')
  })
})

// ===== formatShortDate() =====
describe('formatShortDate()', () => {
  it('format ngắn dd/MM/yyyy', () => {
    const result = formatShortDate('2024-03-15T10:00:00.000Z')
    expect(result).toBe('15/03/2024')
  })
})

// ===== getStatusColor() =====
describe('getStatusColor()', () => {
  it('trả về đúng class cho pending', () => {
    expect(getStatusColor('pending')).toBe('bg-yellow-100 text-yellow-800')
  })

  it('trả về đúng class cho delivered', () => {
    expect(getStatusColor('delivered')).toBe('bg-green-100 text-green-800')
  })

  it('trả về đúng class cho cancelled', () => {
    expect(getStatusColor('cancelled')).toBe('bg-red-100 text-red-800')
  })

  it('trả về đúng class cho shipped', () => {
    expect(getStatusColor('shipped')).toBe('bg-purple-100 text-purple-800')
  })

  it('trả về đúng class cho processing', () => {
    expect(getStatusColor('processing')).toBe('bg-blue-100 text-blue-800')
  })

  it('trả về đúng class cho paid', () => {
    expect(getStatusColor('paid')).toBe('bg-green-100 text-green-800')
  })

  it('trả về đúng class cho active', () => {
    expect(getStatusColor('active')).toBe('bg-green-100 text-green-800')
  })

  it('trả về đúng class cho in_transit', () => {
    expect(getStatusColor('in_transit')).toBe('bg-blue-100 text-blue-800')
  })

  it('trả về default class cho status không xác định', () => {
    expect(getStatusColor('unknown_status')).toBe('bg-gray-100 text-gray-800')
  })

  it('trả về default cho chuỗi rỗng', () => {
    expect(getStatusColor('')).toBe('bg-gray-100 text-gray-800')
  })
})

// ===== getStatusLabel() =====
describe('getStatusLabel()', () => {
  it('trả về nhãn tiếng Việt cho pending', () => {
    expect(getStatusLabel('pending')).toBe('Chờ xử lý')
  })

  it('trả về nhãn tiếng Việt cho delivered', () => {
    expect(getStatusLabel('delivered')).toBe('Đã giao hàng')
  })

  it('trả về nhãn tiếng Việt cho cancelled', () => {
    expect(getStatusLabel('cancelled')).toBe('Đã hủy')
  })

  it('trả về nhãn cho phương thức thanh toán', () => {
    expect(getStatusLabel('cod')).toBe('Tiền mặt (COD)')
    expect(getStatusLabel('vnpay')).toBe('VNPay')
    expect(getStatusLabel('momo')).toBe('MoMo')
    expect(getStatusLabel('bank_transfer')).toBe('Chuyển khoản')
  })

  it('trả về nhãn cho loại coupon', () => {
    expect(getStatusLabel('percentage')).toBe('Phần trăm')
    expect(getStatusLabel('fixed')).toBe('Số tiền cố định')
    expect(getStatusLabel('free_shipping')).toBe('Miễn phí ship')
  })

  it('trả về nhãn cho trạng thái vận chuyển', () => {
    expect(getStatusLabel('in_transit')).toBe('Đang vận chuyển')
    expect(getStatusLabel('out_for_delivery')).toBe('Đang giao hàng')
  })

  it('trả về chính status nếu không có mapping', () => {
    expect(getStatusLabel('unknown_thing')).toBe('unknown_thing')
  })
})
