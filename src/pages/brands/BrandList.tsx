import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { brandsApi } from '@/api/brands.api'
import { useForm } from 'react-hook-form'
import { Plus, Edit, Trash2, Upload } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Spinner, { PageLoader } from '@/components/ui/Spinner'
import toast from 'react-hot-toast'

export default function BrandList() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const { register, handleSubmit, reset, setValue, formState: {} } = useForm<any>({ defaultValues: { status: 'active' } })

  const { data, isLoading } = useQuery({ queryKey: ['brands'], queryFn: brandsApi.list })
  const brands: any[] = data?.data?.items || []

  const saveMut = useMutation({
    mutationFn: (d: any) => {
      const fd = new FormData()
      Object.entries(d).forEach(([k, v]) => { if (v !== undefined && v !== null) fd.append(k, v as string) })
      if (logoFile) fd.append('image', logoFile)
      return editItem ? brandsApi.update(editItem.id, fd) : brandsApi.create(fd)
    },
    onSuccess: () => { toast.success(editItem ? 'Đã cập nhật' : 'Đã tạo thương hiệu'); qc.invalidateQueries({ queryKey: ['brands'] }); closeModal() },
  })
  const deleteMut = useMutation({
    mutationFn: (id: string) => brandsApi.delete(id),
    onSuccess: () => { toast.success('Đã xóa'); qc.invalidateQueries({ queryKey: ['brands'] }); setDeleteId(null) },
  })

  const openModal = (item?: any) => {
    setEditItem(item || null)
    setLogoFile(null)
    setLogoPreview(item?.logo || '')
    if (item) { setValue('name', item.name); setValue('description', item.description || ''); setValue('website', item.website || ''); setValue('status', item.isActive === false ? 'inactive' : 'active') }
    else reset({ status: 'active' })
    setModalOpen(true)
  }
  const closeModal = () => { setModalOpen(false); setEditItem(null); reset(); setLogoFile(null); setLogoPreview('') }

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)) }
  }

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Thương hiệu</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{brands.length} thương hiệu</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary"><Plus size={16} /> Thêm thương hiệu</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {brands.map((b: any) => (
          <div key={b.id} className="card-hover p-5 group">
            <div className="flex items-start justify-between mb-3">
              <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden flex items-center justify-center">
                {b.logo ? <img src={b.logo} alt={b.name} className="w-full h-full object-contain p-1" />
                  : <span className="text-xl font-bold text-gray-300 dark:text-gray-600">{b.name[0]}</span>}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openModal(b)} className="p-1.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400 transition-colors"><Edit size={14} /></button>
                <button onClick={() => setDeleteId(b.id)} className="p-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 dark:text-red-400 transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>
            <p className="font-semibold text-gray-900 dark:text-white">{b.name}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{b.slug}</p>
            {b.website && <a href={b.website} target="_blank" rel="noopener" className="text-xs text-primary-600 dark:text-primary-400 hover:underline mt-1 block truncate">{b.website}</a>}
            <span className={`badge mt-2 ${b.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
              {b.isActive ? 'Hoạt động' : 'Ẩn'}
            </span>
          </div>
        ))}
        {!brands.length && <div className="col-span-4 text-center py-16 text-gray-400 dark:text-gray-500 animate-fade-in">Chưa có thương hiệu</div>}
      </div>

      <Modal open={modalOpen} onClose={closeModal} title={editItem ? 'Chỉnh sửa thương hiệu' : 'Thêm thương hiệu'}
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={closeModal} disabled={saveMut.isPending} className="btn-secondary">Hủy</button>
            <button form="brand-form" type="submit" disabled={saveMut.isPending} className="btn-primary min-w-[80px]">
              {saveMut.isPending ? <><Spinner className="w-4 h-4" /> Đang lưu...</> : 'Lưu'}
            </button>
          </div>
        }>
        <form id="brand-form" onSubmit={handleSubmit((d) => saveMut.mutate(d))} className={`space-y-4 transition-opacity ${saveMut.isPending ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden flex items-center justify-center flex-shrink-0">
              {logoPreview ? <img src={logoPreview} alt="" className="w-full h-full object-contain p-1" />
                : <Upload size={24} className="text-gray-300 dark:text-gray-600" />}
            </div>
            <label className="btn-secondary cursor-pointer"><Upload size={14} /> Tải logo
              <input type="file" accept="image/*" onChange={handleLogo} className="hidden" />
            </label>
          </div>
          <div>
            <label className="label">Tên thương hiệu *</label>
            <input {...register('name', { required: true })} className="input" placeholder="Tên thương hiệu" />
          </div>
          <div>
            <label className="label">Website</label>
            <input {...register('website')} className="input" placeholder="https://example.com" />
          </div>
          <div>
            <label className="label">Mô tả</label>
            <textarea {...register('description')} className="input resize-none" rows={3} />
          </div>
          <div>
            <label className="label">Trạng thái</label>
            <select {...register('status')} className="input">
              <option value="active">Hoạt động</option>
              <option value="inactive">Ẩn</option>
            </select>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)} loading={deleteMut.isPending}
        title="Xóa thương hiệu" message="Xóa thương hiệu này?" confirmText="Xóa" />
    </div>
  )
}
