import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi } from '@/api/products.api'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, Image as ImageIcon } from 'lucide-react'
import { PageLoader } from '@/components/ui/Spinner'
import Pagination from '@/components/ui/Pagination'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { formatCurrency, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useDebounce } from '@/hooks/useDebounce'
import { useQuery as uQ } from '@tanstack/react-query'
import { categoriesApi } from '@/api/categories.api'
import { brandsApi } from '@/api/brands.api'

export default function ProductList() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [brandId, setBrandId] = useState('')
  const [status, setStatus] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const dSearch = useDebounce(search, 400)

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, dSearch, categoryId, brandId, status],
    queryFn: () => productsApi.list({ page, limit: 15, search: dSearch || undefined, categoryId: categoryId || undefined, brandId: brandId || undefined, status: status || 'all' }),
  })
  const { data: cats } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list })
  const { data: brands } = useQuery({ queryKey: ['brands'], queryFn: brandsApi.list })

  const deleteMut = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => { toast.success('Đã xóa sản phẩm'); qc.invalidateQueries({ queryKey: ['products'] }); setDeleteId(null) },
  })

  const products = data?.data?.items || []
  const meta = data?.data || { total: 0, totalPages: 1 }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Sản phẩm</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{meta.total || 0} sản phẩm</p>
        </div>
        <button onClick={() => navigate('/products/new')} className="btn-primary">
          <Plus size={16} /> Thêm sản phẩm
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-0 sm:min-w-48">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Tìm sản phẩm..." className="input pl-10 text-sm h-10" />
        </div>
        <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1) }} className="input w-full sm:w-auto h-10 text-sm">
          <option value="">Tất cả danh mục</option>
          {(cats?.data || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={brandId} onChange={(e) => { setBrandId(e.target.value); setPage(1) }} className="input w-full sm:w-auto h-10 text-sm">
          <option value="">Tất cả thương hiệu</option>
          {(brands?.data?.items || []).map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="input w-full sm:w-auto h-10 text-sm">
          <option value="">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="inactive">Ẩn</option>
        </select>
      </div>

      {isLoading ? <PageLoader /> : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>SKU</th>
                  <th>Danh mục</th>
                  <th>Giá</th>
                  <th>Tồn kho</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p: any) => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex-shrink-0 overflow-hidden">
                          {(p.images?.find((i: any) => i.isPrimary)?.url || p.images?.[0]?.url)
                            ? <img src={p.images.find((i: any) => i.isPrimary)?.url || p.images[0].url} alt="" className="w-full h-full object-cover" />
                            : <ImageIcon size={16} className="m-auto mt-2.5 text-gray-400 dark:text-gray-600" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1 max-w-48">{p.name}</p>
                          {p.brand && <p className="text-xs text-gray-400 dark:text-gray-500">{p.brand.name}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-xs text-gray-500 dark:text-gray-400">{p.sku}</td>
                    <td className="text-gray-600 dark:text-gray-400 text-sm">{p.category?.name || '—'}</td>
                    <td>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(p.comparePrice && p.comparePrice < p.price ? p.comparePrice : p.price)}</p>
                        {p.comparePrice > 0 && p.comparePrice < p.price && <p className="text-xs text-gray-400 line-through">{formatCurrency(p.price)}</p>}
                      </div>
                    </td>
                    <td>
                      <span className={`font-semibold ${p.quantity <= 5 ? 'text-red-600 dark:text-red-400' : p.quantity <= 20 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-700 dark:text-gray-300'}`}>
                        {p.quantity ?? 0}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${p.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                        {p.isActive ? 'Hoạt động' : 'Ẩn'}
                      </span>
                    </td>
                    <td className="text-gray-400 dark:text-gray-500 text-xs">{formatDate(p.createdAt, 'dd/MM/yyyy')}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => navigate(`/products/${p.id}/edit`)}
                          className="p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400 transition-colors">
                          <Edit size={15} />
                        </button>
                        <button onClick={() => setDeleteId(p.id)}
                          className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!products.length && (
                  <tr><td colSpan={8} className="text-center py-12 text-gray-400 dark:text-gray-500">Không tìm thấy sản phẩm</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4">
            <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={15} onChange={setPage} />
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
        loading={deleteMut.isPending}
        title="Xóa sản phẩm" message="Sản phẩm sẽ bị xóa vĩnh viễn. Bạn có chắc chắn?" confirmText="Xóa" />
    </div>
  )
}
