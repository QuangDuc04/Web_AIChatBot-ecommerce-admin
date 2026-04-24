import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bannersApi } from '@/api/banners.api'
import { Plus, Edit, Trash2, Upload, Image as ImageIcon } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Spinner, { PageLoader } from '@/components/ui/Spinner'
import { formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'

export default function BannerList() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [imgFile, setImgFile] = useState<File | null>(null)
  const [imgPreview, setImgPreview] = useState('')
  const { register, handleSubmit, reset, setValue, formState: {} } = useForm<any>({ defaultValues: { status: 'active', placement: 'home', sortOrder: 0 } })

  const { data, isLoading } = useQuery({ queryKey: ['banners'], queryFn: bannersApi.list })
  const banners: any[] = data?.data?.items || []

  const saveMut = useMutation({
    mutationFn: (d: any) => {
      const fd = new FormData()
      Object.entries(d).forEach(([k, v]) => { if (v !== undefined && v !== '') fd.append(k, v as string) })
      if (imgFile) fd.append('image', imgFile)
      return editItem ? bannersApi.update(editItem.id, fd) : bannersApi.create(fd)
    },
    onSuccess: () => { toast.success(editItem ? 'Đã cập nhật' : 'Đã tạo banner'); qc.invalidateQueries({ queryKey: ['banners'] }); closeModal() },
  })
  const deleteMut = useMutation({
    mutationFn: (id: string) => bannersApi.delete(id),
    onSuccess: () => { toast.success('Đã xóa'); qc.invalidateQueries({ queryKey: ['banners'] }); setDeleteId(null) },
  })

  const openModal = (item?: any) => {
    setEditItem(item || null); setImgFile(null); setImgPreview(item?.image || '')
    if (item) { setValue('title', item.title ?? ''); setValue('subtitle', item.subtitle ?? ''); setValue('linkUrl', item.link ?? item.linkUrl ?? ''); setValue('placement', item.placement ?? 'home'); setValue('status', item.isActive === false ? 'inactive' : 'active'); setValue('sortOrder', item.displayOrder ?? item.sortOrder ?? 0); setValue('startDate', item.startDate ? item.startDate.slice(0, 16) : ''); setValue('endDate', item.endDate ? item.endDate.slice(0, 16) : '') }
    else reset({ status: 'active', placement: 'home', sortOrder: 0 })
    setModalOpen(true)
  }
  const closeModal = () => { setModalOpen(false); setEditItem(null); reset(); setImgFile(null); setImgPreview('') }

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Banner</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{banners.length} banner</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary"><Plus size={16} /> Thêm banner</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {banners.map((b: any) => (
          <div key={b.id} className="card overflow-hidden group hover:shadow-card-hover dark:hover:shadow-card-dark-hover hover:-translate-y-0.5 transition-all">
            <div className="relative aspect-[16/6] bg-gray-100 dark:bg-gray-800">
              {b.image ? <img src={b.image} alt={b.title} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={32} className="text-gray-300 dark:text-gray-600" /></div>}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button onClick={() => openModal(b)} className="w-9 h-9 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-md"><Edit size={15} className="text-blue-600 dark:text-blue-400" /></button>
                <button onClick={() => setDeleteId(b.id)} className="w-9 h-9 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-md"><Trash2 size={15} className="text-red-500 dark:text-red-400" /></button>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{b.title || 'Không có tiêu đề'}</p>
                  {b.subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">{b.subtitle}</p>}
                </div>
                <span className={`badge flex-shrink-0 ${b.isActive !== false ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>{b.isActive !== false ? 'Hoạt động' : 'Ẩn'}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="badge bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">{b.placement}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">Thứ tự: {b.displayOrder ?? b.sortOrder ?? 0}</span>
              </div>
            </div>
          </div>
        ))}
        {!banners.length && <div className="col-span-3 text-center py-16 text-gray-400 dark:text-gray-500 animate-fade-in">Chưa có banner</div>}
      </div>

      <Modal open={modalOpen} onClose={closeModal} title={editItem ? 'Chỉnh sửa banner' : 'Thêm banner mới'} size="lg"
        footer={<div className="flex gap-3 justify-end"><button onClick={closeModal} className="btn-secondary">Hủy</button><button form="banner-form" type="submit" disabled={saveMut.isPending} className="btn-primary min-w-[80px]">{saveMut.isPending ? <><Spinner className="w-4 h-4" /> Đang lưu...</> : 'Lưu'}</button></div>}>
        <form id="banner-form" onSubmit={handleSubmit((d) => saveMut.mutate(d))} className={`space-y-4 transition-opacity ${saveMut.isPending ? 'opacity-50 pointer-events-none' : ''}`}>
          <div>
            <label className="label">Hình ảnh</label>
            <div className="relative aspect-[16/5] bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 transition-colors">
              {imgPreview ? <img src={imgPreview} alt="" className="w-full h-full object-cover" /> : (
                <div className="flex flex-col items-center justify-center h-full gap-2"><Upload size={28} className="text-gray-400 dark:text-gray-600" /><p className="text-sm text-gray-400 dark:text-gray-500">Nhấn để tải ảnh lên</p></div>
              )}
              <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setImgFile(f); setImgPreview(URL.createObjectURL(f)) } }} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Tiêu đề</label><input {...register('title')} className="input" placeholder="Sale lớn cuối năm" /></div>
            <div><label className="label">Phụ đề</label><input {...register('subtitle')} className="input" placeholder="Giảm đến 70%" /></div>
          </div>
          <div><label className="label">URL liên kết</label><input {...register('linkUrl')} className="input" placeholder="https://..." /></div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="label">Vị trí</label><select {...register('placement')} className="input"><option value="home">Trang chủ</option><option value="category">Danh mục</option><option value="product">Sản phẩm</option></select></div>
            <div><label className="label">Thứ tự</label><input {...register('sortOrder')} type="number" className="input" /></div>
            <div><label className="label">Trạng thái</label><select {...register('status')} className="input"><option value="active">Hoạt động</option><option value="inactive">Ẩn</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Ngày bắt đầu</label><input {...register('startDate')} type="datetime-local" className="input" /></div>
            <div><label className="label">Ngày kết thúc</label><input {...register('endDate')} type="datetime-local" className="input" /></div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)} loading={deleteMut.isPending}
        title="Xóa banner" message="Xóa banner này?" confirmText="Xóa" />
    </div>
  )
}
