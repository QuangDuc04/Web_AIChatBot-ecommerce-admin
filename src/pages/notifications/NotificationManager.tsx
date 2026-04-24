import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { notificationsApi } from '@/api/notifications.api'
import { Send, Users, User } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'
import toast from 'react-hot-toast'

export default function NotificationManager() {
  const [tab, setTab] = useState<'single' | 'bulk'>('single')
  const [form, setForm] = useState({ userId: '', title: '', message: '', type: 'info', url: '' })
  const [bulkForm, setBulkForm] = useState({ title: '', message: '', type: 'info', url: '', role: '' })

  const singleMut = useMutation({
    mutationFn: () => notificationsApi.create({ userId: form.userId || undefined, title: form.title, message: form.message, type: form.type, url: form.url || undefined }),
    onSuccess: () => { toast.success('Đã gửi thông báo'); setForm({ userId: '', title: '', message: '', type: 'info', url: '' }) },
  })
  const bulkMut = useMutation({
    mutationFn: () => notificationsApi.bulk({ title: bulkForm.title, message: bulkForm.message, type: bulkForm.type, url: bulkForm.url || undefined, role: bulkForm.role || undefined }),
    onSuccess: () => { toast.success('Đã gửi thông báo hàng loạt'); setBulkForm({ title: '', message: '', type: 'info', url: '', role: '' }) },
  })

  const TYPES = [{ value: 'info', label: 'Thông tin' }, { value: 'success', label: 'Thành công' }, { value: 'warning', label: 'Cảnh báo' }, { value: 'error', label: 'Lỗi' }, { value: 'order', label: 'Đơn hàng' }, { value: 'promotion', label: 'Khuyến mãi' }]

  return (
    <div className="space-y-5 max-w-2xl">
      <div><h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Gửi thông báo</h1></div>

      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        <button onClick={() => setTab('single')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'single' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
          <User size={16} /> Gửi cho người dùng
        </button>
        <button onClick={() => setTab('bulk')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'bulk' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
          <Users size={16} /> Gửi hàng loạt
        </button>
      </div>

      {tab === 'single' ? (
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Gửi thông báo đến người dùng cụ thể</h2>
          <div><label className="label">ID Người dùng (để trống = tất cả)</label><input value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} className="input" placeholder="UUID của người dùng" /></div>
          <div><label className="label">Tiêu đề *</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" placeholder="Tiêu đề thông báo" /></div>
          <div><label className="label">Nội dung *</label><textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="input resize-none" rows={3} placeholder="Nội dung thông báo..." /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Loại thông báo</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input">{TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
            <div><label className="label">Link (tùy chọn)</label><input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="input" placeholder="/orders/123" /></div>
          </div>
          <button onClick={() => singleMut.mutate()} disabled={singleMut.isPending || !form.title || !form.message || !form.userId} className="btn-primary">
            {singleMut.isPending ? <Spinner className="w-4 h-4" /> : <><Send size={16} /> Gửi thông báo</>}
          </button>
        </div>
      ) : (
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Gửi thông báo hàng loạt</h2>
          <div><label className="label">Nhóm người dùng</label><select value={bulkForm.role} onChange={(e) => setBulkForm({ ...bulkForm, role: e.target.value })} className="input"><option value="">Tất cả người dùng</option><option value="customer">Khách hàng</option><option value="staff">Nhân viên</option><option value="admin">Admin</option></select></div>
          <div><label className="label">Tiêu đề *</label><input value={bulkForm.title} onChange={(e) => setBulkForm({ ...bulkForm, title: e.target.value })} className="input" placeholder="Tiêu đề thông báo" /></div>
          <div><label className="label">Nội dung *</label><textarea value={bulkForm.message} onChange={(e) => setBulkForm({ ...bulkForm, message: e.target.value })} className="input resize-none" rows={4} placeholder="Nội dung thông báo..." /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Loại thông báo</label><select value={bulkForm.type} onChange={(e) => setBulkForm({ ...bulkForm, type: e.target.value })} className="input">{TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
            <div><label className="label">Link (tùy chọn)</label><input value={bulkForm.url} onChange={(e) => setBulkForm({ ...bulkForm, url: e.target.value })} className="input" placeholder="/flash-sales" /></div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-sm text-amber-800 dark:text-amber-400">
            Thông báo hàng loạt sẽ được gửi đến {bulkForm.role ? `tất cả ${bulkForm.role}` : 'tất cả người dùng'} trong hệ thống.
          </div>
          <button onClick={() => bulkMut.mutate()} disabled={bulkMut.isPending || !bulkForm.title || !bulkForm.message} className="btn-primary">
            {bulkMut.isPending ? <Spinner className="w-4 h-4" /> : <><Send size={16} /> Gửi hàng loạt</>}
          </button>
        </div>
      )}
    </div>
  )
}
