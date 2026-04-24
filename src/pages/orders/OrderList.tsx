import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi } from '@/api/orders.api'
import { useNavigate } from 'react-router-dom'
import { Search, Eye, CheckSquare } from 'lucide-react'
import { PageLoader } from '@/components/ui/Spinner'
import Pagination from '@/components/ui/Pagination'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'
import { useDebounce } from '@/hooks/useDebounce'
import Modal from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'
import toast from 'react-hot-toast'

const STATUSES = ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled', 'refunded']

export default function OrderList() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [bulkModal, setBulkModal] = useState(false)
  const [bulkStatus, setBulkStatus] = useState('confirmed')
  const dSearch = useDebounce(search, 400)

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, dSearch, status],
    queryFn: () => ordersApi.list({ page, limit: 20, search: dSearch || undefined, status: status || undefined }),
  })

  const bulkMut = useMutation({
    mutationFn: () => ordersApi.bulkUpdateStatus({ orderIds: selected, status: bulkStatus }),
    onSuccess: (res: any) => {
      const results: any[] = res?.data || res || []
      const succeeded = results.filter((r: any) => r.success)
      const failed = results.filter((r: any) => !r.success)
      if (succeeded.length > 0) toast.success(`Đã cập nhật ${succeeded.length} đơn hàng`)
      if (failed.length > 0) {
        const errMsg = failed[0]?.error || 'Trạng thái không hợp lệ'
        toast.error(`${failed.length} đơn thất bại: ${errMsg}`)
      }
      qc.invalidateQueries({ queryKey: ['orders'] }); setSelected([]); setBulkModal(false)
    },
  })

  const orders: any[] = data?.data?.items || []
  const meta = data?.data || { total: 0, totalPages: 1 }
  const allSelected = orders.length > 0 && orders.every((o) => selected.includes(o.id))
  const toggleAll = () => setAllSelected(!allSelected ? orders.map((o) => o.id) : [])
  function setAllSelected(ids: string[]) { setSelected(ids) }
  const toggle = (id: string) => setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Đơn hàng</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{meta.total || 0} đơn hàng</p>
        </div>
        {selected.length > 0 && (
          <button onClick={() => setBulkModal(true)} className="btn-primary animate-fade-in">
            <CheckSquare size={16} /> Cập nhật {selected.length} đơn
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-0 sm:min-w-48">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Tìm theo mã đơn, tên khách..." className="input pl-10 text-sm h-10" />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="input w-full sm:w-auto h-10 text-sm">
          <option value="">Tất cả trạng thái</option>
          {STATUSES.map((s) => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
        </select>
      </div>

      {isLoading ? <PageLoader /> : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th><input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4 rounded border-gray-300 dark:border-gray-600" /></th>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Sản phẩm</th>
                  <th>Tổng tiền</th>
                  <th>Thanh toán</th>
                  <th>Trạng thái</th>
                  <th>Ngày đặt</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o: any) => (
                  <tr key={o.id}>
                    <td><input type="checkbox" checked={selected.includes(o.id)} onChange={() => toggle(o.id)} className="w-4 h-4 rounded border-gray-300 dark:border-gray-600" /></td>
                    <td><span className="font-mono font-semibold text-primary-600 dark:text-primary-400">#{o.orderNumber}</span></td>
                    <td>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{o.customer?.firstName} {o.customer?.lastName}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{o.customer?.email}</p>
                      </div>
                    </td>
                    <td className="text-gray-500 dark:text-gray-400 text-sm">{o.itemCount || o.items?.length || 0} sản phẩm</td>
                    <td className="font-bold text-gray-900 dark:text-white">{formatCurrency(o.total)}</td>
                    <td><span className={`badge ${getStatusColor(o.paymentMethod)}`}>{getStatusLabel(o.paymentMethod)}</span></td>
                    <td><span className={`badge ${getStatusColor(o.status)}`}>{getStatusLabel(o.status)}</span></td>
                    <td className="text-gray-400 dark:text-gray-500 text-xs">{formatDate(o.createdAt)}</td>
                    <td>
                      <button onClick={() => navigate(`/orders/${o.id}`)}
                        className="p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400 transition-colors">
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!orders.length && <tr><td colSpan={9} className="text-center py-12 text-gray-400 dark:text-gray-500">Không có đơn hàng</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="p-4">
            <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={20} onChange={setPage} />
          </div>
        </div>
      )}

      <Modal open={bulkModal} onClose={() => setBulkModal(false)} title={`Cập nhật ${selected.length} đơn hàng`} size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setBulkModal(false)} className="btn-secondary">Hủy</button>
            <button onClick={() => bulkMut.mutate()} disabled={bulkMut.isPending} className="btn-primary">
              {bulkMut.isPending ? <Spinner className="w-4 h-4" /> : 'Cập nhật'}
            </button>
          </div>
        }>
        <div>
          <label className="label">Chuyển sang trạng thái</label>
          <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} className="input">
            {STATUSES.map((s) => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
          </select>
        </div>
      </Modal>
    </div>
  )
}
