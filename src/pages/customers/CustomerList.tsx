import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customersApi } from '@/api/customers.api'
import { useForm } from 'react-hook-form'
import { Plus, Edit, Trash2, Search, Upload, X, Phone, Mail, MapPin, Building2, ImageIcon } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Spinner, { PageLoader } from '@/components/ui/Spinner'
import Pagination from '@/components/ui/Pagination'
import { useDebounce } from '@/hooks/useDebounce'
import toast from 'react-hot-toast'

interface CustomerFormData {
  name: string
  email?: string
  phone?: string
  address?: string
  company?: string
  notes?: string
  isActive?: boolean
}

export default function CustomerList() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const dSearch = useDebounce(search, 400)

  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Image upload state
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const imageInputRef = useRef<HTMLInputElement>(null)

  // Detail modal for viewing images
  const [detailItem, setDetailItem] = useState<any>(null)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CustomerFormData>({
    defaultValues: { isActive: true },
  })

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, dSearch, status],
    queryFn: () => customersApi.list({ page, limit: 15, search: dSearch || undefined, status: status || undefined }),
  })
  const customers: any[] = data?.data?.items || data?.data || []
  const meta = data?.data || { total: 0, totalPages: 1 }

  const saveMut = useMutation({
    mutationFn: async (d: CustomerFormData) => {
      const fd = new FormData()
      Object.entries(d).forEach(([k, v]) => { if (v !== undefined && v !== null) fd.append(k, String(v)) })
      imageFiles.forEach((f) => fd.append('images', f))

      if (editItem) {
        return customersApi.update(editItem.id, fd)
      }
      return customersApi.create(fd)
    },
    onSuccess: () => {
      toast.success(editItem ? 'Đã cập nhật khách hàng' : 'Đã tạo khách hàng')
      qc.invalidateQueries({ queryKey: ['customers'] })
      close()
    },
    onError: () => toast.error('Có lỗi xảy ra'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => customersApi.delete(id),
    onSuccess: () => {
      toast.success('Đã xóa khách hàng')
      qc.invalidateQueries({ queryKey: ['customers'] })
      setDeleteId(null)
    },
  })

  const deleteImageMut = useMutation({
    mutationFn: ({ customerId, imageId }: { customerId: string; imageId: string }) =>
      customersApi.deleteImage(customerId, imageId),
    onSuccess: () => {
      toast.success('Đã xóa ảnh')
      qc.invalidateQueries({ queryKey: ['customers'] })
      if (detailItem) {
        setDetailItem((prev: any) => ({
          ...prev,
          images: prev.images?.filter((img: any) => img.id !== deleteImageMut.variables?.imageId),
        }))
      }
    },
  })

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setImageFiles((prev) => [...prev, ...files])
    setImagePreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))])
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  const removeNewImage = (i: number) => {
    setImageFiles((prev) => prev.filter((_, idx) => idx !== i))
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[i])
      return prev.filter((_, idx) => idx !== i)
    })
  }

  const open = (item?: any) => {
    setEditItem(item || null)
    setImageFiles([])
    setImagePreviews([])
    if (item) {
      setValue('name', item.name)
      setValue('email', item.email || '')
      setValue('phone', item.phone || '')
      setValue('address', item.address || '')
      setValue('company', item.company || '')
      setValue('notes', item.notes || '')
      setValue('isActive', item.isActive ?? true)
    } else {
      reset({ isActive: true })
    }
    setModalOpen(true)
  }

  const close = () => {
    setModalOpen(false)
    setEditItem(null)
    reset()
    setImageFiles([])
    imagePreviews.forEach((url) => URL.revokeObjectURL(url))
    setImagePreviews([])
  }

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Khách hàng</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{meta.total || customers.length} khách hàng</p>
        </div>
        <button onClick={() => open()} className="btn-primary"><Plus size={16} /> Thêm khách hàng</button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-0 sm:min-w-48">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Tìm khách hàng..." className="input pl-10 text-sm h-10" />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="input w-full sm:w-auto h-10 text-sm">
          <option value="">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="inactive">Ẩn</option>
        </select>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Khách hàng</th>
                <th>Liên hệ</th>
                <th>Địa chỉ</th>
                <th>Công ty</th>
                <th>Hình ảnh</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c: any) => (
                <tr key={c.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                          {c.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{c.name}</span>
                    </div>
                  </td>
                  <td>
                    <div className="space-y-1">
                      {c.email && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                          <Mail size={13} /> {c.email}
                        </div>
                      )}
                      {c.phone && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                          <Phone size={13} /> {c.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    {c.address && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 max-w-[200px] truncate">
                        <MapPin size={13} className="flex-shrink-0" /> {c.address}
                      </div>
                    )}
                  </td>
                  <td>
                    {c.company && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                        <Building2 size={13} /> {c.company}
                      </div>
                    )}
                  </td>
                  <td>
                    {c.images?.length > 0 ? (
                      <button
                        onClick={() => setDetailItem(c)}
                        className="flex items-center gap-1.5 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                      >
                        <ImageIcon size={14} /> {c.images.length} ảnh
                      </button>
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
                    )}
                  </td>
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
                      <button onClick={() => open(c)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400 transition-colors">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => setDeleteId(c.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 dark:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!customers.length && (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-400 dark:text-gray-500 animate-fade-in">
                    Chưa có khách hàng
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={15} onChange={setPage} />
      )}

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={close} title={editItem ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng'} size="lg"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={close} disabled={saveMut.isPending} className="btn-secondary">Hủy</button>
            <button form="customer-form" type="submit" disabled={saveMut.isPending} className="btn-primary min-w-[80px]">
              {saveMut.isPending ? <><Spinner className="w-4 h-4" /> Đang lưu...</> : 'Lưu'}
            </button>
          </div>
        }>
        <form id="customer-form" onSubmit={handleSubmit((d) => saveMut.mutate(d))}
          className={`space-y-4 transition-opacity ${saveMut.isPending ? 'opacity-50 pointer-events-none' : ''}`}>

          <div>
            <label className="label">Tên khách hàng *</label>
            <input {...register('name', { required: 'Nhập tên khách hàng' })} className="input" placeholder="Tên khách hàng" />
            {errors.name && <p className="text-red-500 text-xs mt-1.5">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Email</label>
              <input {...register('email')} type="email" className="input" placeholder="email@example.com" />
            </div>
            <div>
              <label className="label">Số điện thoại</label>
              <input {...register('phone')} className="input" placeholder="0xxx xxx xxx" />
            </div>
          </div>

          <div>
            <label className="label">Công ty</label>
            <input {...register('company')} className="input" placeholder="Tên công ty (nếu có)" />
          </div>

          <div>
            <label className="label">Địa chỉ</label>
            <input {...register('address')} className="input" placeholder="Địa chỉ khách hàng" />
          </div>

          <div>
            <label className="label">Ghi chú</label>
            <textarea {...register('notes')} className="input resize-none" rows={3} placeholder="Ghi chú thêm..." />
          </div>

          {/* Image Upload - Hình ảnh cơ sở */}
          <div>
            <label className="label">Hình ảnh cơ sở</label>
            <div className="flex flex-wrap gap-3 mt-1">
              {/* Existing images (when editing) */}
              {editItem?.images?.map((img: any) => (
                <div key={img.id} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 group">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  <button type="button"
                    onClick={() => deleteImageMut.mutate({ customerId: editItem.id, imageId: img.id })}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={10} className="text-white" />
                  </button>
                </div>
              ))}

              {/* New image previews */}
              {imagePreviews.map((url, i) => (
                <div key={`new-${i}`} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeNewImage(i)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={10} className="text-white" />
                  </button>
                </div>
              ))}

              {/* Upload button */}
              <label className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 dark:hover:border-primary-500 transition-all bg-gray-50 dark:bg-gray-800/50">
                <Upload size={20} className="text-gray-400 dark:text-gray-500" />
                <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-medium">Thêm ảnh</span>
                <input ref={imageInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
              </label>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Upload hình ảnh cơ sở, văn phòng, nhà xưởng của khách hàng</p>
          </div>

          <div>
            <label className="label">Trạng thái</label>
            <div className="flex items-center gap-2 h-10">
              <input type="checkbox" id="customer-status" className="toggle" {...register('isActive')}
                checked={watch('isActive')}
                onChange={(e) => setValue('isActive', e.target.checked)} />
              <label htmlFor="customer-status" className="ml-2 select-none text-gray-700 dark:text-gray-300">
                {watch('isActive') ? 'Hoạt động' : 'Ẩn'}
              </label>
            </div>
          </div>
        </form>
      </Modal>

      {/* Image Detail Modal */}
      <Modal open={!!detailItem} onClose={() => setDetailItem(null)} title={`Hình ảnh cơ sở - ${detailItem?.name || ''}`} size="xl">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {detailItem?.images?.map((img: any) => (
            <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 group">
              <img src={img.url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => deleteImageMut.mutate({ customerId: detailItem.id, imageId: img.id })}
                className="absolute top-2 right-2 w-7 h-7 bg-red-500/90 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 size={12} className="text-white" />
              </button>
            </div>
          ))}
          {(!detailItem?.images || detailItem.images.length === 0) && (
            <div className="col-span-full text-center py-12 text-gray-400 dark:text-gray-500">
              Chưa có hình ảnh
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)} loading={deleteMut.isPending}
        title="Xóa khách hàng" message="Xóa khách hàng này? Hành động không thể hoàn tác." confirmText="Xóa" />
    </div>
  )
}
