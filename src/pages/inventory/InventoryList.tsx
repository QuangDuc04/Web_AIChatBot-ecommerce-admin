import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inventoryApi } from '@/api/inventory.api'
import { useForm } from 'react-hook-form'
import {
  Package, Search, ArrowUpCircle, ArrowDownCircle, AlertTriangle,
  History, Warehouse, PackagePlus, PackageMinus, Settings2,
} from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Spinner, { PageLoader } from '@/components/ui/Spinner'
import Pagination from '@/components/ui/Pagination'
import { useDebounce } from '@/hooks/useDebounce'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const STOCK_FILTERS = [
  { value: '', label: 'Tất cả' },
  { value: 'low', label: 'Sắp hết' },
  { value: 'out_of_stock', label: 'Hết hàng' },
]

const TX_TYPE_LABEL: Record<string, string> = {
  in: 'Nhập kho',
  out: 'Xuất kho',
  return: 'Hoàn trả',
  adjustment: 'Điều chỉnh',
}

const TX_TYPE_COLOR: Record<string, string> = {
  in: 'text-emerald-600 dark:text-emerald-400',
  out: 'text-red-500 dark:text-red-400',
  return: 'text-blue-600 dark:text-blue-400',
  adjustment: 'text-orange-500 dark:text-orange-400',
}

function StockBadge({ quantity, reserved }: { quantity: number; reserved: number }) {
  const available = quantity - reserved
  if (quantity === 0) return <span className="badge bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Hết hàng</span>
  if (quantity <= 10) return <span className="badge bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">Sắp hết ({available})</span>
  return <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Còn hàng ({available})</span>
}

export default function InventoryList() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [stockStatus, setStockStatus] = useState('')
  const dSearch = useDebounce(search, 400)

  // Modal state
  const [actionModal, setActionModal] = useState<{ type: 'restock' | 'adjust' | 'set'; item: any } | null>(null)
  const [historyModal, setHistoryModal] = useState<any>(null)
  const [historyPage, setHistoryPage] = useState(1)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  // Queries
  const { data, isLoading } = useQuery({
    queryKey: ['inventory', page, dSearch, stockStatus],
    queryFn: () => inventoryApi.list({ page, limit: 20, search: dSearch || undefined, stockStatus: stockStatus || undefined }),
  })

  const { data: statsData } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: inventoryApi.stats,
  })

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['inventory-history', historyModal?.id, historyPage],
    queryFn: () => inventoryApi.transactions(historyModal.id, { page: historyPage, limit: 10 }),
    enabled: !!historyModal,
  })

  const items: any[] = data?.data?.items || []
  const meta = data?.data || { total: 0, totalPages: 1 }
  const stats = statsData?.data || {}
  const txItems: any[] = historyData?.data?.items || []
  const txMeta = historyData?.data || { total: 0, totalPages: 1 }

  // Mutations
  const restockMut = useMutation({
    mutationFn: (d: any) => inventoryApi.restock(actionModal!.item.id, d),
    onSuccess: () => { toast.success('Nhập hàng thành công'); qc.invalidateQueries({ queryKey: ['inventory'] }); qc.invalidateQueries({ queryKey: ['inventory-stats'] }); closeAction() },
    onError: () => toast.error('Có lỗi xảy ra'),
  })

  const adjustMut = useMutation({
    mutationFn: (d: any) => inventoryApi.adjust(actionModal!.item.id, d),
    onSuccess: () => { toast.success('Điều chỉnh thành công'); qc.invalidateQueries({ queryKey: ['inventory'] }); qc.invalidateQueries({ queryKey: ['inventory-stats'] }); closeAction() },
    onError: () => toast.error('Có lỗi xảy ra'),
  })

  const setStockMut = useMutation({
    mutationFn: (d: any) => inventoryApi.updateStock(actionModal!.item.id, d),
    onSuccess: () => { toast.success('Cập nhật tồn kho thành công'); qc.invalidateQueries({ queryKey: ['inventory'] }); qc.invalidateQueries({ queryKey: ['inventory-stats'] }); closeAction() },
    onError: () => toast.error('Có lỗi xảy ra'),
  })

  const openAction = (type: 'restock' | 'adjust' | 'set', item: any) => {
    reset({})
    setActionModal({ type, item })
  }
  const closeAction = () => { setActionModal(null); reset({}) }

  const onSubmit = (d: any) => {
    if (!actionModal) return
    if (actionModal.type === 'restock') restockMut.mutate({ quantity: Number(d.quantity), reason: d.reason || 'Nhập hàng' })
    else if (actionModal.type === 'adjust') adjustMut.mutate({ adjustment: Number(d.adjustment), reason: d.reason })
    else setStockMut.mutate({ quantity: Number(d.quantity), reason: d.reason })
  }

  const isPending = restockMut.isPending || adjustMut.isPending || setStockMut.isPending

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Quản lý tồn kho</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Theo dõi và cập nhật số lượng hàng hóa</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Tổng sản phẩm', value: stats.totalProducts || 0, icon: <Package size={18} />, color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400' },
          { label: 'Tổng tồn kho', value: stats.totalStock || 0, icon: <Warehouse size={18} />, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400' },
          { label: 'Sắp hết hàng', value: stats.lowStock || 0, icon: <AlertTriangle size={18} />, color: 'bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400' },
          { label: 'Hết hàng', value: stats.outOfStock || 0, icon: <PackageMinus size={18} />, color: 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400' },
        ].map((s) => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>{s.icon}</div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-0 sm:min-w-48">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Tìm sản phẩm, SKU..." className="input pl-10 text-sm h-10" />
        </div>
        <select value={stockStatus} onChange={(e) => { setStockStatus(e.target.value); setPage(1) }}
          className="input w-full sm:w-auto h-10 text-sm">
          {STOCK_FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>SKU</th>
                <th className="text-right">Tồn kho</th>
                <th className="text-right">Đã đặt</th>
                <th className="text-right">Có sẵn</th>
                <th>Trạng thái</th>
                <th>Nhập gần nhất</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((inv: any) => (
                <tr key={inv.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      {inv.image ? (
                        <img src={inv.image} alt="" className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                          <Package size={16} className="text-gray-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">{inv.productName}</p>
                        {inv.variantName && <p className="text-xs text-gray-400 dark:text-gray-500">{inv.variantName}</p>}
                      </div>
                    </div>
                  </td>
                  <td><span className="text-sm text-gray-500 dark:text-gray-400 font-mono">{inv.sku || '—'}</span></td>
                  <td className="text-right font-semibold text-gray-900 dark:text-white">{inv.quantity}</td>
                  <td className="text-right text-gray-500 dark:text-gray-400">{inv.reservedQuantity}</td>
                  <td className="text-right font-semibold text-gray-900 dark:text-white">{inv.available}</td>
                  <td><StockBadge quantity={inv.quantity} reserved={inv.reservedQuantity} /></td>
                  <td className="text-sm text-gray-500 dark:text-gray-400">{inv.lastRestockedAt ? formatDate(inv.lastRestockedAt) : '—'}</td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => openAction('restock', inv)} title="Nhập hàng"
                        className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 transition-colors">
                        <PackagePlus size={15} />
                      </button>
                      <button onClick={() => openAction('adjust', inv)} title="Điều chỉnh"
                        className="p-1.5 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/30 text-orange-500 dark:text-orange-400 transition-colors">
                        <Settings2 size={15} />
                      </button>
                      <button onClick={() => { setHistoryModal(inv); setHistoryPage(1) }} title="Lịch sử"
                        className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400 transition-colors">
                        <History size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr><td colSpan={8} className="text-center py-16 text-gray-400 dark:text-gray-500">Chưa có dữ liệu tồn kho</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {meta.totalPages > 1 && (
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={20} onChange={setPage} />
      )}

      {/* Action Modal (Restock / Adjust / Set) */}
      <Modal
        open={!!actionModal}
        onClose={closeAction}
        title={
          actionModal?.type === 'restock' ? `Nhập hàng — ${actionModal.item?.productName}` :
          actionModal?.type === 'adjust' ? `Điều chỉnh — ${actionModal?.item?.productName}` :
          `Cập nhật tồn kho — ${actionModal?.item?.productName}`
        }
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={closeAction} disabled={isPending} className="btn-secondary">Hủy</button>
            <button form="inv-action-form" type="submit" disabled={isPending} className="btn-primary min-w-[80px]">
              {isPending ? <><Spinner className="w-4 h-4" /> Đang xử lý...</> : 'Xác nhận'}
            </button>
          </div>
        }
      >
        <form id="inv-action-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {actionModal && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Tồn kho hiện tại</span>
                <span className="font-bold text-gray-900 dark:text-white">{actionModal.item.quantity}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-500 dark:text-gray-400">Đang đặt trước</span>
                <span className="text-gray-700 dark:text-gray-300">{actionModal.item.reservedQuantity}</span>
              </div>
              {actionModal.item.variantName && (
                <div className="flex justify-between mt-1">
                  <span className="text-gray-500 dark:text-gray-400">Biến thể</span>
                  <span className="text-gray-700 dark:text-gray-300">{actionModal.item.variantName}</span>
                </div>
              )}
            </div>
          )}

          {actionModal?.type === 'restock' && (
            <div>
              <label className="label">Số lượng nhập thêm *</label>
              <input {...register('quantity', { required: 'Nhập số lượng', min: { value: 1, message: 'Tối thiểu 1' } })}
                type="number" min="1" className="input" placeholder="Số lượng" />
              {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity.message as string}</p>}
            </div>
          )}

          {actionModal?.type === 'adjust' && (
            <div>
              <label className="label">Số lượng điều chỉnh * <span className="text-gray-400 font-normal">(dương = thêm, âm = bớt)</span></label>
              <input {...register('adjustment', { required: 'Nhập số lượng', validate: (v: string) => Number(v) !== 0 || 'Không được bằng 0' })}
                type="number" className="input" placeholder="Ví dụ: 5 hoặc -3" />
              {errors.adjustment && <p className="text-red-500 text-xs mt-1">{errors.adjustment.message as string}</p>}
            </div>
          )}

          {actionModal?.type === 'set' && (
            <div>
              <label className="label">Số lượng mới *</label>
              <input {...register('quantity', { required: 'Nhập số lượng', min: { value: 0, message: 'Không được âm' } })}
                type="number" min="0" className="input" placeholder="Số lượng tồn kho mới" />
              {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity.message as string}</p>}
            </div>
          )}

          <div>
            <label className="label">Lý do {actionModal?.type !== 'restock' ? '*' : ''}</label>
            <textarea {...register('reason', actionModal?.type !== 'restock' ? { required: 'Nhập lý do' } : {})}
              className="input resize-none" rows={2} placeholder="Lý do thay đổi..." />
            {errors.reason && <p className="text-red-500 text-xs mt-1">{errors.reason.message as string}</p>}
          </div>
        </form>
      </Modal>

      {/* History Modal */}
      <Modal open={!!historyModal} onClose={() => setHistoryModal(null)} title={`Lịch sử — ${historyModal?.productName || ''}`} size="lg">
        {historyLoading ? (
          <div className="py-12 flex justify-center"><Spinner className="w-6 h-6" /></div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Loại</th>
                    <th className="text-right">SL</th>
                    <th className="text-right">Trước</th>
                    <th className="text-right">Sau</th>
                    <th>Lý do</th>
                    <th>Người thực hiện</th>
                  </tr>
                </thead>
                <tbody>
                  {txItems.map((tx: any) => (
                    <tr key={tx.id}>
                      <td className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(tx.createdAt)}</td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          {tx.type === 'in' ? <ArrowDownCircle size={14} className="text-emerald-500" /> :
                           tx.type === 'out' ? <ArrowUpCircle size={14} className="text-red-500" /> :
                           <Settings2 size={14} className="text-orange-500" />}
                          <span className={`text-sm font-medium ${TX_TYPE_COLOR[tx.type] || ''}`}>
                            {TX_TYPE_LABEL[tx.type] || tx.type}
                          </span>
                        </div>
                      </td>
                      <td className="text-right font-semibold">{tx.type === 'in' || tx.type === 'return' ? '+' : '-'}{tx.quantity}</td>
                      <td className="text-right text-gray-500 dark:text-gray-400">{tx.beforeQuantity}</td>
                      <td className="text-right font-semibold text-gray-900 dark:text-white">{tx.afterQuantity}</td>
                      <td className="text-sm text-gray-500 dark:text-gray-400 max-w-[200px] truncate">{tx.reason || '—'}</td>
                      <td className="text-sm text-gray-500 dark:text-gray-400">{tx.createdBy || 'Hệ thống'}</td>
                    </tr>
                  ))}
                  {!txItems.length && (
                    <tr><td colSpan={7} className="text-center py-10 text-gray-400 dark:text-gray-500">Chưa có lịch sử</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {txMeta.totalPages > 1 && (
              <div className="mt-4">
                <Pagination page={historyPage} totalPages={txMeta.totalPages} total={txMeta.total} limit={10} onChange={setHistoryPage} />
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  )
}
