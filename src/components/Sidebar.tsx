import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Package, Tags, Award, ShoppingCart, CreditCard, Truck,
  Ticket, Zap, Image, Star, MessageSquare, Bell, Settings, BarChart2,
  ChevronDown, ChevronRight, X, Users, FileText, Contact, Bot,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const NAV = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  {
    label: 'Sản phẩm', icon: Package, children: [
      { path: '/products', label: 'Danh sách' },
      { path: '/categories', label: 'Danh mục' },
      { path: '/brands', label: 'Thương hiệu' },
      { path: '/inventory', label: 'Tồn kho' },
    ],
  },
  {
    label: 'Bán hàng', icon: ShoppingCart, children: [
      { path: '/orders', label: 'Đơn hàng' },
      { path: '/customers', label: 'Khách hàng' },
      { path: '/payments', label: 'Thanh toán' },
      { path: '/shipments', label: 'Vận chuyển' },
    ],
  },
  {
    label: 'Khuyến mãi', icon: Ticket, children: [
      { path: '/coupons', label: 'Mã giảm giá' },
      { path: '/flash-sales', label: 'Flash Sale' },
    ],
  },
  { path: '/news', label: 'Tin tức', icon: FileText },
  { path: '/banners', label: 'Banner', icon: Image },
  { path: '/reviews', label: 'Đánh giá', icon: Star },
  { path: '/contacts', label: 'Liên hệ', icon: Contact },
  { path: '/conversations', label: 'Hỗ trợ', icon: MessageSquare },
  { path: '/chatbot-history', label: 'Chatbot AI', icon: Bot },
  { path: '/notifications', label: 'Thông báo', icon: Bell },
  { path: '/analytics', label: 'Phân tích', icon: BarChart2 },
  { path: '/settings', label: 'Cài đặt', icon: Settings },
]

interface Props { open: boolean; onClose: () => void }

export default function Sidebar({ open, onClose }: Props) {
  const location = useLocation()
  const [expanded, setExpanded] = useState<string[]>(['Sản phẩm', 'Bán hàng'])

  const isActive = (path: string) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path))
  const toggle = (label: string) =>
    setExpanded((p) => p.includes(label) ? p.filter((x) => x !== label) : [...p, label])

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        'fixed top-0 left-0 h-full w-[270px] z-40 flex flex-col transition-transform duration-300 ease-out',
        'bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950',
        'dark:from-gray-950 dark:via-gray-950 dark:to-black',
        'border-r border-gray-800/50',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-2">
            <img src="/assets/logos/logo.png" alt="Halo" className="h-9 w-auto object-contain" />
            <div>
              <span className="font-bold text-[15px] text-white tracking-tight">Halo Admin</span>
              <p className="text-[10px] text-gray-500 font-medium -mt-0.5">Quản trị hệ thống</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {NAV.map((item) => {
            if (item.children) {
              const isOpen = expanded.includes(item.label)
              const hasActive = item.children.some((c) => isActive(c.path))
              return (
                <div key={item.label}>
                  <button onClick={() => toggle(item.label)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                      hasActive
                        ? 'bg-white/[0.08] text-white'
                        : 'text-gray-400 hover:bg-white/[0.05] hover:text-gray-200'
                    )}>
                    <item.icon size={18} className={hasActive ? 'text-primary-400' : ''} />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronDown size={14} className={cn(
                      'transition-transform duration-200',
                      isOpen ? '' : '-rotate-90'
                    )} />
                  </button>
                  <div className={cn(
                    'overflow-hidden transition-all duration-250 ease-out',
                    isOpen ? 'max-h-40 opacity-100 mt-0.5' : 'max-h-0 opacity-0'
                  )}>
                    <div className="ml-[30px] pl-3 border-l border-white/[0.06] space-y-0.5 py-0.5">
                      {item.children.map((c) => (
                        <NavLink key={c.path} to={c.path} onClick={onClose}
                          className={({ isActive: a }) => cn(
                            'block px-3 py-2 rounded-lg text-[13px] transition-all duration-200',
                            a
                              ? 'bg-primary-500/15 text-primary-400 font-semibold'
                              : 'text-gray-500 hover:bg-white/[0.05] hover:text-gray-300'
                          )}>
                          {c.label}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                </div>
              )
            }
            return (
              <NavLink key={item.path} to={item.path!} onClick={onClose}
                className={({ isActive: a }) => cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  a
                    ? 'bg-gradient-to-r from-primary-500/20 to-primary-500/10 text-white shadow-inner-glow'
                    : 'text-gray-400 hover:bg-white/[0.05] hover:text-gray-200'
                )}>
                {({ isActive: a }) => (
                  <>
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200',
                      a
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'text-gray-500'
                    )}>
                      <item.icon size={18} />
                    </div>
                    {item.label}
                    {a && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse-soft" />
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 px-2 py-2 text-gray-600 text-[11px]">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-soft" />
            Hệ thống hoạt động
          </div>
        </div>
      </aside>
    </>
  )
}
