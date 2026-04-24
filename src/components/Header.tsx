import { Menu, Bell, LogOut, User, ChevronDown, Sun, Moon, ShoppingCart, Package, AlertTriangle, Info, Check, CheckCheck, Trash2, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useNotifications, type AdminNotification } from '@/context/NotificationContext'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface Props { onMenuClick: () => void }

// ---------------------------------------------------------------------------
// Notification type → icon + color
// ---------------------------------------------------------------------------

const NOTIF_STYLE: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  order_new: { icon: ShoppingCart, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
  order_update: { icon: Package, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  stock_low: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  contact: { icon: Info, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  system: { icon: Info, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-800' },
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Vừa xong'
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  return `${Math.floor(hours / 24)} ngày trước`
}

// ---------------------------------------------------------------------------
// Main Header
// ---------------------------------------------------------------------------

export default function Header({ onMenuClick }: Props) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { notifications, unreadCount, hasMore, loadingMore, markAsRead, markAllAsRead, clearAll, loadMore } = useNotifications()
  const [userOpen, setUserOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const userRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false)
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleNotifClick = (notif: AdminNotification) => {
    markAsRead(notif.id)
    if (notif.url) {
      navigate(notif.url)
      setBellOpen(false)
    }
  }

  return (
    <header className={cn(
      'h-16 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20',
      'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl',
      'border-b border-gray-200/60 dark:border-gray-800/60',
    )}>
      {/* Left side */}
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick}
          className="lg:hidden p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
          <Menu size={20} className="text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            'relative p-2.5 rounded-xl transition-all duration-300',
            'hover:bg-gray-100 dark:hover:bg-gray-800',
          )}
        >
          <div className="relative w-5 h-5">
            <Sun size={20} className={cn(
              'absolute inset-0 text-amber-500 transition-all duration-300',
              theme === 'light' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'
            )} />
            <Moon size={20} className={cn(
              'absolute inset-0 text-primary-400 transition-all duration-300',
              theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
            )} />
          </div>
        </button>

        {/* ── Notification bell ── */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => setBellOpen((v) => !v)}
            className={cn(
              'relative p-2.5 rounded-xl transition-all duration-200',
              'hover:bg-gray-100 dark:hover:bg-gray-800',
              bellOpen && 'bg-gray-100 dark:bg-gray-800',
            )}
          >
            <Bell size={20} className={cn(
              'transition-colors',
              unreadCount > 0 ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400',
            )} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full ring-2 ring-white dark:ring-gray-900 px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {bellOpen && (
            <div className={cn(
              'absolute right-0 top-full mt-2 w-[380px]',
              'bg-white dark:bg-gray-900 rounded-2xl shadow-float',
              'border border-gray-200/80 dark:border-gray-800',
              'z-50 animate-fade-in-down overflow-hidden',
            )}>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Thông báo</h3>
                  {unreadCount > 0 && (
                    <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[11px] font-bold px-1.5 py-0.5 rounded-full">
                      {unreadCount} mới
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      title="Đánh dấu tất cả đã đọc"
                    >
                      <CheckCheck size={14} className="text-gray-400" />
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      title="Xóa tất cả"
                    >
                      <Trash2 size={14} className="text-gray-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* Notification list */}
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center">
                    <Bell size={32} className="mx-auto text-gray-300 dark:text-gray-700 mb-2" />
                    <p className="text-sm text-gray-400 dark:text-gray-600">Chưa có thông báo</p>
                  </div>
                ) : (
                  <>
                    {notifications.map((notif) => {
                      const style = NOTIF_STYLE[notif.type] || NOTIF_STYLE.system
                      const Icon = style.icon
                      return (
                        <button
                          key={notif.id}
                          onClick={() => handleNotifClick(notif)}
                          className={cn(
                            'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors',
                            'hover:bg-gray-50 dark:hover:bg-gray-800/50',
                            !notif.read && 'bg-primary-50/30 dark:bg-primary-950/10',
                          )}
                        >
                          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5', style.bg)}>
                            <Icon size={16} className={style.color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={cn(
                                'text-[13px] leading-tight',
                                notif.read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white font-semibold',
                              )}>
                                {notif.title}
                              </p>
                              {!notif.read && (
                                <span className="w-2 h-2 bg-primary-500 rounded-full shrink-0" />
                              )}
                            </div>
                            <p className="text-[12px] text-gray-500 dark:text-gray-500 mt-0.5 line-clamp-2">
                              {notif.message}
                            </p>
                            <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-1">
                              {timeAgo(notif.createdAt)}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                    {hasMore && (
                      <button
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="w-full py-3 text-center text-[13px] font-medium text-primary-600 dark:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-t border-gray-100 dark:border-gray-800 flex items-center justify-center gap-2"
                      >
                        {loadingMore ? (
                          <><Loader2 size={14} className="animate-spin" /> Đang tải...</>
                        ) : (
                          'Xem thêm'
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── User dropdown ── */}
        <div className="relative" ref={userRef}>
          <button onClick={() => setUserOpen(!userOpen)}
            className={cn(
              'flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-xl transition-all duration-200',
              'hover:bg-gray-100 dark:hover:bg-gray-800',
              userOpen && 'bg-gray-100 dark:bg-gray-800'
            )}>
            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
              {user?.avatar
                ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                : <User size={15} className="text-white" />}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 capitalize font-medium">{user?.role}</p>
            </div>
            <ChevronDown size={14} className={cn(
              'text-gray-400 transition-transform duration-200',
              userOpen && 'rotate-180'
            )} />
          </button>

          {userOpen && (
            <div className={cn(
              'absolute right-0 top-full mt-2 w-52',
              'bg-white dark:bg-gray-900 rounded-2xl shadow-float',
              'border border-gray-200/80 dark:border-gray-800',
              'py-1.5 z-50 animate-fade-in-down'
            )}>
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{user?.email}</p>
              </div>
              <div className="py-1.5">
                <button
                  onClick={handleLogout}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                    'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
                  )}>
                  <LogOut size={16} />
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
