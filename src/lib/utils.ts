import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string) {
  const num = Number(amount)
  if (!num || num === 0) return '0'
  return Math.round(num).toLocaleString('vi-VN')
}

export function formatDate(date: string | Date, fmt = 'dd/MM/yyyy HH:mm') {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, fmt, { locale: vi })
}

export function formatShortDate(date: string | Date) {
  return formatDate(date, 'dd/MM/yyyy')
}

export function getStatusColor(status: string) {
  const map: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-blue-100 text-blue-800',
    shipping: 'bg-purple-100 text-purple-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
    paid: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    open: 'bg-blue-100 text-blue-800',
    closed: 'bg-gray-100 text-gray-800',
    in_transit: 'bg-blue-100 text-blue-800',
    out_for_delivery: 'bg-orange-100 text-orange-800',
  }
  return map[status] || 'bg-gray-100 text-gray-800'
}

export function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    pending: 'Chờ xử lý',
    processing: 'Đang xử lý',
    confirmed: 'Đã xác nhận',
    shipping: 'Đang giao hàng',
    shipped: 'Đã giao vận',
    delivered: 'Đã giao hàng',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
    refunded: 'Hoàn tiền',
    paid: 'Đã thanh toán',
    failed: 'Thất bại',
    active: 'Hoạt động',
    inactive: 'Không hoạt động',
    open: 'Đang mở',
    closed: 'Đã đóng',
    in_transit: 'Đang vận chuyển',
    out_for_delivery: 'Đang giao hàng',
    cod: 'Tiền mặt (COD)',
    vnpay: 'VNPay',
    momo: 'MoMo',
    bank_transfer: 'Chuyển khoản',
    percentage: 'Phần trăm',
    fixed: 'Số tiền cố định',
    free_shipping: 'Miễn phí ship',
  }
  return map[status] || status
}
