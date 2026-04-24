import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentsApi } from '@/api/payments.api'
import { Search, Eye } from 'lucide-react'
import { PageLoader } from '@/components/ui/Spinner'
import Spinner from '@/components/ui/Spinner'
import Pagination from '@/components/ui/Pagination'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import { useDebounce } from '@/hooks/useDebounce'

export default function PaymentList() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [method, setMethod] = useState('')
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [refundModal, setRefundModal] = useState(false)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const dSearch = useDebounce(search, 400)

  const { data, isLoading } = useQuery({
    queryKey: ['payments', page, dSearch, status, method],
    queryFn: () => paymentsApi.list({ page, limit: 20, search: dSearch || undefined, status: status || undefined, method: method || undefined }),
  })

  const codMut = useMutation({
    mutationFn: (orderId: string) => paymentsApi.confirmCOD(orderId),
    onSuccess: () => { toast.success('Đã xác nhận thanh toán COD'); qc.invalidateQueries({ queryKey: ['payments'] }) },
  })
  const refundMut = useMutation({
    mutationFn: () => paymentsApi.refund(selectedPayment.id, { amount: refundAmount ? Number(refundAmount) : undefined, reason: refundReason }),
    onSuccess: () => { toast.success('Đã xử lý hoàn tiền'); qc.invalidateQueries({ queryKey: ['payments'] }); setRefundModal(false) },
  })

  const payments: any[] = data?.data?.items || []
  const meta = data?.data || { total: 0, totalPages: 1 }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Thanh toán</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{meta.total || 0} giao dịch</p>
        </div>
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-0 sm:min-w-48">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Tìm giao dịch..." className="input pl-10 text-sm h-10" />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="input w-full sm:w-auto h-10 text-sm">
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ thanh toán</option>
          <option value="paid">Đã thanh toán</option>
          <option value="failed">Thất bại</option>
          <option value="refunded">Hoàn tiền</option>
        </select>
        <select value={method} onChange={(e) => { setMethod(e.target.value); setPage(1) }} className="input w-full sm:w-auto h-10 text-sm">
          <option value="">Tất cả phương thức</option>
          <option value="cod">COD</option>
          <option value="vnpay">VNPay</option>
          <option value="momo">MoMo</option>
          <option value="bank_transfer">Chuyển khoản</option>
        </select>
      </div>

      {isLoading ? <PageLoader /> : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Mã GD</th><th>Đơn hàng</th><th>Khách hàng</th><th>Số tiền</th><th>Phương thức</th><th>Trạng thái</th><th>Ngày</th><th></th></tr>
              </thead>
              <tbody>
                {payments.map((p: any) => (
                  <tr key={p.id}>
                    <td className="font-mono text-xs text-gray-500 dark:text-gray-400">{p.transactionId || '—'}</td>
                    <td><span className="font-mono font-semibold text-primary-600 dark:text-primary-400">#{p.order?.orderNumber}</span></td>
                    <td>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{p.order?.customer?.firstName} {p.order?.customer?.lastName}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{p.order?.customer?.email}</p>
                    </td>
                    <td className="font-bold text-gray-900 dark:text-white">{formatCurrency(p.amount)}</td>
                    <td><span className="badge bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">{getStatusLabel(p.method)}</span></td>
                    <td><span className={`badge ${getStatusColor(p.status)}`}>{getStatusLabel(p.status)}</span></td>
                    <td className="text-gray-400 dark:text-gray-500 text-xs">{formatDate(p.createdAt)}</td>
                    <td>
                      <div className="flex gap-1">
                        {p.method === 'cod' && p.status === 'pending' && (
                          <button onClick={() => codMut.mutate(p.order.id)} disabled={codMut.isPending}
                            className="btn-success btn-sm">Xác nhận COD</button>
                        )}
                        {p.status === 'paid' && (
                          <button onClick={() => { setSelectedPayment(p); setRefundAmount(p.amount); setRefundModal(true) }}
                            className="btn-secondary btn-sm">Hoàn tiền</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!payments.length && <tr><td colSpan={8} className="text-center py-12 text-gray-400 dark:text-gray-500 animate-fade-in">Không có giao dịch</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="p-4"><Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={20} onChange={setPage} /></div>
        </div>
      )}

      <Modal open={refundModal} onClose={() => setRefundModal(false)} title="Hoàn tiền" size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setRefundModal(false)} className="btn-secondary">Hủy</button>
            <button onClick={() => refundMut.mutate()} disabled={refundMut.isPending} className="btn-danger">
              {refundMut.isPending ? <Spinner className="w-4 h-4" /> : 'Xác nhận hoàn tiền'}
            </button>
          </div>
        }>
        <div className="space-y-4">
          <div>
            <label className="label">Số tiền hoàn (để trống = hoàn toàn bộ)</label>
            <input value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} type="number" className="input" placeholder={selectedPayment?.amount} />
          </div>
          <div>
            <label className="label">Lý do hoàn tiền</label>
            <textarea value={refundReason} onChange={(e) => setRefundReason(e.target.value)} className="input resize-none" rows={3} placeholder="Lý do..." />
          </div>
        </div>
      </Modal>
    </div>
  )
}
