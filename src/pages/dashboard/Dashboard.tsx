import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/api/analytics.api'
import StatsCard from '@/components/ui/StatsCard'
import { PageLoader } from '@/components/ui/Spinner'
import { ShoppingBag, DollarSign, Users, TrendingUp, Package, AlertCircle } from 'lucide-react'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/context/ThemeContext'

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']

export default function Dashboard() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: analyticsApi.dashboard,
  })

  if (isLoading) return <PageLoader />

  const d = data?.data || {}
  const stats = [
    { title: 'Doanh thu hôm nay', value: formatCurrency(d.todayRevenue || 0), icon: <DollarSign size={22} />, iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400', change: d.revenueChange },
    { title: 'Đơn hàng hôm nay', value: d.todayOrders || 0, icon: <ShoppingBag size={22} />, iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400', change: d.ordersChange },
    { title: 'Khách hàng mới', value: d.newCustomers || 0, icon: <Users size={22} />, iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400', change: d.customersChange },
    { title: 'Sản phẩm', value: d.totalProducts || 0, icon: <Package size={22} />, iconBg: 'bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400' },
  ]

  const chartTextColor = isDark ? '#9ca3af' : '#6b7280'
  const chartGridColor = isDark ? '#1f2937' : '#f3f4f6'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Tổng quan hoạt động kinh doanh</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => <StatsCard key={s.title} {...s} />)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="xl:col-span-2 card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Doanh thu 30 ngày</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={d.revenueChart || []}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: chartTextColor }} tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth() + 1}`; }} />
              <YAxis tick={{ fontSize: 11, fill: chartTextColor }} tickFormatter={(v) => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}K` : String(v)} />
              <Tooltip
                formatter={(v: number) => formatCurrency(v)}
                labelFormatter={(l) => { const d = new Date(l); return `Ngày ${d.getDate()}/${d.getMonth() + 1}`; }}
                contentStyle={{
                  backgroundColor: isDark ? '#1f2937' : '#fff',
                  border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
                  borderRadius: '12px',
                  color: isDark ? '#f3f4f6' : '#111827',
                }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#revGrad)" name="Doanh thu" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Pie */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Trạng thái đơn hàng</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={d.orderStatusChart || []} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={false}>
                {(d.orderStatusChart || []).map((_: unknown, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v, n) => [v, getStatusLabel(n as string)]}
                contentStyle={{
                  backgroundColor: isDark ? '#1f2937' : '#fff',
                  border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
                  borderRadius: '12px',
                  color: isDark ? '#f3f4f6' : '#111827',
                }}
              />
              <Legend formatter={(v) => getStatusLabel(v)} iconSize={10} wrapperStyle={{ color: chartTextColor }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">Đơn hàng gần đây</h2>
            <button onClick={() => navigate('/orders')} className="text-primary-600 dark:text-primary-400 text-sm font-medium hover:underline">Xem tất cả</button>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {(d.recentOrders || []).slice(0, 5).map((o: any) => (
              <div key={o.id} onClick={() => navigate(`/orders/${o.id}`)}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">#{o.orderNumber}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDate(o.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(o.total)}</p>
                  <span className={`badge text-xs mt-1 ${getStatusColor(o.status)}`}>{getStatusLabel(o.status)}</span>
                </div>
              </div>
            ))}
            {!(d.recentOrders?.length) && (
              <div className="px-5 py-10 text-center text-gray-400 dark:text-gray-500 text-sm">Chưa có đơn hàng</div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">Sản phẩm bán chạy</h2>
            <button onClick={() => navigate('/products')} className="text-primary-600 dark:text-primary-400 text-sm font-medium hover:underline">Xem tất cả</button>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {(d.topProducts || []).slice(0, 5).map((p: any, i: number) => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3.5">
                <span className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400 flex-shrink-0">
                  {i + 1}
                </span>
                {p.image && <img src={p.image} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{p.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{p.soldCount} đã bán</p>
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white flex-shrink-0">{formatCurrency(p.revenue || 0)}</p>
              </div>
            ))}
            {!(d.topProducts?.length) && (
              <div className="px-5 py-10 text-center text-gray-400 dark:text-gray-500 text-sm">Chưa có dữ liệu</div>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {d.lowStockProducts?.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <AlertCircle size={18} className="text-orange-500" />
            </div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Cảnh báo tồn kho thấp</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {d.lowStockProducts.slice(0, 6).map((p: any) => (
              <div key={p.id} className="flex items-center gap-3 p-3.5 bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-100 dark:border-orange-900/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{p.name}</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Còn {p.stock} sản phẩm</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
