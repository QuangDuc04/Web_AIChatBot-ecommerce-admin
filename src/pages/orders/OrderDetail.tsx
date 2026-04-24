import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi } from '@/api/orders.api'
import { ArrowLeft, Package, MapPin, CreditCard, Truck } from 'lucide-react'
import { PageLoader } from '@/components/ui/Spinner'
import Spinner from '@/components/ui/Spinner'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'
import toast from 'react-hot-toast'
import Modal from '@/components/ui/Modal'

const STATUSES = ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled', 'refunded']

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [statusModal, setStatusModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [note, setNote] = useState('')

  const { data, isLoading } = useQuery({ queryKey: ['order', id], queryFn: () => ordersApi.get(id!) })

  const updateMut = useMutation({
    mutationFn: () => ordersApi.updateStatus(id!, { status: newStatus, note }),
    onSuccess: () => { toast.success('Đã cập nhật trạng thái'); qc.invalidateQueries({ queryKey: ['order', id] }); setStatusModal(false) },
    onError: (err: any) => { toast.error(err?.response?.data?.message || err?.message || 'Không thể cập nhật trạng thái') },
  })

  if (isLoading) return <PageLoader />
  const o = data?.data
  if (!o) return null

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/orders')} className="btn-ghost p-2"><ArrowLeft size={20} /></button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Đơn hàng #{o.orderNumber}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{formatDate(o.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`badge text-sm px-3 py-1.5 ${getStatusColor(o.status)}`}>{getStatusLabel(o.status)}</span>
          <button onClick={() => { setNewStatus(o.status); setNote(''); setStatusModal(true) }} className="btn-primary">
            Cập nhật trạng thái
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="md:col-span-2 lg:col-span-2 space-y-4">
          <div className="card">
            <div className="flex items-center gap-2.5 p-5 border-b border-gray-100 dark:border-gray-800">
              <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/50 flex items-center justify-center">
                <Package size={16} className="text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Sản phẩm đặt hàng</h2>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {(o.items || []).map((item: any) => (
                <div key={item.id} className="flex items-center gap-3 p-5">
                  {item.product?.primaryImage && (
                    <img src={item.product.primaryImage} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{item.product?.name}</p>
                    {item.variant && <p className="text-xs text-gray-400 dark:text-gray-500">{Object.entries(item.variant.options || {}).map(([k, v]) => `${k}: ${v}`).join(', ')}</p>}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">x{item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(item.price)}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{formatCurrency(Number(item.price) * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status History */}
          {o.statusHistory?.length > 0 && (
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Lịch sử trạng thái</h2>
              <div className="space-y-4">
                {o.statusHistory.map((h: any, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0 ring-4 ring-primary-100 dark:ring-primary-950/30" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`badge text-xs ${getStatusColor(h.status)}`}>{getStatusLabel(h.status)}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(h.createdAt)}</span>
                      </div>
                      {h.note && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{h.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Summary */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Tổng kết</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Tạm tính</span><span>{formatCurrency(o.subtotal)}</span></div>
              {o.shippingFee > 0 && <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Phí vận chuyển</span><span>{formatCurrency(o.shippingFee)}</span></div>}
              {o.discount > 0 && <div className="flex justify-between text-emerald-600 dark:text-emerald-400"><span>Giảm giá</span><span>-{formatCurrency(o.discount)}</span></div>}
              {o.tax > 0 && <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Thuế</span><span>{formatCurrency(o.tax)}</span></div>}
              <div className="flex justify-between font-bold text-gray-900 dark:text-white pt-3 border-t border-gray-100 dark:border-gray-800 text-base">
                <span>Tổng cộng</span><span>{formatCurrency(o.total)}</span>
              </div>
            </div>
          </div>

          {/* Customer */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Khách hàng</h2>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {o.guestName || o.customer?.name || `${o.customer?.firstName || ''} ${o.customer?.lastName || ''}`.trim() || '—'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{o.guestEmail || o.customer?.email}</p>
            {(o.guestPhone || o.customer?.phone) && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{o.guestPhone || o.customer?.phone}</p>
            )}
          </div>

          {/* Shipping Address */}
          {(o.shippingAddress || o.guestAddress) && (
            <div className="card p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center">
                  <MapPin size={14} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="font-semibold text-gray-900 dark:text-white">Địa chỉ giao hàng</h2>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-0.5">
                {o.shippingAddress ? (
                  <>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{o.shippingAddress.fullName}</p>
                    <p>{o.shippingAddress.phone}</p>
                    <p>{o.shippingAddress.addressLine1}</p>
                    {o.shippingAddress.addressLine2 && <p>{o.shippingAddress.addressLine2}</p>}
                    <p>{o.shippingAddress.ward}, {o.shippingAddress.district}, {o.shippingAddress.city}</p>
                  </>
                ) : o.guestAddress ? (
                  <>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{o.guestName}</p>
                    <p>{o.guestPhone}</p>
                    <p>{o.guestAddress.street}</p>
                    <p>{o.guestAddress.ward}{o.guestAddress.ward ? ', ' : ''}{o.guestAddress.district}, {o.guestAddress.city}</p>
                  </>
                ) : null}
              </div>
            </div>
          )}

          {/* Payment */}
          <div className="card p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center">
                <CreditCard size={14} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Thanh toán</h2>
            </div>
            <div className="text-sm space-y-1.5">
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Phương thức</span><span className="font-medium text-gray-900 dark:text-gray-100">{getStatusLabel(o.paymentMethod)}</span></div>
              {o.payment && <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Trạng thái</span><span className={`badge ${getStatusColor(o.payment.status)}`}>{getStatusLabel(o.payment.status)}</span></div>}
            </div>
          </div>

          {/* Coupon */}
          {o.couponCode && (
            <div className="card p-5">
              <p className="text-sm text-gray-500 dark:text-gray-400">Mã giảm giá: <span className="font-mono font-bold text-primary-600 dark:text-primary-400">{o.couponCode}</span></p>
            </div>
          )}
        </div>
      </div>

      {/* Update Status Modal */}
      <Modal open={statusModal} onClose={() => setStatusModal(false)} title="Cập nhật trạng thái đơn hàng" size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setStatusModal(false)} className="btn-secondary">Hủy</button>
            <button onClick={() => updateMut.mutate()} disabled={updateMut.isPending} className="btn-primary">
              {updateMut.isPending ? <Spinner className="w-4 h-4" /> : 'Cập nhật'}
            </button>
          </div>
        }>
        <div className="space-y-4">
          <div>
            <label className="label">Trạng thái mới</label>
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="input">
              {STATUSES.map((s) => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Ghi chú</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} className="input resize-none" rows={3} placeholder="Ghi chú..." />
          </div>
        </div>
      </Modal>
    </div>
  )
}
