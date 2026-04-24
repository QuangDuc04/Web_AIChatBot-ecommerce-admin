import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'
import Spinner from './Spinner'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
  confirmText?: string
  loading?: boolean
  variant?: 'danger' | 'warning'
}

export default function ConfirmDialog({
  open, onClose, onConfirm, title = 'Xác nhận', message = 'Bạn có chắc chắn muốn thực hiện hành động này?',
  confirmText = 'Xác nhận', loading, variant = 'danger',
}: Props) {
  return (
    <Modal open={open} onClose={onClose} size="sm"
      footer={
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary" disabled={loading}>Hủy</button>
          <button onClick={onConfirm} disabled={loading}
            className={variant === 'danger' ? 'btn-danger' : 'btn bg-amber-600 text-white hover:bg-amber-700 shadow-md shadow-amber-500/25'}>
            {loading ? <Spinner className="w-4 h-4" /> : confirmText}
          </button>
        </div>
      }>
      <div className="flex gap-4">
        <div className={cn(
          'flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center',
          variant === 'danger'
            ? 'bg-red-100 dark:bg-red-900/30'
            : 'bg-amber-100 dark:bg-amber-900/30'
        )}>
          <AlertTriangle size={24} className={cn(
            variant === 'danger'
              ? 'text-red-600 dark:text-red-400'
              : 'text-amber-600 dark:text-amber-400'
          )} />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
        </div>
      </div>
    </Modal>
  )
}
