import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoriesApi } from '@/api/categories.api'
import { useForm } from 'react-hook-form'
import { Plus, Edit, Trash2, ChevronRight, ImageIcon } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Spinner, { PageLoader } from '@/components/ui/Spinner'
import toast from 'react-hot-toast'

interface CatFormData { name: string; description?: string; displayOrder?: number; isActive?: boolean }

export default function CategoryList() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [iconFile, setIconFile] = useState<File | null>(null)
  const [iconPreview, setIconPreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const iconInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const { register, handleSubmit, reset, setValue, watch, formState: { isSubmitting } } = useForm<CatFormData>({ defaultValues: { isActive: true, displayOrder: 0 } })

  const { data, isLoading } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list })
  const categories: any[] = data?.data || []

  const saveMut = useMutation({
    mutationFn: (d: CatFormData) => {
      const fd = new FormData()
      Object.entries(d).forEach(([k, v]) => { if (v !== undefined && v !== null) fd.append(k, String(v)) })
      if (iconFile) fd.append('icon', iconFile)
      if (imageFile) fd.append('image', imageFile)
      return editItem ? categoriesApi.update(editItem.id, fd) : categoriesApi.create(fd)
    },
    onSuccess: () => { toast.success(editItem ? 'Đã cập nhật' : 'Đã tạo danh mục'); qc.invalidateQueries({ queryKey: ['categories'] }); close() },
  })
  const deleteMut = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => { toast.success('Đã xóa'); qc.invalidateQueries({ queryKey: ['categories'] }); setDeleteId(null) },
  })

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) { setIconFile(f); setIconPreview(URL.createObjectURL(f)) }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)) }
  }

  const open = (item?: any) => {
    setEditItem(item || null)
    setIconFile(null); setIconPreview(item?.icon || null)
    setImageFile(null); setImagePreview(item?.image || null)
    if (item) { setValue('name', item.name); setValue('description', item.description || ''); setValue('displayOrder', item.displayOrder || 0); setValue('isActive', item.isActive) }
    else reset({ isActive: true, displayOrder: 1})
    setModalOpen(true)
  }
  const close = () => { setModalOpen(false); setEditItem(null); reset(); setIconFile(null); setIconPreview(null); setImageFile(null); setImagePreview(null) }

  // Build tree display
  const roots = categories.filter((c) => !c.parentId)
  const children = (parentId: string) => categories.filter((c) => c.parentId === parentId)

  const renderRow = (c: any, depth = 0): React.ReactNode => (
    <>
      <tr key={c.id}>
        <td>
          <div className="flex items-center gap-2" style={{ paddingLeft: depth * 20 }}>
            {depth > 0 && <ChevronRight size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />}
            {c.icon
              ? <img src={c.icon} alt="" className="w-6 h-6 rounded object-contain flex-shrink-0" />
              : c.image
                ? <img src={c.image} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                : null
            }
            <span className="font-medium text-gray-900 dark:text-white tracking-tight">{c.name}</span>
          </div>
        </td>
        <td className="text-gray-500 dark:text-gray-400 text-sm">{c.slug}</td>
        <td className="text-gray-500 dark:text-gray-400 text-sm">{children(c.id).length || '—'}</td>
        <td className="text-gray-700 dark:text-gray-300">{c.displayOrder}</td>
        <td>
          <span className={`badge ${c.isActive
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
          }`}>
            {c.isActive ? 'Hoạt động' : 'Ẩn'}
          </span>
        </td>
        <td>
          <div className="flex gap-1">
            <button
              onClick={() => open(c)}
              className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400 transition-colors"
            >
              <Edit size={14} />
            </button>
            <button
              onClick={() => setDeleteId(c.id)}
              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 dark:text-red-400 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </td>
      </tr>
      {children(c.id).map((child: any) => renderRow(child, depth + 1))}
    </>
  )

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Danh mục</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{categories.length} danh mục</p>
        </div>
        <button onClick={() => open()} className="btn-primary"><Plus size={16} /> Thêm danh mục</button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tên</th>
                <th>Slug</th>
                <th>Danh mục con</th>
                <th>Thứ tự</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {roots.map((c) => renderRow(c))}
              {!roots.length && (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-gray-400 dark:text-gray-500 animate-fade-in">
                    Chưa có danh mục
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={close} title={editItem ? 'Chỉnh sửa danh mục' : 'Thêm danh mục'}
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={close} disabled={saveMut.isPending} className="btn-secondary">Hủy</button>
            <button form="cat-form" type="submit" disabled={saveMut.isPending} className="btn-primary min-w-[80px]">
              {saveMut.isPending ? <><Spinner className="w-4 h-4" /> Đang lưu...</> : 'Lưu'}
            </button>
          </div>
        }>
        <form id="cat-form" onSubmit={handleSubmit((d) => saveMut.mutate(d))} className={`space-y-4 transition-opacity ${saveMut.isPending ? 'opacity-50 pointer-events-none' : ''}`}>
          <div>
            <label className="label">Tên danh mục *</label>
            <input {...register('name', { required: true })} className="input" placeholder="Tên danh mục" />
          </div>
          {/* <div>
            <label className="label">Danh mục cha</label>
            <select {...register('parentId')} className="input">
              <option value="">Không có (danh mục gốc)</option>
              {categories.filter((c) => c.id !== editItem?.id).map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div> */}
          <div>
            <label className="label">Mô tả</label>
            <textarea {...register('description')} className="input resize-none" rows={3} placeholder="Mô tả..." />
          </div>

          {/* Upload icon + image */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Icon danh mục</label>
              <input ref={iconInputRef} type="file" accept="image/*" className="hidden" onChange={handleIconChange} />
              <div
                onClick={() => iconInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl h-28 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors overflow-hidden bg-gray-50 dark:bg-gray-800/50"
              >
                {iconPreview
                  ? <img src={iconPreview} alt="icon" className="h-full w-full object-contain p-1" />
                  : <><ImageIcon size={22} className="text-gray-300 dark:text-gray-600 mb-1" /><span className="text-xs text-gray-400 dark:text-gray-500">Chọn icon</span></>
                }
              </div>
              {iconPreview && <button type="button" onClick={() => { setIconFile(null); setIconPreview(null) }} className="text-xs text-red-400 dark:text-red-500 mt-1 hover:underline">Xóa icon</button>}
            </div>
            <div>
              <label className="label">Ảnh bìa danh mục</label>
              <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              <div
                onClick={() => imageInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl h-28 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors overflow-hidden bg-gray-50 dark:bg-gray-800/50"
              >
                {imagePreview
                  ? <img src={imagePreview} alt="image" className="h-full w-full object-cover" />
                  : <><ImageIcon size={22} className="text-gray-300 dark:text-gray-600 mb-1" /><span className="text-xs text-gray-400 dark:text-gray-500">Chọn ảnh bìa</span></>
                }
              </div>
              {imagePreview && <button type="button" onClick={() => { setImageFile(null); setImagePreview(null) }} className="text-xs text-red-400 dark:text-red-500 mt-1 hover:underline">Xóa ảnh</button>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Thứ tự</label>
              <input {...register('displayOrder', { valueAsNumber: true })} type="number" className="input" />
            </div>
            <div>
              <label className="label">Trạng thái</label>
                <div className="flex items-center gap-2 h-10">
                <input
                  type="checkbox"
                  id="status"
                  className="toggle"
                  {...register('isActive')}
                  checked={!!(editItem ? editItem.status === 'active' : false) || watch('isActive')}
                  onChange={e => setValue('isActive', e.target.checked ? true : false)}
                />
                <label htmlFor="status" className="ml-2 select-none text-gray-700 dark:text-gray-300">
                  {watch('isActive') ? 'Hoạt động' : 'Ẩn'}
                </label>
                </div>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)} loading={deleteMut.isPending}
        title="Xóa danh mục" message="Xóa danh mục này? Hành động không thể hoàn tác." confirmText="Xóa" />
    </div>
  )
}
