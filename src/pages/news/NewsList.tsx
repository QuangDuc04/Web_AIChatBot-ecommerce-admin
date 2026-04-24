import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { newsApi } from '@/api/news.api'
import { Plus, Edit, Trash2, Upload, FileText, Search, Eye, PenLine, List } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Spinner, { PageLoader } from '@/components/ui/Spinner'
import RichTextEditor from '@/components/ui/RichTextEditor'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'

interface TocItem { id: string; text: string; level: number }

function extractToc(html: string): TocItem[] {
  if (!html) return []
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const headings = doc.querySelectorAll('h1, h2, h3, h4')
  const items: TocItem[] = []
  headings.forEach((h, i) => {
    const text = h.textContent?.trim() || ''
    if (!text) return
    const level = parseInt(h.tagName[1])
    items.push({ id: `heading-${i}`, text, level })
  })
  return items
}

function injectHeadingIds(html: string): string {
  if (!html) return ''
  let idx = 0
  return html.replace(/<(h[1-4])([^>]*)>/gi, (match, tag, attrs) => {
    const id = `heading-${idx++}`
    if (attrs.includes('id=')) return match
    return `<${tag}${attrs} id="${id}">`
  })
}

export default function NewsList() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [imgFile, setImgFile] = useState<File | null>(null)
  const [imgPreview, setImgPreview] = useState('')
  const [content, setContent] = useState('')
  const [editorTab, setEditorTab] = useState<'edit' | 'preview'>('edit')
  const [previewItem, setPreviewItem] = useState<any>(null)
  const { register, handleSubmit, reset, setValue, getValues, formState: {} } = useForm<any>({ defaultValues: { isActive: true, displayOrder: 0 } })

  const { data, isLoading } = useQuery({ queryKey: ['news', search], queryFn: () => newsApi.list({ search: search || undefined }) })
  const newsList: any[] = data?.data?.items || []

  const saveMut = useMutation({
    mutationFn: (d: any) => {
      const fd = new FormData()
      Object.entries(d).forEach(([k, v]) => { if (v !== undefined && v !== '') fd.append(k, v as string) })
      fd.set('content', content)
      if (imgFile) fd.append('image', imgFile)
      return editItem ? newsApi.update(editItem.id, fd) : newsApi.create(fd)
    },
    onSuccess: () => { toast.success(editItem ? 'Đã cập nhật bài viết' : 'Đã tạo bài viết'); qc.invalidateQueries({ queryKey: ['news'] }); closeModal() },
    onError: (e: any) => { toast.error(e?.response?.data?.message || 'Có lỗi xảy ra') },
  })
  const deleteMut = useMutation({
    mutationFn: (id: string) => newsApi.delete(id),
    onSuccess: () => { toast.success('Đã xóa bài viết'); qc.invalidateQueries({ queryKey: ['news'] }); setDeleteId(null) },
  })

  const openModal = (item?: any) => {
    setEditItem(item || null); setImgFile(null); setImgPreview(item?.thumbnail || ''); setContent(item?.content || ''); setEditorTab('edit')
    if (item) { setValue('title', item.title ?? ''); setValue('summary', item.summary ?? ''); setValue('author', item.author ?? ''); setValue('isActive', item.isActive ?? true); setValue('displayOrder', item.displayOrder ?? 0); setValue('publishedAt', item.publishedAt ? item.publishedAt.slice(0, 16) : ''); setValue('tags', Array.isArray(item.tags) ? item.tags.join(', ') : '') }
    else reset({ isActive: true, displayOrder: 0 })
    setModalOpen(true)
  }
  const closeModal = () => { setModalOpen(false); setEditItem(null); reset(); setImgFile(null); setImgPreview(''); setContent(''); setEditorTab('edit') }

  const editorToc = useMemo(() => extractToc(content), [content])
  const previewToc = useMemo(() => extractToc(previewItem?.content || ''), [previewItem])
  const previewHtml = useMemo(() => injectHeadingIds(previewItem?.content || ''), [previewItem])

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Tin tức</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{newsList.length} bài viết</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary"><Plus size={16} /> Thêm bài viết</button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Tìm kiếm bài viết..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {newsList.map((n: any) => (
          <div key={n.id} className="card overflow-hidden group hover:shadow-card-hover dark:hover:shadow-card-dark-hover hover:-translate-y-1 transition-all duration-300 rounded-xl">
            <div className="relative aspect-[2/1] bg-gray-100 dark:bg-gray-800 overflow-hidden">
              {n.thumbnail ? <img src={n.thumbnail} alt={n.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                : <div className="w-full h-full flex items-center justify-center"><FileText size={28} className="text-gray-300 dark:text-gray-600" /></div>}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                <button onClick={() => setPreviewItem(n)} className="w-8 h-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-colors" title="Xem trước"><Eye size={14} className="text-gray-700 dark:text-gray-300" /></button>
                <button onClick={() => openModal(n)} className="w-8 h-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-colors" title="Chỉnh sửa"><Edit size={14} className="text-gray-700 dark:text-gray-300" /></button>
                <button onClick={() => setDeleteId(n.id)} className="w-8 h-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors" title="Xóa"><Trash2 size={14} className="text-red-500 dark:text-red-400" /></button>
              </div>
              <div className="absolute top-2 left-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold backdrop-blur-sm ${n.isActive ? 'bg-emerald-500/90 text-white' : 'bg-gray-800/70 text-gray-200'}`}>
                  {n.isActive ? 'Hoạt động' : 'Ẩn'}
                </span>
              </div>
            </div>
            <div className="p-3">
              <p className="font-semibold text-[13px] text-gray-900 dark:text-white truncate leading-snug">{n.title || 'Không có tiêu đề'}</p>
              {n.summary && <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1 leading-relaxed">{n.summary}</p>}
              <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-gray-400 dark:text-gray-500">
                {n.author && <><span className="font-medium text-gray-500 dark:text-gray-400">{n.author}</span><span>·</span></>}
                <span>{formatDate(n.createdAt)}</span>
              </div>
              {n.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {n.tags.map((tag: string, i: number) => (
                    <span key={i} className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-md font-medium">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {!newsList.length && <div className="col-span-full text-center py-16 text-gray-400 dark:text-gray-500 animate-fade-in">Chưa có bài viết</div>}
      </div>

      {/* Modal Create/Edit */}
      <Modal open={modalOpen} onClose={closeModal} title={editItem ? 'Chỉnh sửa bài viết' : 'Thêm bài viết mới'} size="full"
        footer={<div className="flex gap-3 justify-end"><button onClick={closeModal} className="btn-secondary">Hủy</button><button form="news-form" type="submit" disabled={saveMut.isPending} className="btn-primary min-w-[80px]">{saveMut.isPending ? <><Spinner className="w-4 h-4" /> Đang lưu...</> : 'Lưu'}</button></div>}>
        <form id="news-form" onSubmit={handleSubmit((d) => saveMut.mutate(d))} className={`transition-opacity ${saveMut.isPending ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="col-span-full lg:col-span-4 space-y-4">
              <div>
                <label className="label">Ảnh đại diện</label>
                <div className="relative aspect-[16/9] bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 transition-colors">
                  {imgPreview ? <img src={imgPreview} alt="" className="w-full h-full object-cover" /> : (
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <Upload size={28} className="text-gray-400 dark:text-gray-600" />
                      <p className="text-sm text-gray-400 dark:text-gray-500">Nhấn để tải ảnh lên</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setImgFile(f); setImgPreview(URL.createObjectURL(f)) } }}
                    className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>
              <div><label className="label">Tiêu đề *</label><input {...register('title')} className="input" placeholder="Tiêu đề bài viết" /></div>
              <div><label className="label">Tóm tắt</label><textarea {...register('summary')} className="input" placeholder="Mô tả ngắn gọn..." rows={2} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Tác giả</label><input {...register('author')} className="input" placeholder="Tên tác giả" /></div>
                <div><label className="label">Tags</label><input {...register('tags')} className="input" placeholder="tag1, tag2" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="label">Ngày xuất bản</label><input {...register('publishedAt')} type="datetime-local" className="input" /></div>
                <div><label className="label">Thứ tự</label><input {...register('displayOrder')} type="number" className="input" /></div>
                <div><label className="label">Trạng thái</label><select {...register('isActive')} className="input"><option value="true">Hoạt động</option><option value="false">Ẩn</option></select></div>
              </div>
              {editorToc.length > 0 && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-2 mb-3"><List size={16} className="text-gray-500 dark:text-gray-400" /><span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Mục lục</span></div>
                  <nav className="space-y-1">
                    {editorToc.map((item) => (
                      <div key={item.id} style={{ paddingLeft: `${(item.level - 2) * 12}px` }} className="text-sm text-gray-600 dark:text-gray-400 cursor-default truncate py-0.5">
                        {item.level === 2 && <span className="font-medium">{item.text}</span>}
                        {item.level === 3 && <span className="text-gray-500 dark:text-gray-400">{item.text}</span>}
                        {item.level >= 4 && <span className="text-gray-400 dark:text-gray-500 text-xs">{item.text}</span>}
                      </div>
                    ))}
                  </nav>
                </div>
              )}
            </div>
            <div className="col-span-full lg:col-span-8">
              <div className="flex items-center gap-1 mb-3 border-b border-gray-200 dark:border-gray-700">
                <button type="button" onClick={() => setEditorTab('edit')}
                  className={cn('flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                    editorTab === 'edit' ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300')}>
                  <PenLine size={15} /> Soạn thảo
                </button>
                <button type="button" onClick={() => setEditorTab('preview')}
                  className={cn('flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                    editorTab === 'preview' ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300')}>
                  <Eye size={15} /> Xem trước
                </button>
              </div>
              {editorTab === 'edit' ? (
                <RichTextEditor value={content} onChange={setContent} placeholder="Nội dung bài viết..." minHeight={450} />
              ) : (
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 px-5 py-3">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{getValues('title') || 'Chưa có tiêu đề'}</h2>
                    {getValues('author') && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{getValues('author')}</p>}
                  </div>
                  <div className="p-5 max-h-[60vh] overflow-y-auto">
                    {editorToc.length > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-5">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2"><List size={15} /> Mục lục</p>
                        <nav className="space-y-1">
                          {editorToc.map((item) => (
                            <div key={item.id} style={{ paddingLeft: `${(item.level - 2) * 16}px` }} className="py-0.5">
                              <span className={cn('text-sm hover:text-primary-600 dark:hover:text-primary-400 cursor-default',
                                item.level === 2 ? 'font-medium text-gray-800 dark:text-gray-200' : item.level === 3 ? 'text-gray-600 dark:text-gray-400' : 'text-gray-500 dark:text-gray-500 text-xs')}>
                                {item.text}
                              </span>
                            </div>
                          ))}
                        </nav>
                      </div>
                    )}
                    {content ? <div className="rich-preview" dangerouslySetInnerHTML={{ __html: injectHeadingIds(content) }} /> : <p className="text-gray-400 dark:text-gray-500 text-center py-12">Chưa có nội dung</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      <Modal open={!!previewItem} onClose={() => setPreviewItem(null)} title={previewItem?.title || 'Xem trước'} size="full">
        {previewItem && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="col-span-full lg:col-span-3">
              {previewItem.thumbnail && <img src={previewItem.thumbnail} alt="" className="w-full rounded-xl mb-4" />}
              <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1 mb-4">
                {previewItem.author && <p>Tác giả: <span className="font-medium text-gray-700 dark:text-gray-300">{previewItem.author}</span></p>}
                <p>Ngày tạo: <span className="font-medium text-gray-700 dark:text-gray-300">{formatDate(previewItem.createdAt)}</span></p>
                {previewItem.publishedAt && <p>Xuất bản: <span className="font-medium text-gray-700 dark:text-gray-300">{formatDate(previewItem.publishedAt)}</span></p>}
                <p>Trạng thái: <span className={`badge ${previewItem.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>{previewItem.isActive ? 'Hoạt động' : 'Ẩn'}</span></p>
              </div>
              {previewItem.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {previewItem.tags.map((tag: string, i: number) => <span key={i} className="text-xs bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400 px-2 py-0.5 rounded-full">{tag}</span>)}
                </div>
              )}
              {previewToc.length > 0 && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-800/50 sticky top-0">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2"><List size={15} /> Mục lục</p>
                  <nav className="space-y-1">
                    {previewToc.map((item) => (
                      <a key={item.id} href={`#${item.id}`} style={{ paddingLeft: `${(item.level - 2) * 12}px` }}
                        className={cn('block text-sm py-0.5 hover:text-primary-600 dark:hover:text-primary-400 transition-colors',
                          item.level === 2 ? 'font-medium text-gray-800 dark:text-gray-200' : item.level === 3 ? 'text-gray-600 dark:text-gray-400' : 'text-gray-500 dark:text-gray-500 text-xs')}>
                        {item.text}
                      </a>
                    ))}
                  </nav>
                </div>
              )}
            </div>
            <div className="col-span-full lg:col-span-9">
              {previewItem.summary && <p className="text-gray-600 dark:text-gray-400 text-sm border-l-4 border-primary-300 dark:border-primary-600 pl-4 mb-5 italic">{previewItem.summary}</p>}
              {previewItem.content ? <div className="rich-preview" dangerouslySetInnerHTML={{ __html: previewHtml }} /> : <p className="text-gray-400 dark:text-gray-500 text-center py-12">Bài viết chưa có nội dung</p>}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)} loading={deleteMut.isPending}
        title="Xóa bài viết" message="Bạn có chắc muốn xóa bài viết này?" confirmText="Xóa" />
    </div>
  )
}
