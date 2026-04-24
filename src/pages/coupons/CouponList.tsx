import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { couponsApi } from '@/api/coupons.api'
import { useForm } from 'react-hook-form'
import { Plus, Edit, Trash2, BarChart2 } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Spinner, { PageLoader } from '@/components/ui/Spinner'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function CouponList() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [usageModal, setUsageModal] = useState(false)
  const [usageData, setUsageData] = useState<any>(null)
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<any>({ defaultValues: { type: 'percentage', status: 'active', minOrderAmount: 0, usageLimit: null } })

  const { data, isLoading } = useQuery({ queryKey: ['coupons'], queryFn: () => couponsApi.list() })
  const coupons: any[] = data?.data?.items || data?.data || []

  const saveMut = useMutation({
    mutationFn: (d: any) => editItem ? couponsApi.update(editItem.id, d) : couponsApi.create(d),
    onSuccess: () => { toast.success(editItem ? 'Đã cập nhật' : 'Đã tạo mã giảm giá'); qc.invalidateQueries({ queryKey: ['coupons'] }); closeModal() },
  })
  const deleteMut = useMutation({
    mutationFn: (id: string) => couponsApi.delete(id),
    onSuccess: () => { toast.success('Đã xóa'); qc.invalidateQueries({ queryKey: ['coupons'] }); setDeleteId(null) },
  })

  const openModal = (item?: any) => {
    setEditItem(item || null)
    if (item) {
      setValue('code', item.code ?? ''); setValue('name', item.name ?? ''); setValue('type', item.type ?? 'percentage')
      setValue('value', item.value ?? ''); setValue('minOrderAmount', item.minOrderValue ?? item.minOrderAmount ?? 0)
      setValue('usageLimit', item.usageLimit ?? ''); setValue('startDate', item.startDate ? item.startDate.slice(0, 16) : '')
      setValue('endDate', item.endDate ? item.endDate.slice(0, 16) : ''); setValue('status', item.isActive === false ? 'inactive' : 'active')
      setValue('description', item.description ?? '')
    } else reset({ type: 'percentage', status: 'active', minOrderAmount: 0 })
    setModalOpen(true)
  }
  const closeModal = () => { setModalOpen(false); setEditItem(null); reset() }

  const showUsage = async (id: string) => {
    try { const d = await couponsApi.usage(id); setUsageData(d.data); setUsageModal(true) } catch {}
  }

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Mã giảm giá</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{coupons.length} mã</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary"><Plus size={16} /> Tạo mã giảm giá</button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>Mã</th><th>Loại</th><th>Giá trị</th><th>Đơn tối thiểu</th><th>Đã dùng</th><th>Giới hạn</th><th>Hiệu lực</th><th>Trạng thái</th><th></th></tr></thead>
            <tbody>
              {coupons && coupons.map((c: any) => (
                <tr key={c.id}>
                  <td><span className="font-mono font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/30 px-2 py-0.5 rounded-lg">{c.code}</span></td>
                  <td className="text-gray-600 dark:text-gray-400 text-sm">{getStatusLabel(c.type)}</td>
                  <td className="font-semibold text-gray-900 dark:text-white">{c.type === 'percentage' ? `${c.value}%` : c.type === 'fixed' ? formatCurrency(c.value) : 'Miễn phí ship'}</td>
                  <td className="text-gray-600 dark:text-gray-400">{(c.minOrderValue || c.minOrderAmount) > 0 ? formatCurrency(c.minOrderValue ?? c.minOrderAmount) : '—'}</td>
                  <td className="text-gray-700 dark:text-gray-300">{c.usageCount || 0}</td>
                  <td className="text-gray-700 dark:text-gray-300">{c.usageLimit || '∞'}</td>
                  <td className="text-xs text-gray-400 dark:text-gray-500">
                    {c.startDate && formatDate(c.startDate, 'dd/MM/yy')} — {c.endDate && formatDate(c.endDate, 'dd/MM/yy')}
                  </td>
                  <td><span className={`badge ${c.isActive !== false ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>{c.isActive !== false ? 'Hoạt động' : 'Ẩn'}</span></td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => showUsage(c.id)} className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"><BarChart2 size={14} /></button>
                      <button onClick={() => openModal(c)} className="p-1.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400 transition-colors"><Edit size={14} /></button>
                      <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 dark:text-red-400 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!coupons.length && <tr><td colSpan={9} className="text-center py-12 text-gray-400 dark:text-gray-500 animate-fade-in">Chưa có mã giảm giá</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={closeModal} title={editItem ? 'Chỉnh sửa mã giảm giá' : 'Tạo mã giảm giá'} size="lg"
        footer={<div className="flex gap-3 justify-end"><button onClick={closeModal} className="btn-secondary">Hủy</button><button form="coupon-form" type="submit" disabled={saveMut.isPending} className="btn-primary min-w-[80px]">{saveMut.isPending ? <><Spinner className="w-4 h-4" /> Đang lưu...</> : 'Lưu'}</button></div>}>
        <form id="coupon-form" onSubmit={handleSubmit((d) => saveMut.mutate(d))} className={`space-y-4 transition-opacity ${saveMut.isPending ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Mã giảm giá *</label><input {...register('code', { required: true })} className="input font-mono uppercase" placeholder="SALE10" /></div>
            <div><label className="label">Tên *</label><input {...register('name', { required: true })} className="input" placeholder="Giảm giá cuối tuần" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Loại</label><select {...register('type')} className="input"><option value="percentage">Phần trăm (%)</option><option value="fixed">Số tiền cố định</option><option value="free_shipping">Miễn phí ship</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Giá trị giảm</label><input {...register('value')} type="number" className="input" placeholder="10" /></div>
            <div><label className="label">Đơn hàng tối thiểu</label><input {...register('minOrderAmount')} type="number" className="input" placeholder="0" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Ngày bắt đầu</label><input {...register('startDate')} type="datetime-local" className="input" /></div>
            <div><label className="label">Ngày kết thúc</label><input {...register('endDate')} type="datetime-local" className="input" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Giới hạn lượt dùng</label><input {...register('usageLimit')} type="number" className="input" placeholder="Không giới hạn" /></div>
            <div><label className="label">Trạng thái</label><select {...register('status')} className="input"><option value="active">Hoạt động</option><option value="inactive">Ẩn</option></select></div>
          </div>
          <div><label className="label">Mô tả</label><textarea {...register('description')} className="input resize-none" rows={2} /></div>
        </form>
      </Modal>

      <Modal open={usageModal} onClose={() => setUsageModal(false)} title="Thống kê sử dụng" size="sm">
        {usageData && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{usageData.totalUsage}</p>
                <p className="text-sm text-blue-500 dark:text-blue-400 mt-1">Lượt sử dụng</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(usageData.totalDiscount)}</p>
                <p className="text-sm text-emerald-500 dark:text-emerald-400 mt-1">Tổng đã giảm</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)} loading={deleteMut.isPending}
        title="Xóa mã giảm giá" message="Xóa mã này?" confirmText="Xóa" />
    </div>
  )
}
