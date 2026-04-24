import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { shipmentsApi } from '@/api/shipments.api'
import { ordersApi } from '@/api/orders.api'
import { Search, Plus, CheckCircle, XCircle } from 'lucide-react'
import { PageLoader } from '@/components/ui/Spinner'
import Spinner from '@/components/ui/Spinner'
import Pagination from '@/components/ui/Pagination'
import Modal from '@/components/ui/Modal'
import { formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useDebounce } from '@/hooks/useDebounce'

export default function ShipmentList() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [createModal, setCreateModal] = useState(false)
  const [updateModal, setUpdateModal] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState<any>(null)
  const [form, setForm] = useState({ orderId: '', carrier: '', trackingNumber: '', estimatedDeliveryAt: '' })
  const [updateNote, setUpdateNote] = useState('')
  const [updateStatus, setUpdateStatus] = useState('in_transit')
  const [updateLocation, setUpdateLocation] = useState('')
  const dSearch = useDebounce(search, 400)

  const { data: ordersData } = useQuery({ queryKey: ['orders-all'], queryFn: () => ordersApi.list({ limit: 100, status: 'confirmed' }) })

  const { data, isLoading } = useQuery({
    queryKey: ['shipments', page, dSearch],
    queryFn: () => shipmentsApi.list({ page, limit: 20, search: dSearch || undefined }),
  })

  const createMut = useMutation({
    mutationFn: () => shipmentsApi.create(form),
    onSuccess: () => { toast.success('Đã tạo vận đơn'); qc.invalidateQueries({ queryKey: ['shipments'] }); setCreateModal(false) },
  })
  const deliverMut = useMutation({
    mutationFn: (id: string) => shipmentsApi.markDelivered(id),
    onSuccess: () => { toast.success('Đã đánh dấu giao thành công'); qc.invalidateQueries({ queryKey: ['shipments'] }) },
  })
  const failMut = useMutation({
    mutationFn: (id: string) => shipmentsApi.markFailed(id, {}),
    onSuccess: () => { toast.success('Đã đánh dấu thất bại'); qc.invalidateQueries({ queryKey: ['shipments'] }) },
  })
  const addUpdateMut = useMutation({
    mutationFn: () => shipmentsApi.addUpdate({ shipmentId: selectedShipment.id, status: updateStatus, location: updateLocation, note: updateNote }),
    onSuccess: () => { toast.success('Đã thêm cập nhật vận chuyển'); qc.invalidateQueries({ queryKey: ['shipments'] }); setUpdateModal(false) },
  })

  const shipments: any[] = data?.data?.items || []
  const meta = data?.data || { total: 0, totalPages: 1 }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Vận chuyển</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{meta.total || 0} vận đơn</p>
        </div>
        <button onClick={() => setCreateModal(true)} className="btn-primary"><Plus size={16} /> Tạo vận đơn</button>
      </div>

      <div className="card p-5">
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Tìm vận đơn..." className="input pl-9 text-sm h-9" />
        </div>
      </div>

      {isLoading ? <PageLoader /> : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead><tr><th>Mã vận đơn</th><th>Đơn hàng</th><th>Nhà vận chuyển</th><th>Mã tracking</th><th>Trạng thái</th><th>Dự kiến giao</th><th>Cập nhật</th><th></th></tr></thead>
              <tbody>
                {shipments.map((s: any) => (
                  <tr key={s.id}>
                    <td className="font-mono text-xs text-gray-500 dark:text-gray-400">{s.id.slice(0, 8)}...</td>
                    <td><span className="font-mono text-primary-600 dark:text-primary-400">#{s.order?.orderNumber}</span></td>
                    <td className="text-gray-700 dark:text-gray-300">{s.carrier || '—'}</td>
                    <td className="font-mono text-xs">{s.trackingNumber || '—'}</td>
                    <td><span className={`badge ${getStatusColor(s.status)}`}>{getStatusLabel(s.status)}</span></td>
                    <td className="text-gray-400 dark:text-gray-500 text-xs">{(s.estimatedDeliveryAt || s.estimatedDelivery) ? formatDate(s.estimatedDeliveryAt || s.estimatedDelivery, 'dd/MM/yyyy') : '—'}</td>
                    <td className="text-gray-400 dark:text-gray-500 text-xs">{formatDate(s.updatedAt)}</td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => { setSelectedShipment(s); setUpdateModal(true) }} className="btn-secondary btn-sm">+ Cập nhật</button>
                        {s.status !== 'delivered' && s.status !== 'failed' && (
                          <>
                            <button onClick={() => deliverMut.mutate(s.id)} disabled={deliverMut.isPending} className="p-1.5 rounded-xl hover:bg-green-50 dark:hover:bg-green-950/30 text-green-600 dark:text-green-400 transition-colors" title="Giao thành công">
                              <CheckCircle size={15} />
                            </button>
                            <button onClick={() => failMut.mutate(s.id)} disabled={failMut.isPending} className="p-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 dark:text-red-400 transition-colors" title="Giao thất bại">
                              <XCircle size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!shipments.length && (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-gray-400 dark:text-gray-500 animate-fade-in">
                      Chưa có vận đơn
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-5"><Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={20} onChange={setPage} /></div>
        </div>
      )}

      {/* Create Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Tạo vận đơn mới" size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setCreateModal(false)} className="btn-secondary">Hủy</button>
            <button onClick={() => createMut.mutate()} disabled={createMut.isPending} className="btn-primary">
              {createMut.isPending ? <Spinner className="w-4 h-4" /> : 'Tạo vận đơn'}
            </button>
          </div>
        }>
        <div className="space-y-4">
          <div>
            <label className="label">Đơn hàng</label>
            <select value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })} className="input">
              <option value="">Chọn đơn hàng</option>
              {(ordersData?.data?.items || []).map((o: any) => (
                <option key={o.id} value={o.id}>#{o.orderNumber} - {o.customer?.firstName} {o.customer?.lastName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Nhà vận chuyển</label>
            <input value={form.carrier} onChange={(e) => setForm({ ...form, carrier: e.target.value })} className="input" placeholder="GHN, GHTK, Viettel Post..." />
          </div>
          <div>
            <label className="label">Mã tracking</label>
            <input value={form.trackingNumber} onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })} className="input" placeholder="Mã vận đơn" />
          </div>
          <div>
            <label className="label">Ngày giao dự kiến</label>
            <input value={form.estimatedDeliveryAt} onChange={(e) => setForm({ ...form, estimatedDeliveryAt: e.target.value })} type="date" className="input" />
          </div>
        </div>
      </Modal>

      {/* Add Update Modal */}
      <Modal open={updateModal} onClose={() => setUpdateModal(false)} title="Thêm cập nhật vận chuyển" size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setUpdateModal(false)} className="btn-secondary">Hủy</button>
            <button onClick={() => addUpdateMut.mutate()} disabled={addUpdateMut.isPending} className="btn-primary">
              {addUpdateMut.isPending ? <Spinner className="w-4 h-4" /> : 'Lưu'}
            </button>
          </div>
        }>
        <div className="space-y-4">
          <div>
            <label className="label">Trạng thái</label>
            <select value={updateStatus} onChange={(e) => setUpdateStatus(e.target.value)} className="input">
              <option value="in_transit">Đang vận chuyển</option>
              <option value="out_for_delivery">Đang giao hàng</option>
              <option value="delivered">Đã giao</option>
              <option value="failed">Thất bại</option>
            </select>
          </div>
          <div>
            <label className="label">Vị trí</label>
            <input value={updateLocation} onChange={(e) => setUpdateLocation(e.target.value)} className="input" placeholder="Bưu cục / Khu vực..." />
          </div>
          <div>
            <label className="label">Ghi chú</label>
            <textarea value={updateNote} onChange={(e) => setUpdateNote(e.target.value)} className="input resize-none" rows={3} placeholder="Nội dung cập nhật..." />
          </div>
        </div>
      </Modal>
    </div>
  )
}
