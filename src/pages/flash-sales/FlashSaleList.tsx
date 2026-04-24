import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { flashSalesApi } from '@/api/flashSales.api'
import { productsApi } from '@/api/products.api'
import { useForm } from 'react-hook-form'
import { Plus, Edit, Trash2, Zap, PlusCircle } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Spinner, { PageLoader } from '@/components/ui/Spinner'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function FlashSaleList() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [itemModal, setItemModal] = useState(false)
  const [selectedSale, setSelectedSale] = useState<any>(null)
  const [itemForm, setItemForm] = useState({ productId: '', flashPrice: '', stock: '' })
  const { register, handleSubmit, reset, setValue, formState: {} } = useForm<any>({ defaultValues: { status: 'active', discountPercentage: 0 } })

  const { data, isLoading } = useQuery({ queryKey: ['flash-sales'], queryFn: () => flashSalesApi.list() })
  const { data: productsData } = useQuery({ queryKey: ['products-all'], queryFn: () => productsApi.list({ limit: 100 }) })

  const flashSales: any[] = data?.data?.items || data?.data || []
  const products: any[] = productsData?.data?.items || []

  const saveMut = useMutation({
    mutationFn: (d: any) => editItem ? flashSalesApi.update(editItem.id, d) : flashSalesApi.create(d),
    onSuccess: () => { toast.success(editItem ? 'Đã cập nhật' : 'Đã tạo flash sale'); qc.invalidateQueries({ queryKey: ['flash-sales'] }); closeModal() },
  })
  const deleteMut = useMutation({
    mutationFn: (id: string) => flashSalesApi.delete(id),
    onSuccess: () => { toast.success('Đã xóa'); qc.invalidateQueries({ queryKey: ['flash-sales'] }); setDeleteId(null) },
  })
  const addItemMut = useMutation({
    mutationFn: () => flashSalesApi.addItem(selectedSale.id, { productId: itemForm.productId, discountPercent: Number(itemForm.flashPrice), quantity: Number(itemForm.stock) }),
    onSuccess: () => { toast.success('Đã thêm sản phẩm'); qc.invalidateQueries({ queryKey: ['flash-sales'] }); setItemModal(false); setItemForm({ productId: '', flashPrice: '', stock: '' }) },
  })
  const removeItemMut = useMutation({
    mutationFn: (itemId: string) => flashSalesApi.removeItem(itemId),
    onSuccess: () => { toast.success('Đã xóa'); qc.invalidateQueries({ queryKey: ['flash-sales'] }) },
  })

  const openModal = (item?: any) => {
    setEditItem(item || null)
    if (item) {
      setValue('name', item.name ?? ''); setValue('description', item.description ?? '')
      setValue('startTime', item.startDate ? item.startDate.slice(0, 16) : '')
      setValue('endTime', item.endDate ? item.endDate.slice(0, 16) : '')
      setValue('status', item.isActive === false ? 'inactive' : 'active')
      setValue('discountPercentage', item.discountPercentage ?? 0)
    } else reset({ status: 'active', discountPercentage: 0 })
    setModalOpen(true)
  }
  const closeModal = () => { setModalOpen(false); setEditItem(null); reset() }

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Flash Sale</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{flashSales.length} chiến dịch</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary"><Plus size={16} /> Tạo Flash Sale</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {flashSales.map((fs: any) => (
          <div key={fs.id} className="card p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                  <Zap size={20} className="text-orange-500 dark:text-orange-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{fs.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(fs.startDate)} → {formatDate(fs.endDate)}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setSelectedSale(fs); setItemModal(true) }} className="p-1.5 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-950/30 text-orange-500 dark:text-orange-400 transition-colors" title="Thêm sản phẩm"><PlusCircle size={15} /></button>
                <button onClick={() => openModal(fs)} className="p-1.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400 transition-colors"><Edit size={15} /></button>
                <button onClick={() => setDeleteId(fs.id)} className="p-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 dark:text-red-400 transition-colors"><Trash2 size={15} /></button>
              </div>
            </div>
            {fs.discountPercentage > 0 && <p className="text-sm text-orange-600 dark:text-orange-400 font-medium mb-3">Giảm {fs.discountPercentage}% toàn bộ</p>}
            <div className="space-y-2">
              {(fs.items || []).slice(0, 3).map((item: any) => (
                <div key={item.id} className="flex items-center justify-between text-sm bg-orange-50 dark:bg-orange-950/20 rounded-xl px-3 py-2.5">
                  <span className="text-gray-700 dark:text-gray-300 truncate flex-1">{item.product?.name}</span>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                    <span className="font-semibold text-orange-600 dark:text-orange-400">{formatCurrency(item.salePrice)}</span>
                    <button onClick={() => removeItemMut.mutate(item.id)} className="text-red-400 dark:text-red-500 hover:text-red-600 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
              {(fs.items?.length || 0) > 3 && <p className="text-xs text-gray-400 dark:text-gray-500 text-center">+{fs.items.length - 3} sản phẩm khác</p>}
              {!fs.items?.length && <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-2 animate-fade-in">Chưa có sản phẩm</p>}
            </div>
          </div>
        ))}
        {!flashSales.length && <div className="col-span-2 text-center py-16 text-gray-400 dark:text-gray-500 animate-fade-in">Chưa có flash sale</div>}
      </div>

      <Modal open={modalOpen} onClose={closeModal} title={editItem ? 'Chỉnh sửa Flash Sale' : 'Tạo Flash Sale mới'} size="md"
        footer={<div className="flex gap-3 justify-end"><button onClick={closeModal} className="btn-secondary">Hủy</button><button form="fs-form" type="submit" disabled={saveMut.isPending} className="btn-primary min-w-[80px]">{saveMut.isPending ? <><Spinner className="w-4 h-4" /> Đang lưu...</> : 'Lưu'}</button></div>}>
        <form id="fs-form" onSubmit={handleSubmit((d) => saveMut.mutate(d))} className={`space-y-4 transition-opacity ${saveMut.isPending ? 'opacity-50 pointer-events-none' : ''}`}>
          <div><label className="label">Tên chiến dịch *</label><input {...register('name', { required: true })} className="input" placeholder="Flash Sale cuối tuần" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Bắt đầu</label><input {...register('startTime')} type="datetime-local" className="input" /></div>
            <div><label className="label">Kết thúc</label><input {...register('endTime')} type="datetime-local" className="input" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Giảm % mặc định</label><input {...register('discountPercentage')} type="number" min="0" max="100" className="input" /></div>
            <div><label className="label">Trạng thái</label><select {...register('status')} className="input"><option value="active">Hoạt động</option><option value="inactive">Ẩn</option></select></div>
          </div>
          <div><label className="label">Mô tả</label><textarea {...register('description')} className="input resize-none" rows={2} /></div>
        </form>
      </Modal>

      <Modal open={itemModal} onClose={() => setItemModal(false)} title="Thêm sản phẩm vào Flash Sale" size="sm"
        footer={<div className="flex gap-3 justify-end"><button onClick={() => setItemModal(false)} className="btn-secondary">Hủy</button><button onClick={() => addItemMut.mutate()} disabled={addItemMut.isPending} className="btn-primary">{addItemMut.isPending ? <Spinner className="w-4 h-4" /> : 'Thêm'}</button></div>}>
        <div className="space-y-4">
          <div><label className="label">Sản phẩm</label><select value={itemForm.productId} onChange={(e) => setItemForm({ ...itemForm, productId: e.target.value })} className="input"><option value="">Chọn sản phẩm</option>{products.map((p: any) => <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.price)}</option>)}</select></div>
          <div><label className="label">Giảm giá (%) *</label><input value={itemForm.flashPrice} onChange={(e) => setItemForm({ ...itemForm, flashPrice: e.target.value })} type="number" min="1" max="99" className="input" placeholder="20" /></div>
          <div><label className="label">Số lượng flash *</label><input value={itemForm.stock} onChange={(e) => setItemForm({ ...itemForm, stock: e.target.value })} type="number" min="1" className="input" placeholder="0" /></div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)} loading={deleteMut.isPending}
        title="Xóa Flash Sale" message="Xóa chiến dịch này?" confirmText="Xóa" />
    </div>
  )
}
