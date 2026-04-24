import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './AuthContext'
import { tokenCookie } from '@/lib/cookie'
import { notificationsApi } from '@/api/notifications.api'
import toast from 'react-hot-toast'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'
const PAGE_SIZE = 15

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdminNotification {
  id: string
  type: 'order_new' | 'order_update' | 'contact' | 'system' | 'stock_low'
  title: string
  message: string
  url?: string
  read: boolean
  createdAt: string
}

interface NotificationContextType {
  notifications: AdminNotification[]
  unreadCount: number
  hasMore: boolean
  loadingMore: boolean
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearAll: () => void
  loadMore: () => void
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  hasMore: false,
  loadingMore: false,
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearAll: () => {},
  loadMore: () => {},
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Sort: unread first, then by createdAt descending */
function sortNotifications(list: AdminNotification[]): AdminNotification[] {
  return [...list].sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}

/** Deduplicate by id */
function dedup(list: AdminNotification[]): AdminNotification[] {
  const seen = new Set<string>()
  return list.filter((n) => {
    if (seen.has(n.id)) return false
    seen.add(n.id)
    return true
  })
}

/** Map API response item to AdminNotification */
function mapApiNotif(n: any): AdminNotification {
  return {
    id: n.id || n._id,
    type: n.type || 'system',
    title: n.title || 'Thông báo',
    message: n.message || n.body || '',
    url: n.url || n.link,
    read: !!n.read || !!n.isRead,
    createdAt: n.createdAt || n.created_at || new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  // ── Reset state on logout ──
  useEffect(() => {
    if (!user) {
      setNotifications([])
      setPage(1)
      setHasMore(false)
      setApiAvailable(false)
    }
  }, [user])

  // ── Check API availability & fetch initial data ──
  const [apiAvailable, setApiAvailable] = useState(false)

  useEffect(() => {
    if (!user) return
    notificationsApi.myList({ page: 1, limit: PAGE_SIZE })
      .then((res) => {
        setApiAvailable(true)
        const items: any[] = res?.data?.items || res?.data || []
        const mapped = items.map(mapApiNotif)
        const totalPages = res?.data?.totalPages || 1
        setNotifications((prev) => sortNotifications(dedup([...mapped, ...prev])))
        setPage(1)
        setHasMore(1 < totalPages)
      })
      .catch(() => {
        // API not available — rely on WebSocket only
        setApiAvailable(false)
      })
  }, [user])

  async function fetchNotifications(p: number) {
    try {
      const res = await notificationsApi.myList({ page: p, limit: PAGE_SIZE })
      const items: any[] = res?.data?.items || res?.data || []
      const mapped = items.map(mapApiNotif)
      const totalPages = res?.data?.totalPages || 1

      setNotifications((prev) => sortNotifications(dedup([...prev, ...mapped])))
      setPage(p)
      setHasMore(p < totalPages)
    } catch {
      setHasMore(false)
    }
  }

  // ── Load more ──
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !apiAvailable) return
    setLoadingMore(true)
    await fetchNotifications(page + 1)
    setLoadingMore(false)
  }, [loadingMore, hasMore, page, apiAvailable])

  // ── Connect socket when user is available ──
  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      return
    }

    const token = tokenCookie.getAccessToken()
    if (!token) return

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    })

    socket.on('connect', () => {
      socket.emit('order:subscribe')
    })

    // ── Realtime events ──

    const pushNotif = (notif: AdminNotification) => {
      setNotifications((prev) => sortNotifications(dedup([notif, ...prev])))
    }

    // New order from customer checkout
    socket.on('order:new', (data: { order: any }) => {
      const o = data.order
      pushNotif({
        id: `order-${o.id || o.orderNumber}-${Date.now()}`,
        type: 'order_new',
        title: 'Đơn hàng mới',
        message: `${o.customerName || o.guestName || 'Khách'} đặt đơn #${o.orderNumber} - ${formatMoney(o.total)}`,
        url: `/orders/${o.id}`,
        read: false,
        createdAt: new Date().toISOString(),
      })
      toast.success(`🛒 Đơn hàng mới #${o.orderNumber}`, { duration: 5000 })
      playNotificationSound()
    })

    // Order status updated
    socket.on('order:updated', (data: { order: any }) => {
      const o = data.order
      pushNotif({
        id: `order-update-${o.id}-${Date.now()}`,
        type: 'order_update',
        title: 'Cập nhật đơn hàng',
        message: `Đơn #${o.orderNumber} đã được cập nhật`,
        url: `/orders/${o.id}`,
        read: false,
        createdAt: new Date().toISOString(),
      })
    })

    // Low stock warning
    socket.on('product:stock_low', (data: { product: any }) => {
      const p = data.product
      pushNotif({
        id: `stock-${p.id}-${Date.now()}`,
        type: 'stock_low',
        title: 'Sắp hết hàng',
        message: `${p.name} chỉ còn ${p.quantity} sản phẩm`,
        url: `/products/${p.id}`,
        read: false,
        createdAt: new Date().toISOString(),
      })
      toast(`⚠️ ${p.name} sắp hết hàng`, { duration: 4000 })
    })

    // New contact/quote form submission
    socket.on('contact:new', (data: { contact: any }) => {
      const c = data.contact
      const isQuote = c.type === 'quote'
      pushNotif({
        id: `contact-${c.id}-${Date.now()}`,
        type: 'contact',
        title: isQuote ? 'Yêu cầu báo giá mới' : 'Liên hệ mới',
        message: `${c.name} (${c.phone}) - ${c.content ? c.content.slice(0, 80) : c.email}`,
        url: '/contacts',
        read: false,
        createdAt: new Date().toISOString(),
      })
      toast.success(isQuote ? `📋 Yêu cầu báo giá từ ${c.name}` : `📩 Liên hệ mới từ ${c.name}`, { duration: 5000 })
      playNotificationSound()
    })

    // New guest chat conversation
    socket.on('chat:new-conversation', (data: { conversation: any }) => {
      const c = data.conversation
      pushNotif({
        id: `chat-${c.id}-${Date.now()}`,
        type: 'contact',
        title: 'Chat mới từ khách',
        message: `${c.guestName} (${c.guestPhone})${c.lastMessage ? ': ' + c.lastMessage.slice(0, 60) : ''}`,
        url: `/conversations`,
        read: false,
        createdAt: new Date().toISOString(),
      })
      toast.success(`💬 Chat mới từ ${c.guestName}`, { duration: 5000 })
      playNotificationSound()
    })

    // New guest chat message (in existing conversation)
    socket.on('chat:new-message', (data: { conversationId: string; guestName: string; message: string }) => {
      pushNotif({
        id: `chat-msg-${data.conversationId}-${Date.now()}`,
        type: 'contact',
        title: `Tin nhắn từ ${data.guestName}`,
        message: data.message.slice(0, 80),
        url: `/conversations`,
        read: false,
        createdAt: new Date().toISOString(),
      })
    })

    // Generic notification from backend
    socket.on('notification:new', (data: { notification: any }) => {
      const n = data.notification
      pushNotif({
        id: n.id || `notif-${Date.now()}`,
        type: 'system',
        title: n.title || 'Thông báo',
        message: n.message || '',
        url: n.url,
        read: false,
        createdAt: n.createdAt || new Date().toISOString(),
      })
    })

    // Initial unread count from backend
    socket.on('notification:count', () => {
      // Handled by local state from API fetch
    })

    socketRef.current = socket

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [user])

  // ── Actions ──

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      sortNotifications(prev.map((n) => (n.id === id ? { ...n, read: true } : n))),
    )
    // Only call API for DB notifications (UUID format), skip local socket-generated IDs
    const isDbId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    if (apiAvailable && isDbId) notificationsApi.markRead(id).catch(() => {})
  }, [apiAvailable])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => sortNotifications(prev.map((n) => ({ ...n, read: true }))))
    if (apiAvailable) notificationsApi.markAllRead().catch(() => {})
  }, [apiAvailable])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, hasMore, loadingMore, markAsRead, markAllAsRead, clearAll, loadMore }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationContext)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatMoney(amount: number | string): string {
  return Number(amount).toLocaleString('vi-VN') + '₫'
}

function playNotificationSound() {
  try {
    const audio = new Audio('/notification.mp3')
    audio.volume = 0.5
    audio.play().catch(() => {})
  } catch {
    // Audio not available
  }
}
