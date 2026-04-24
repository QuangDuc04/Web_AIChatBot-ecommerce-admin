import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi } from '@/api/products.api'
import { reviewsApi } from '@/api/reviews.api'
import { Search, Star, Trash2, MessageSquare } from 'lucide-react'
import { PageLoader } from '@/components/ui/Spinner'
import Spinner from '@/components/ui/Spinner'
import Pagination from '@/components/ui/Pagination'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function ReviewList() {
  const qc = useQueryClient()
  const [selectedProduct, setSelectedProduct] = useState('')
  const [page, setPage] = useState(1)
  const [replyModal, setReplyModal] = useState(false)
  const [selectedReview, setSelectedReview] = useState<any>(null)
  const [replyContent, setReplyContent] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [productSearch, setProductSearch] = useState('')

  const { data: productsData } = useQuery({ queryKey: ['products-all'], queryFn: () => productsApi.list({ limit: 100 }) })
  const products: any[] = productsData?.data?.items || []

  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['reviews', selectedProduct, page],
    queryFn: () => reviewsApi.listByProduct(selectedProduct, { page, limit: 15 }),
    enabled: !!selectedProduct,
  })

  const replyMut = useMutation({
    mutationFn: () => reviewsApi.reply(selectedReview.id, { content: replyContent }),
    onSuccess: () => { toast.success('Đã gửi phản hồi'); qc.invalidateQueries({ queryKey: ['reviews'] }); setReplyModal(false) },
  })
  const deleteMut = useMutation({
    mutationFn: (id: string) => reviewsApi.delete(id),
    onSuccess: () => { toast.success('Đã xóa đánh giá'); qc.invalidateQueries({ queryKey: ['reviews'] }); setDeleteId(null) },
  })

  const reviews: any[] = reviewsData?.data?.items || []
  const meta = reviewsData?.data || { total: 0, totalPages: 1 }
  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Đánh giá sản phẩm</h1></div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
        <div className="card p-5">
          <p className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Chọn sản phẩm</p>
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className="input pl-8 text-sm h-9" placeholder="Tìm sản phẩm..." />
          </div>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {filteredProducts.map((p: any) => (
              <button key={p.id} onClick={() => { setSelectedProduct(p.id); setPage(1) }}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${selectedProduct === p.id ? 'bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400 font-medium' : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          {!selectedProduct ? (
            <div className="card flex items-center justify-center h-64 text-gray-400 dark:text-gray-500 animate-fade-in">
              <div className="text-center">
                <Star size={32} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p>Chọn sản phẩm để xem đánh giá</p>
              </div>
            </div>
          ) : isLoading ? <PageLoader /> : (
            <div className="card">
              <div className="table-container">
                <table>
                  <thead><tr><th>Khách hàng</th><th>Đánh giá</th><th>Nội dung</th><th>Phản hồi</th><th>Ngày</th><th></th></tr></thead>
                  <tbody>
                    {reviews.map((r: any) => (
                      <tr key={r.id}>
                        <td>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{r.customer?.firstName} {r.customer?.lastName}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{r.customer?.email}</p>
                        </td>
                        <td>
                          <div className="flex items-center gap-0.5">
                            {[1,2,3,4,5].map((s) => (
                              <Star key={s} size={14} className={s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-gray-700 fill-gray-200 dark:fill-gray-700'} />
                            ))}
                          </div>
                        </td>
                        <td className="max-w-48">
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{r.comment}</p>
                        </td>
                        <td>
                          {r.replies?.length > 0
                            ? <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-lg">Đã phản hồi</span>
                            : <span className="text-xs text-gray-400 dark:text-gray-500">Chưa phản hồi</span>}
                        </td>
                        <td className="text-xs text-gray-400 dark:text-gray-500">{formatDate(r.createdAt, 'dd/MM/yyyy')}</td>
                        <td>
                          <div className="flex gap-1">
                            <button onClick={() => { setSelectedReview(r); setReplyContent(''); setReplyModal(true) }}
                              className="p-1.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400 transition-colors"><MessageSquare size={14} /></button>
                            <button onClick={() => setDeleteId(r.id)} className="p-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 dark:text-red-400 transition-colors"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!reviews.length && <tr><td colSpan={6} className="text-center py-12 text-gray-400 dark:text-gray-500 animate-fade-in">Chưa có đánh giá</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="p-4"><Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={15} onChange={setPage} /></div>
            </div>
          )}
        </div>
      </div>

      <Modal open={replyModal} onClose={() => setReplyModal(false)} title="Phản hồi đánh giá" size="sm"
        footer={<div className="flex gap-3 justify-end"><button onClick={() => setReplyModal(false)} className="btn-secondary">Hủy</button><button onClick={() => replyMut.mutate()} disabled={replyMut.isPending || !replyContent} className="btn-primary">{replyMut.isPending ? <Spinner className="w-4 h-4" /> : 'Gửi phản hồi'}</button></div>}>
        {selectedReview && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
              <div className="flex items-center gap-1 mb-1">
                {[1,2,3,4,5].map((s) => <Star key={s} size={12} className={s <= selectedReview.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-gray-700 fill-gray-200 dark:fill-gray-700'} />)}
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{selectedReview.comment}</p>
            </div>
            <div>
              <label className="label">Nội dung phản hồi</label>
              <textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)} className="input resize-none" rows={4} placeholder="Nhập phản hồi của bạn..." />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)} loading={deleteMut.isPending}
        title="Xóa đánh giá" message="Xóa đánh giá này vĩnh viễn?" confirmText="Xóa" />
    </div>
  )
}
