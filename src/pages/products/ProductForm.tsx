import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi } from '@/api/products.api'
import { categoriesApi } from '@/api/categories.api'
import { brandsApi } from '@/api/brands.api'
import { ArrowLeft, Trash2, Upload, X, Star, Eye, EyeOff, ExternalLink } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'
import RichTextEditor from '@/components/ui/RichTextEditor'
import toast from 'react-hot-toast'

const shopeeUrlRegex = /^https?:\/\/([\w-]+\.)?shopee\.(vn|co\.id|com\.my|sg|ph|co\.th|com\.br|com|tw)\/.+$/i
const tiktokUrlRegex = /^https?:\/\/([\w-]+\.)?(tiktok\.com|vt\.tiktok\.com)\/.+$/i

const UNIT_OPTIONS = [
  { value: '', label: 'Không có' },
  { value: 'cuon', label: 'Cuộn' },
  { value: 'thung', label: 'Thùng' },
  { value: 'cai', label: 'Cái' },
] as const

const UNIT_LABELS: Record<string, string> = {
  cuon: 'cuộn',
  thung: 'thùng',
  cai: 'cái',
}

const schema = z.object({
  name: z.string().min(1, 'Nhập tên sản phẩm'),
  sku: z.string().min(1, 'Nhập SKU'),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  unitType: z.enum(['', 'cuon', 'thung', 'cai']),
  price: z.coerce.number().min(0, 'Giá không hợp lệ'),
  costPrice: z.coerce.number().min(0).optional().nullable(),
  salePrice: z.coerce.number().min(0).optional().nullable(),
  stock: z.coerce.number().min(0),
  unitsPerBox: z.coerce.number().min(1).optional().nullable(),
  boxSubUnit: z.enum(['', 'cuon', 'cai']).optional(),
  boxPrice: z.coerce.number().min(0).optional().nullable(),
  categoryId: z.string().min(1, 'Chọn danh mục'),
  brandId: z.string().optional(),
  status: z.enum(['active', 'inactive']),
  weight: z.coerce.number().min(0).optional(),
  isFeatured: z.boolean().optional(),
  tags: z.string().optional(),
  shopeeLink: z.string().optional().refine(
    (val) => !val || shopeeUrlRegex.test(val),
    { message: 'Link Shopee không hợp lệ. VD: https://shopee.vn/product/...' }
  ),
  tiktokLink: z.string().optional().refine(
    (val) => !val || tiktokUrlRegex.test(val),
    { message: 'Link TikTok không hợp lệ. VD: https://www.tiktok.com/@shop/...' }
  ),
})
type FormData = z.infer<typeof schema>

export default function ProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const isEdit = !!id
  const [images, setImages] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  const { data: product, isLoading: loadingProduct } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.get(id!),
    enabled: isEdit,
  })
  const { data: cats } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list })
  const { data: brands } = useQuery({ queryKey: ['brands'], queryFn: brandsApi.list })

  const [descPreview, setDescPreview] = useState(false)

  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'active', stock: 0, price: 0, unitType: '', unitsPerBox: null, boxSubUnit: '', boxPrice: null },
  })

  useEffect(() => {
    if (product?.data) {
      const p = product.data
      reset({
        name: p.name,
        sku: p.sku,
        shortDescription: p.shortDescription || '',
        description: p.description || '',
        unitType: p.unitType || '',
        unitsPerBox: p.unitsPerBox || null,
        boxSubUnit: p.boxSubUnit || '',
        boxPrice: p.boxPrice || null,
        price: p.price,
        costPrice: p.costPrice || null,
        salePrice: p.comparePrice || null,
        stock: p.quantity ?? 0,
        categoryId: p.category?.id || '',
        brandId: p.brand?.id || '',
        status: p.isActive !== false ? 'active' : 'inactive',
        weight: p.weight || 0,
        isFeatured: p.isFeatured || false,
        tags: p.tags?.join(', ') || '',
        shopeeLink: p.shopeeLink || '',
        tiktokLink: p.tiktokLink || '',
      })
    }
  }, [product, reset])

  const existingImages: any[] = isEdit
    ? [...(product?.data?.images || [])].sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))
    : []

  const deleteImageMut = useMutation({
    mutationFn: (imageId: string) => productsApi.deleteImage(id!, imageId),
    onSuccess: () => { toast.success('Đã xóa ảnh'); qc.invalidateQueries({ queryKey: ['product', id] }) },
  })
  const setPrimaryMut = useMutation({
    mutationFn: (imageId: string) => productsApi.setPrimaryImage(id!, imageId),
    onSuccess: () => { toast.success('Đã đặt ảnh chính'); qc.invalidateQueries({ queryKey: ['product', id] }) },
  })
  const uploadMoreMut = useMutation({
    mutationFn: (files: File[]) => {
      const fd = new FormData()
      files.forEach((f) => fd.append('images', f))
      return productsApi.uploadImages(id!, fd)
    },
    onSuccess: () => { toast.success('Đã tải ảnh lên'); qc.invalidateQueries({ queryKey: ['product', id] }) },
  })

  const saveMut = useMutation({
    mutationFn: async (data: FormData) => {
      const payload: Record<string, unknown> = {
        ...data,
        tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      }
      if (isEdit) return productsApi.update(id!, payload)
      const res = await productsApi.create(payload)
      const newId = res.data.id
      if (images.length > 0) {
        const fd = new FormData()
        images.forEach((f) => fd.append('images', f))
        await productsApi.uploadImages(newId, fd)
      }
      return res
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Đã cập nhật sản phẩm' : 'Đã tạo sản phẩm')
      qc.invalidateQueries({ queryKey: ['products'] })
      navigate('/products')
    },
  })

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setImages((prev) => [...prev, ...files])
    setPreviewUrls((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))])
  }

  const removeImage = (i: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i))
    setPreviewUrls((prev) => prev.filter((_, idx) => idx !== i))
  }

  if (loadingProduct) return <div className="flex justify-center p-20"><Spinner className="w-8 h-8 text-primary-600 dark:text-primary-400" /></div>

  return (
    <form onSubmit={handleSubmit((d) => saveMut.mutate(d))}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => navigate('/products')} className="btn-ghost p-2">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{isEdit ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm'}</h1>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => navigate('/products')} className="btn-secondary">Hủy</button>
            <button type="submit" disabled={saveMut.isPending} className="btn-primary min-w-[120px]">
              {saveMut.isPending ? <><Spinner className="w-4 h-4" /> Đang lưu...</> : (isEdit ? 'Lưu thay đổi' : 'Tạo sản phẩm')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main info */}
          <div className="lg:col-span-2 space-y-5">

            {/* Basic info */}
            <div className="card p-6 space-y-4">
              <h2 className="font-semibold text-gray-900 dark:text-white">Thông tin cơ bản</h2>
              <div>
                <label className="label">Tên sản phẩm *</label>
                <input {...register('name')} className="input" placeholder="Nhập tên sản phẩm" />
                {errors.name && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">SKU *</label>
                  <input {...register('sku')} className="input" placeholder="SKU-001" />
                  {errors.sku && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.sku.message}</p>}
                </div>
                <div>
                  <label className="label">Cân nặng (gram)</label>
                  <input {...register('weight')} type="number" className="input" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="label">Tags (phân cách bằng dấu phẩy)</label>
                <input {...register('tags')} className="input" placeholder="tag1, tag2, tag3" />
              </div>
            </div>

            {/* Pricing */}
            <div className="card p-6 space-y-4">
              <h2 className="font-semibold text-gray-900 dark:text-white">Giá & Tồn kho</h2>
              <div>
                <label className="label">Đơn vị bán *</label>
                <div className="flex gap-3">
                  {UNIT_OPTIONS.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                      <input {...register('unitType')} type="radio" value={opt.value}
                        className="w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 focus:ring-primary-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="label">Giá niêm yết{watch('unitType') ? ` / ${UNIT_LABELS[watch('unitType')!]}` : ''} *</label>
                  <input {...register('price')} type="number" className="input" placeholder="0" />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Giá gốc hiển thị cho khách</p>
                  {errors.price && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.price.message}</p>}
                </div>
                <div>
                  <label className="label">Giá khuyến mãi{watch('unitType') ? ` / ${UNIT_LABELS[watch('unitType')!]}` : ''}</label>
                  <input {...register('salePrice')} type="number" className="input" placeholder="0" />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Để trống nếu không giảm giá</p>
                </div>
                <div>
                  <label className="label">Giá vốn{watch('unitType') ? ` / ${UNIT_LABELS[watch('unitType')!]}` : ''}</label>
                  <input {...register('costPrice')} type="number" className="input" placeholder="0" />
                </div>
                <div>
                  <label className="label">Tồn kho{watch('unitType') ? ` (${UNIT_LABELS[watch('unitType')!]})` : ''} *</label>
                  <input {...register('stock')} type="number" className="input" placeholder="0" />
                  {errors.stock && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.stock.message}</p>}
                </div>
              </div>

              {/* Box pricing */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Quy cách thùng (tuỳ chọn)</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 -mt-1">Nếu sản phẩm có bán theo thùng, nhập thông tin bên dưới để khách chọn mua theo thùng</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="label">Số lượng / thùng</label>
                    <input {...register('unitsPerBox')} type="number" className="input" placeholder="VD: 50" />
                  </div>
                  <div>
                    <label className="label">Đơn vị trong thùng</label>
                    <select {...register('boxSubUnit')} className="input">
                      <option value="">Chọn đơn vị</option>
                      <option value="cuon">Cuộn</option>
                      <option value="cai">Cái</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Giá bán / thùng</label>
                    <input {...register('boxPrice')} type="number" className="input" placeholder="0" />
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="card p-6 space-y-4">
              <h2 className="font-semibold text-gray-900 dark:text-white">Mô tả</h2>
              <div>
                <label className="label">Mô tả ngắn</label>
                <Controller name="shortDescription" control={control}
                  render={({ field }) => (
                    <RichTextEditor value={field.value || ''} onChange={field.onChange}
                      placeholder="Mô tả ngắn hiển thị trên danh sách sản phẩm..." minHeight={120} simple />
                  )} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label mb-0">Mô tả chi tiết</label>
                  <button type="button" onClick={() => setDescPreview((p) => !p)}
                    className="flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors">
                    {descPreview ? <><EyeOff size={13} /> Chỉnh sửa</> : <><Eye size={13} /> Xem trước</>}
                  </button>
                </div>
                {descPreview ? (
                  <div className="rich-preview min-h-[280px] border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-white dark:bg-gray-800 overflow-auto"
                    dangerouslySetInnerHTML={{
                      __html: watch('description') || '<p style="color:#9ca3af;font-size:0.875rem">Chưa có nội dung mô tả.</p>',
                    }} />
                ) : (
                  <Controller name="description" control={control}
                    render={({ field }) => (
                      <RichTextEditor value={field.value || ''} onChange={field.onChange}
                        placeholder="Mô tả chi tiết sản phẩm, thông số kỹ thuật, hướng dẫn sử dụng..." minHeight={280} />
                    )} />
                )}
              </div>
            </div>

            {/* Images */}
            <div className="card p-6 space-y-4">
              <h2 className="font-semibold text-gray-900 dark:text-white">Hình ảnh</h2>
              <div className="flex flex-wrap gap-3">
                {isEdit ? (
                  <>
                    {existingImages.map((img: any) => (
                      <div key={img.id}
                        className={`relative w-24 h-24 rounded-xl overflow-hidden border-2 group transition-all ${img.isPrimary ? 'border-primary-500 shadow-glow' : 'border-gray-200 dark:border-gray-700'}`}>
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                        {img.isPrimary && (
                          <div className="absolute bottom-0 left-0 right-0 bg-primary-600/80 text-white text-[10px] text-center py-0.5 font-medium">Chính</div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-start justify-end p-1.5 gap-1 opacity-0 group-hover:opacity-100">
                          {!img.isPrimary && (
                            <button type="button" onClick={() => setPrimaryMut.mutate(img.id)}
                              className="w-6 h-6 bg-primary-500 rounded-lg flex items-center justify-center shadow-md" title="Đặt làm ảnh chính">
                              <Star size={10} className="text-white" />
                            </button>
                          )}
                          <button type="button" onClick={() => deleteImageMut.mutate(img.id)}
                            className="w-6 h-6 bg-red-500 rounded-lg flex items-center justify-center shadow-md">
                            <X size={10} className="text-white" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <label className={`w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/20 transition-all ${uploadMoreMut.isPending ? 'opacity-50 pointer-events-none' : ''}`}>
                      <Upload size={20} className="text-gray-400" />
                      <span className="text-[10px] text-gray-400 mt-1 font-medium">{uploadMoreMut.isPending ? 'Đang tải...' : 'Thêm ảnh'}</span>
                      <input type="file" accept="image/*" multiple onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        if (files.length) uploadMoreMut.mutate(files)
                        e.target.value = ''
                      }} className="hidden" />
                    </label>
                  </>
                ) : (
                  <>
                    {previewUrls.map((url, i) => (
                      <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 group">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removeImage(i)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                          <X size={10} className="text-white" />
                        </button>
                      </div>
                    ))}
                    <label className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/20 transition-all">
                      <Upload size={20} className="text-gray-400" />
                      <span className="text-[10px] text-gray-400 mt-1 font-medium">Thêm ảnh</span>
                      <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
                    </label>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="card p-6 space-y-4">
              <h2 className="font-semibold text-gray-900 dark:text-white">Phân loại</h2>
              <div>
                <label className="label">Danh mục *</label>
                <select {...register('categoryId')} className="input">
                  <option value="">Chọn danh mục</option>
                  {(cats?.data || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {errors.categoryId && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.categoryId.message}</p>}
              </div>
              <div>
                <label className="label">Thương hiệu</label>
                <select {...register('brandId')} className="input">
                  <option value="">Không có</option>
                  {(brands?.data?.items || []).map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Trạng thái</label>
                <select {...register('status')} className="input">
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Ẩn</option>
                </select>
              </div>
              <div className="flex items-center gap-2.5">
                <input {...register('isFeatured')} type="checkbox" id="featured"
                  className="w-4 h-4 rounded text-primary-600 border-gray-300 dark:border-gray-600 focus:ring-primary-500" />
                <label htmlFor="featured" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">Sản phẩm nổi bật</label>
              </div>
            </div>

            {/* Link sàn TMĐT */}
            <div className="card p-6 space-y-4">
              <div className="flex items-center gap-2">
                <ExternalLink size={16} className="text-gray-500 dark:text-gray-400" />
                <h2 className="font-semibold text-gray-900 dark:text-white">Link sàn TMĐT</h2>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 -mt-2">Link sản phẩm trên các sàn thương mại điện tử để khách hàng mua hàng</p>
              <div>
                <label className="label">
                  <span className="inline-flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none"><rect width="24" height="24" rx="4" fill="#EE4D2D"/><path d="M12 4.5c-1.2 0-2.2.5-2.8 1.3-.3.4-.1.9.3 1.1.4.2.9.1 1.1-.3.3-.4.8-.6 1.4-.6s1.1.2 1.4.6c.2.4.7.5 1.1.3.4-.2.6-.7.3-1.1-.6-.8-1.6-1.3-2.8-1.3zm-4 5c0-2.2 1.8-4 4-4s4 1.8 4 4v.5h1.5c.3 0 .5.2.5.5v8c0 .3-.2.5-.5.5h-11c-.3 0-.5-.2-.5-.5v-8c0-.3.2-.5.5-.5H8V9.5z" fill="white"/></svg>
                    Shopee
                  </span>
                </label>
                <input {...register('shopeeLink')} className="input" placeholder="https://shopee.vn/product/..." />
                {errors.shopeeLink && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.shopeeLink.message}</p>}
              </div>
              <div>
                <label className="label">
                  <span className="inline-flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none"><rect width="24" height="24" rx="4" fill="#010101"/><path d="M16.5 8.5c-.8-.5-1.7-.8-2.6-.8-2 0-3.6 1.3-4.2 3.1-.1.2-.1.4-.1.7 0 .2 0 .5.1.7.6 1.8 2.2 3.1 4.2 3.1.9 0 1.8-.3 2.6-.8l.2-.1 1.8 1.1-.6-2.1c.4-.6.6-1.2.6-1.9s-.2-1.3-.6-1.9l.6-2.1-1.8 1.1-.2-.1z" fill="#25F4EE"/><path d="M9.5 12.5c0-.2 0-.5.1-.7-.6.3-1.1.8-1.4 1.4-.2.4-.3.9-.3 1.3 0 1.7 1.3 3 3 3 .5 0 .9-.1 1.3-.3-.6-.3-1.1-.8-1.4-1.4-.2-.4-.3-.8-.3-1.3v-2z" fill="#FE2C55"/></svg>
                    TikTok Shop
                  </span>
                </label>
                <input {...register('tiktokLink')} className="input" placeholder="https://www.tiktok.com/@shop/product/..." />
                {errors.tiktokLink && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.tiktokLink.message}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
