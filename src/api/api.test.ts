import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock axios trước khi import
vi.mock('./axios', () => {
  const mockAxios = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
  return { default: mockAxios }
})

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
      _reset: () => { store = {} },
    },
  }
})

import api from './axios'
import { authApi } from './auth.api'
import { productsApi } from './products.api'
import { categoriesApi } from './categories.api'
import { brandsApi } from './brands.api'
import { ordersApi } from './orders.api'
import { paymentsApi } from './payments.api'
import { shipmentsApi } from './shipments.api'
import { couponsApi } from './coupons.api'
import { flashSalesApi } from './flashSales.api'
import { bannersApi } from './banners.api'
import { reviewsApi } from './reviews.api'
import { conversationsApi } from './conversations.api'
import { notificationsApi } from './notifications.api'
import { settingsApi } from './settings.api'
import { uploadApi } from './upload.api'
import { analyticsApi } from './analytics.api'
import { newsApi } from './news.api'

beforeEach(() => {
  vi.clearAllMocks()
  const mockResponse = { data: { success: true } }
  vi.mocked(api.get).mockResolvedValue(mockResponse)
  vi.mocked(api.post).mockResolvedValue(mockResponse)
  vi.mocked(api.put).mockResolvedValue(mockResponse)
  vi.mocked(api.delete).mockResolvedValue(mockResponse)
})

// ===== authApi =====
describe('authApi', () => {
  it('login gọi POST /auth/login', async () => {
    await authApi.login('test@email.com', 'pass123')
    expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'test@email.com', password: 'pass123' }, expect.any(Object))
  })

  it('register gọi POST /auth/register', async () => {
    const data = { firstName: 'A', lastName: 'B', email: 'a@b.com', password: '123' }
    await authApi.register(data)
    expect(api.post).toHaveBeenCalledWith('/auth/register', data)
  })

  it('me gọi GET /auth/me', async () => {
    await authApi.me()
    expect(api.get).toHaveBeenCalledWith('/auth/me')
  })

  it('logout gọi POST /auth/logout với refreshToken từ cookie', async () => {
    const { tokenCookie } = await import('@/lib/cookie')
    ;(tokenCookie as any).setRefreshToken('rt-123')
    await authApi.logout()
    expect(api.post).toHaveBeenCalledWith('/auth/logout', { refreshToken: 'rt-123' })
  })

  it('forgotPassword gọi POST /auth/forgot-password', async () => {
    await authApi.forgotPassword('test@email.com')
    expect(api.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'test@email.com' })
  })

  it('resetPassword gọi POST /auth/reset-password', async () => {
    await authApi.resetPassword({ token: 'abc', newPassword: 'new123' })
    expect(api.post).toHaveBeenCalledWith('/auth/reset-password', { token: 'abc', newPassword: 'new123' })
  })

  it('changePassword gọi POST /auth/change-password', async () => {
    await authApi.changePassword({ currentPassword: 'old', newPassword: 'new' })
    expect(api.post).toHaveBeenCalledWith('/auth/change-password', { currentPassword: 'old', newPassword: 'new' })
  })
})

// ===== productsApi =====
describe('productsApi', () => {
  it('list gọi GET /products với params', async () => {
    await productsApi.list({ page: 1, limit: 15 })
    expect(api.get).toHaveBeenCalledWith('/products', { params: { page: 1, limit: 15 } })
  })

  it('get gọi GET /products/:id', async () => {
    await productsApi.get('prod-123')
    expect(api.get).toHaveBeenCalledWith('/products/prod-123')
  })

  it('create gọi POST /products', async () => {
    const data = { name: 'Test', price: 100 }
    await productsApi.create(data)
    expect(api.post).toHaveBeenCalledWith('/products', data)
  })

  it('update gọi PUT /products/:id', async () => {
    await productsApi.update('prod-123', { name: 'Updated' })
    expect(api.put).toHaveBeenCalledWith('/products/prod-123', { name: 'Updated' })
  })

  it('delete gọi DELETE /products/:id', async () => {
    await productsApi.delete('prod-123')
    expect(api.delete).toHaveBeenCalledWith('/products/prod-123')
  })

  it('uploadImages gọi POST /products/:id/images', async () => {
    const fd = new FormData()
    await productsApi.uploadImages('prod-123', fd)
    expect(api.post).toHaveBeenCalledWith('/products/prod-123/images', fd, expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } }))
  })

  it('deleteImage gọi DELETE /products/:id/images/:imageId', async () => {
    await productsApi.deleteImage('prod-1', 'img-2')
    expect(api.delete).toHaveBeenCalledWith('/products/prod-1/images/img-2')
  })

  it('setPrimaryImage gọi PUT /products/:id/images/:imageId/primary', async () => {
    await productsApi.setPrimaryImage('prod-1', 'img-2')
    expect(api.put).toHaveBeenCalledWith('/products/prod-1/images/img-2/primary')
  })
})

// ===== categoriesApi =====
describe('categoriesApi', () => {
  it('list gọi GET /categories', async () => {
    await categoriesApi.list()
    expect(api.get).toHaveBeenCalledWith('/categories')
  })

  it('create gọi POST /categories với FormData', async () => {
    const fd = new FormData()
    await categoriesApi.create(fd)
    expect(api.post).toHaveBeenCalledWith('/categories', fd, expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } }))
  })

  it('delete gọi DELETE /categories/:id', async () => {
    await categoriesApi.delete('cat-1')
    expect(api.delete).toHaveBeenCalledWith('/categories/cat-1')
  })
})

// ===== brandsApi =====
describe('brandsApi', () => {
  it('list gọi GET /brands', async () => {
    await brandsApi.list()
    expect(api.get).toHaveBeenCalledWith('/brands')
  })

  it('create gọi POST /brands', async () => {
    const fd = new FormData()
    await brandsApi.create(fd)
    expect(api.post).toHaveBeenCalledWith('/brands', fd, expect.any(Object))
  })

  it('update gọi PUT /brands/:id', async () => {
    const fd = new FormData()
    await brandsApi.update('b-1', fd)
    expect(api.put).toHaveBeenCalledWith('/brands/b-1', fd, expect.any(Object))
  })
})

// ===== ordersApi =====
describe('ordersApi', () => {
  it('list gọi GET /admin/orders', async () => {
    await ordersApi.list({ page: 1 })
    expect(api.get).toHaveBeenCalledWith('/admin/orders', { params: { page: 1 } })
  })

  it('get gọi GET /admin/orders/:id', async () => {
    await ordersApi.get('ord-1')
    expect(api.get).toHaveBeenCalledWith('/admin/orders/ord-1')
  })

  it('updateStatus gọi PUT /admin/orders/:id/status', async () => {
    await ordersApi.updateStatus('ord-1', { status: 'confirmed', note: 'OK' })
    expect(api.put).toHaveBeenCalledWith('/admin/orders/ord-1/status', { status: 'confirmed', note: 'OK' })
  })

  it('bulkUpdateStatus gọi PUT /admin/orders/bulk-update-status', async () => {
    await ordersApi.bulkUpdateStatus({ orderIds: ['a', 'b'], status: 'shipped' })
    expect(api.put).toHaveBeenCalledWith('/admin/orders/bulk-update-status', { orderIds: ['a', 'b'], status: 'shipped' })
  })
})

// ===== paymentsApi =====
describe('paymentsApi', () => {
  it('list gọi GET /admin/payments', async () => {
    await paymentsApi.list({ page: 1, status: 'paid' })
    expect(api.get).toHaveBeenCalledWith('/admin/payments', { params: { page: 1, status: 'paid' } })
  })

  it('confirmCOD gọi POST /admin/payments/:orderId/confirm-cod', async () => {
    await paymentsApi.confirmCOD('ord-1')
    expect(api.post).toHaveBeenCalledWith('/admin/payments/ord-1/confirm-cod')
  })

  it('refund gọi POST /admin/payments/:id/refund', async () => {
    await paymentsApi.refund('pay-1', { amount: 50000, reason: 'Hàng lỗi' })
    expect(api.post).toHaveBeenCalledWith('/admin/payments/pay-1/refund', { amount: 50000, reason: 'Hàng lỗi' })
  })
})

// ===== shipmentsApi =====
describe('shipmentsApi', () => {
  it('list gọi GET /admin/shipments', async () => {
    await shipmentsApi.list({ page: 1 })
    expect(api.get).toHaveBeenCalledWith('/admin/shipments', { params: { page: 1 } })
  })

  it('create gọi POST /admin/shipments', async () => {
    await shipmentsApi.create({ orderId: '1', carrier: 'GHN' })
    expect(api.post).toHaveBeenCalledWith('/admin/shipments', { orderId: '1', carrier: 'GHN' })
  })

  it('markDelivered gọi PUT /admin/shipments/:id/deliver', async () => {
    await shipmentsApi.markDelivered('ship-1')
    expect(api.put).toHaveBeenCalledWith('/admin/shipments/ship-1/deliver')
  })

  it('markFailed gọi PUT /admin/shipments/:id/fail', async () => {
    await shipmentsApi.markFailed('ship-1', { reason: 'Không liên lạc' })
    expect(api.put).toHaveBeenCalledWith('/admin/shipments/ship-1/fail', { reason: 'Không liên lạc' })
  })

  it('addUpdate gọi POST /admin/shipments/update', async () => {
    await shipmentsApi.addUpdate({ shipmentId: 's1', status: 'in_transit' })
    expect(api.post).toHaveBeenCalledWith('/admin/shipments/update', { shipmentId: 's1', status: 'in_transit' })
  })
})

// ===== couponsApi =====
describe('couponsApi', () => {
  it('list gọi GET /admin/coupons', async () => {
    await couponsApi.list()
    expect(api.get).toHaveBeenCalledWith('/admin/coupons', { params: undefined })
  })

  it('create gọi POST /admin/coupons', async () => {
    await couponsApi.create({ code: 'SALE10', type: 'percentage', value: 10 })
    expect(api.post).toHaveBeenCalledWith('/admin/coupons', { code: 'SALE10', type: 'percentage', value: 10 })
  })

  it('usage gọi GET /admin/coupons/:id/usage', async () => {
    await couponsApi.usage('c-1')
    expect(api.get).toHaveBeenCalledWith('/admin/coupons/c-1/usage')
  })

  it('delete gọi DELETE /admin/coupons/:id', async () => {
    await couponsApi.delete('c-1')
    expect(api.delete).toHaveBeenCalledWith('/admin/coupons/c-1')
  })
})

// ===== flashSalesApi =====
describe('flashSalesApi', () => {
  it('list gọi GET /admin/flash-sales', async () => {
    await flashSalesApi.list()
    expect(api.get).toHaveBeenCalledWith('/admin/flash-sales', { params: undefined })
  })

  it('create gọi POST /admin/flash-sales', async () => {
    await flashSalesApi.create({ name: 'Sale' })
    expect(api.post).toHaveBeenCalledWith('/admin/flash-sales', { name: 'Sale' })
  })

  it('addItem gọi POST /admin/flash-sales/:id/items', async () => {
    await flashSalesApi.addItem('fs-1', { productId: 'p1', discountPercent: 20 })
    expect(api.post).toHaveBeenCalledWith('/admin/flash-sales/fs-1/items', { productId: 'p1', discountPercent: 20 })
  })

  it('removeItem gọi DELETE /admin/flash-sales/items/:id', async () => {
    await flashSalesApi.removeItem('item-1')
    expect(api.delete).toHaveBeenCalledWith('/admin/flash-sales/items/item-1')
  })
})

// ===== bannersApi =====
describe('bannersApi', () => {
  it('list gọi GET /admin/banners', async () => {
    await bannersApi.list()
    expect(api.get).toHaveBeenCalledWith('/admin/banners')
  })

  it('create gọi POST /admin/banners với FormData', async () => {
    const fd = new FormData()
    await bannersApi.create(fd)
    expect(api.post).toHaveBeenCalledWith('/admin/banners', fd, expect.any(Object))
  })

  it('delete gọi DELETE /admin/banners/:id', async () => {
    await bannersApi.delete('b-1')
    expect(api.delete).toHaveBeenCalledWith('/admin/banners/b-1')
  })
})

// ===== reviewsApi =====
describe('reviewsApi', () => {
  it('listByProduct gọi GET /reviews/product/:id', async () => {
    await reviewsApi.listByProduct('p-1', { page: 1 })
    expect(api.get).toHaveBeenCalledWith('/reviews/product/p-1', { params: { page: 1 } })
  })

  it('reply gọi POST /reviews/:id/reply', async () => {
    await reviewsApi.reply('r-1', { content: 'Cảm ơn bạn' })
    expect(api.post).toHaveBeenCalledWith('/reviews/r-1/reply', { content: 'Cảm ơn bạn' })
  })

  it('delete gọi DELETE /reviews/:id', async () => {
    await reviewsApi.delete('r-1')
    expect(api.delete).toHaveBeenCalledWith('/reviews/r-1')
  })
})

// ===== conversationsApi =====
describe('conversationsApi', () => {
  it('list gọi GET /admin/conversations', async () => {
    await conversationsApi.list({ status: 'open' })
    expect(api.get).toHaveBeenCalledWith('/admin/conversations', { params: { status: 'open' } })
  })

  it('close gọi PUT /admin/conversations/:id/close', async () => {
    await conversationsApi.close('conv-1')
    expect(api.put).toHaveBeenCalledWith('/admin/conversations/conv-1/close')
  })

  it('getMessages gọi GET /conversations/:id/messages', async () => {
    await conversationsApi.getMessages('conv-1')
    expect(api.get).toHaveBeenCalledWith('/conversations/conv-1/messages')
  })

  it('sendMessage gọi POST /admin/conversations/:id/messages', async () => {
    await conversationsApi.sendMessage('conv-1', { message: 'hello' })
    expect(api.post).toHaveBeenCalledWith('/admin/conversations/conv-1/messages', { message: 'hello' })
  })
})

// ===== notificationsApi =====
describe('notificationsApi', () => {
  it('create gọi POST /admin/notifications', async () => {
    await notificationsApi.create({ title: 'Hi', message: 'Test' })
    expect(api.post).toHaveBeenCalledWith('/admin/notifications', { title: 'Hi', message: 'Test' })
  })

  it('bulk gọi POST /admin/notifications/bulk', async () => {
    await notificationsApi.bulk({ title: 'Hi', message: 'All' })
    expect(api.post).toHaveBeenCalledWith('/admin/notifications/bulk', { title: 'Hi', message: 'All' })
  })

  it('markRead gọi PUT /notifications/:id/read', async () => {
    await notificationsApi.markRead('n-1')
    expect(api.put).toHaveBeenCalledWith('/notifications/n-1/read')
  })

  it('markAllRead gọi PUT /notifications/mark-all-read', async () => {
    await notificationsApi.markAllRead()
    expect(api.put).toHaveBeenCalledWith('/notifications/mark-all-read')
  })
})

// ===== settingsApi =====
describe('settingsApi', () => {
  it('list gọi GET /admin/settings', async () => {
    await settingsApi.list()
    expect(api.get).toHaveBeenCalledWith('/admin/settings')
  })

  it('bulkUpdate gọi PUT /admin/settings', async () => {
    await settingsApi.bulkUpdate({ site_name: 'Test', contact_email: 'a@b.com' })
    expect(api.put).toHaveBeenCalledWith('/admin/settings', {
      settings: [
        { key: 'site_name', value: 'Test' },
        { key: 'contact_email', value: 'a@b.com' },
      ],
    })
  })

  it('update gọi PUT /admin/settings/:key', async () => {
    await settingsApi.update('site_name', 'My Site')
    expect(api.put).toHaveBeenCalledWith('/admin/settings/site_name', { value: 'My Site' })
  })
})

// ===== uploadApi =====
describe('uploadApi', () => {
  it('image gọi POST /upload/image với FormData', async () => {
    const file = new File(['test'], 'test.png', { type: 'image/png' })
    await uploadApi.image(file)
    expect(api.post).toHaveBeenCalledWith('/upload/image', expect.any(FormData), expect.any(Object))
  })

  it('images gọi POST /upload/images với nhiều file', async () => {
    const files = [
      new File(['a'], 'a.png', { type: 'image/png' }),
      new File(['b'], 'b.png', { type: 'image/png' }),
    ]
    await uploadApi.images(files)
    expect(api.post).toHaveBeenCalledWith('/upload/images', expect.any(FormData), expect.any(Object))
  })

  it('delete gọi DELETE /upload/image', async () => {
    await uploadApi.delete('public-id-123')
    expect(api.delete).toHaveBeenCalledWith('/upload/image', { data: { publicId: 'public-id-123' } })
  })
})

// ===== analyticsApi =====
describe('analyticsApi', () => {
  it('dashboard gọi GET /admin/analytics/dashboard', async () => {
    await analyticsApi.dashboard()
    expect(api.get).toHaveBeenCalledWith('/admin/analytics/dashboard')
  })

  it('revenue gọi GET /admin/analytics/revenue', async () => {
    await analyticsApi.revenue({ period: '30d' })
    expect(api.get).toHaveBeenCalledWith('/admin/analytics/revenue', { params: { period: '30d' } })
  })

  it('products gọi GET /admin/analytics/products', async () => {
    await analyticsApi.products({ period: '7d' })
    expect(api.get).toHaveBeenCalledWith('/admin/analytics/products', { params: { period: '7d' } })
  })

  it('customers gọi GET /admin/analytics/customers', async () => {
    await analyticsApi.customers()
    expect(api.get).toHaveBeenCalledWith('/admin/analytics/customers', { params: undefined })
  })
})

// ===== newsApi =====
describe('newsApi', () => {
  it('list gọi GET /admin/news', async () => {
    await newsApi.list({ search: 'test' })
    expect(api.get).toHaveBeenCalledWith('/admin/news', { params: { search: 'test' } })
  })

  it('create gọi POST /admin/news', async () => {
    const fd = new FormData()
    await newsApi.create(fd)
    expect(api.post).toHaveBeenCalledWith('/admin/news', fd, expect.any(Object))
  })

  it('delete gọi DELETE /admin/news/:id', async () => {
    await newsApi.delete('n-1')
    expect(api.delete).toHaveBeenCalledWith('/admin/news/n-1')
  })
})
