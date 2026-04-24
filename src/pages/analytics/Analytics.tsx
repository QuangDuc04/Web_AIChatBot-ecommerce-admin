import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/api/analytics.api'
import { PageLoader } from '@/components/ui/Spinner'
import { formatCurrency } from '@/lib/utils'
import { useTheme } from '@/context/ThemeContext'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xử lý',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
  refunded: 'Hoàn tiền',
}

const PERIODS = [
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
  { value: '90d', label: '3 tháng' },
  { value: '1y', label: '1 năm' },
]

export default function Analytics() {
  const [period, setPeriod] = useState('30d')
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const { data: revenueData, isLoading: lr } = useQuery({ queryKey: ['analytics-revenue', period], queryFn: () => analyticsApi.revenue({ period }) })
  const { data: productData, isLoading: lp } = useQuery({ queryKey: ['analytics-products', period], queryFn: () => analyticsApi.products({ period }) })
  const { data: customerData, isLoading: lc } = useQuery({ queryKey: ['analytics-customers', period], queryFn: () => analyticsApi.customers({ period }) })
  const { data: orderData, isLoading: lo } = useQuery({ queryKey: ['analytics-orders', period], queryFn: () => analyticsApi.orders({ period }) })

  const rev = revenueData?.data || {}
  const prod = productData?.data || {}
  const cust = customerData?.data || {}
  const ord = orderData?.data || {}

  const chartText = isDark ? '#9ca3af' : '#6b7280'
  const chartGrid = isDark ? '#1f2937' : '#f3f4f6'
  const tooltipStyle = { backgroundColor: isDark ? '#1f2937' : '#fff', border: isDark ? '1px solid #374151' : '1px solid #e5e7eb', borderRadius: '12px', color: isDark ? '#f3f4f6' : '#111827' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Phân tích & Báo cáo</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Theo dõi hiệu suất kinh doanh</p>
        </div>
        <div className="flex gap-0.5 sm:gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-x-auto flex-shrink-0">
          {PERIODS.map((p) => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap min-h-[36px] ${period === p.value ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Revenue */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Doanh thu</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          {[
            { label: 'Tổng doanh thu', value: formatCurrency(rev.totalRevenue || 0) },
            { label: 'Doanh thu TB/ngày', value: formatCurrency(rev.avgDailyRevenue || 0) },
            { label: 'Đơn hàng hoàn thành', value: rev.completedOrders || 0 },
            { label: 'Giá trị đơn TB', value: formatCurrency(rev.avgOrderValue || 0) },
          ].map((s) => (
            <div key={s.label} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{s.value}</p>
            </div>
          ))}
        </div>
        {lr ? <div className="h-56 flex items-center justify-center"><PageLoader /></div> : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={rev.chart || []}>
              <defs>
                <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: chartText }} tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth() + 1}`; }} />
              <YAxis tick={{ fontSize: 11, fill: chartText }} tickFormatter={(v) => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}K` : String(v)} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#revG)" name="Doanh thu" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Đơn hàng theo trạng thái</h2>
          {lo ? <div className="h-48 flex items-center justify-center"><PageLoader /></div> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ord.statusBreakdown || []}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                <XAxis dataKey="status" tick={{ fontSize: 10, fill: chartText }} tickFormatter={(v) => STATUS_LABELS[v] || v} />
                <YAxis tick={{ fontSize: 11, fill: chartText }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} name="Số đơn" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Khách hàng mới</h2>
          {lc ? <div className="h-48 flex items-center justify-center"><PageLoader /></div> : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={cust.chart || []}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: chartText }} tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth() + 1}`; }} />
                <YAxis tick={{ fontSize: 11, fill: chartText }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2.5} dot={false} name="Khách mới" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Top sản phẩm bán chạy</h2>
        {lp ? <PageLoader /> : (
          <div className="table-container">
            <table>
              <thead><tr><th>#</th><th>Sản phẩm</th><th>Đã bán</th><th>Doanh thu</th><th>Lượt xem</th></tr></thead>
              <tbody>
                {(prod.topProducts || []).map((p: any, i: number) => (
                  <tr key={p.id}>
                    <td className="font-bold text-gray-400 dark:text-gray-500 w-8">{i + 1}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        {p.image && <img src={p.image} alt="" className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />}
                        <p className="font-medium text-gray-900 dark:text-gray-100">{p.name}</p>
                      </div>
                    </td>
                    <td className="font-semibold text-gray-900 dark:text-white">{p.soldCount}</td>
                    <td className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(p.revenue)}</td>
                    <td className="text-gray-500 dark:text-gray-400">{p.viewCount}</td>
                  </tr>
                ))}
                {!(prod.topProducts?.length) && <tr><td colSpan={5} className="text-center py-12 text-gray-400 dark:text-gray-500 animate-fade-in">Chưa có dữ liệu</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
