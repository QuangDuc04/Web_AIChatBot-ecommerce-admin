import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contactsApi } from '@/api/contacts.api'
import { Search, Trash2, Eye, Mail, Phone, Clock, FileText, MessageSquare, X } from 'lucide-react'
import { PageLoader } from '@/components/ui/Spinner'
import Pagination from '@/components/ui/Pagination'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Modal from '@/components/ui/Modal'
import { useDebounce } from '@/hooks/useDebounce'
import { formatDate, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function ContactList() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const dSearch = useDebounce(search, 400)

  const [detailItem, setDetailItem] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', page, dSearch, typeFilter, statusFilter],
    queryFn: () => contactsApi.list({
      page, limit: 15,
      search: dSearch || undefined,
      type: typeFilter || undefined,
      status: statusFilter || undefined,
    }),
  })
  const contacts: any[] = data?.data?.items || data?.data || []
  const meta = data?.data || { total: 0, totalPages: 1 }

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => contactsApi.updateStatus(id, data),
    onSuccess: () => {
      toast.success('Đã cập nhật')
      qc.invalidateQueries({ queryKey: ['contacts'] })
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => contactsApi.delete(id),
    onSuccess: () => {
      toast.success('Đã xóa')
      qc.invalidateQueries({ queryKey: ['contacts'] })
      setDeleteId(null)
    },
  })

  const handleView = (item: any) => {
    setDetailItem(item)
    if (item.status === 'new' || !item.status) {
      updateMut.mutate({ id: item.id, data: { status: 'read' } })
    }
  }

  const handleUpdateStatus = (id: string, status: string) => {
    updateMut.mutate({ id, data: { status } })
    if (detailItem?.id === id) {
      setDetailItem((prev: any) => ({ ...prev, status }))
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'read': return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
      case 'replied': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'closed': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      default: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    }
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'Mới'
      case 'read': return 'Đã đọc'
      case 'replied': return 'Đã phản hồi'
      case 'closed': return 'Lưu trữ'
      default: return 'Mới'
    }
  }

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Liên hệ & Báo giá</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{meta.total || contacts.length} liên hệ</p>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-0 sm:min-w-48">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Tìm theo tên, email, SĐT..." className="input pl-10 text-sm h-10" />
        </div>
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }} className="input w-full sm:w-auto h-10 text-sm">
          <option value="">Tất cả loại</option>
          <option value="contact">Liên hệ</option>
          <option value="quote">Báo giá</option>
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="input w-full sm:w-auto h-10 text-sm">
          <option value="">Tất cả trạng thái</option>
          <option value="new">Mới</option>
          <option value="read">Đã đọc</option>
          <option value="replied">Đã phản hồi</option>
          <option value="archived">Lưu trữ</option>
        </select>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Người gửi</th>
                <th>Loại</th>
                <th>Nội dung</th>
                <th>Ngày gửi</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c: any) => (
                <tr key={c.id} className={cn(!c.status || c.status === 'new' ? 'bg-primary-50/30 dark:bg-primary-950/10' : '')}>
                  <td>
                    <div>
                      <p className={cn(
                        'text-sm text-gray-900 dark:text-white',
                        (!c.status || c.status === 'new') && 'font-semibold',
                      )}>{c.name}</p>
                      <div className="flex flex-col gap-0.5 mt-1">
                        {c.email && (
                          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <Mail size={11} /> {c.email}
                          </span>
                        )}
                        {c.phone && (
                          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <Phone size={11} /> {c.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={cn(
                      'badge',
                      c.type === 'quote'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        : 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
                    )}>
                      {c.type === 'quote' ? (
                        <><MessageSquare size={12} className="mr-1 inline" />Báo giá</>
                      ) : (
                        <><FileText size={12} className="mr-1 inline" />Liên hệ</>
                      )}
                    </span>
                  </td>
                  <td>
                    <p className="text-sm text-gray-600 dark:text-gray-400 max-w-[280px] truncate">
                      {c.subject || c.content?.slice(0, 80) || '—'}
                    </p>
                  </td>
                  <td>
                    <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                      <Clock size={13} /> {c.createdAt ? formatDate(c.createdAt) : '—'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${statusBadge(c.status || 'new')}`}>
                      {statusLabel(c.status || 'new')}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => handleView(c)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400 transition-colors">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => setDeleteId(c.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 dark:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!contacts.length && (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-gray-400 dark:text-gray-500 animate-fade-in">
                    Chưa có liên hệ nào
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

      {/* Detail Modal */}
      <Modal open={!!detailItem} onClose={() => setDetailItem(null)} title="Chi tiết liên hệ" size="lg"
        footer={
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {detailItem?.status !== 'replied' && (
                <button onClick={() => handleUpdateStatus(detailItem.id, 'replied')} className="btn-primary text-sm">
                  Đánh dấu đã phản hồi
                </button>
              )}
              {detailItem?.status !== 'closed' && (
                <button onClick={() => handleUpdateStatus(detailItem.id, 'closed')} className="btn-secondary text-sm">
                  Lưu trữ
                </button>
              )}
            </div>
            <button onClick={() => setDetailItem(null)} className="btn-secondary text-sm">Đóng</button>
          </div>
        }>
        {detailItem && (
          <div className="space-y-5">
            {/* Type + Status */}
            <div className="flex items-center gap-2">
              <span className={cn(
                'badge',
                detailItem.type === 'quote'
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                  : 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
              )}>
                {detailItem.type === 'quote' ? 'Yêu cầu báo giá' : 'Liên hệ'}
              </span>
              <span className={`badge ${statusBadge(detailItem.status || 'new')}`}>
                {statusLabel(detailItem.status || 'new')}
              </span>
            </div>

            {/* Sender info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Họ tên</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{detailItem.name}</p>
              </div>
              {detailItem.email && (
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Email</p>
                  <a href={`mailto:${detailItem.email}`} className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                    {detailItem.email}
                  </a>
                </div>
              )}
              {detailItem.phone && (
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Số điện thoại</p>
                  <a href={`tel:${detailItem.phone}`} className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                    {detailItem.phone}
                  </a>
                </div>
              )}
              {detailItem.company && (
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Công ty</p>
                  <p className="text-sm text-gray-900 dark:text-white">{detailItem.company}</p>
                </div>
              )}
              {detailItem.createdAt && (
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Ngày gửi</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{formatDate(detailItem.createdAt)}</p>
                </div>
              )}
            </div>

            {/* Subject */}
            {detailItem.subject && (
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Tiêu đề</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{detailItem.subject}</p>
              </div>
            )}

            {/* Content */}
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Nội dung</p>
              <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {detailItem.content || 'Không có nội dung'}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)} loading={deleteMut.isPending}
        title="Xóa liên hệ" message="Xóa liên hệ này? Hành động không thể hoàn tác." confirmText="Xóa" />
    </div>
  )
}
