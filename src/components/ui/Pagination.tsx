import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  page: number
  totalPages: number
  total: number
  limit: number
  onChange: (page: number) => void
}

export default function Pagination({ page, totalPages, total, limit, onChange }: Props) {
  if (totalPages <= 1) return null
  const from = (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  const pages: (number | '...')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 mt-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Hiển thị{' '}
        <span className="font-semibold text-gray-700 dark:text-gray-300">{from}–{to}</span>
        {' / '}
        <span className="font-semibold text-gray-700 dark:text-gray-300">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page === 1}
          className={cn(
            'p-2.5 rounded-xl transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center',
            'hover:bg-gray-100 dark:hover:bg-gray-800',
            'disabled:opacity-30 disabled:cursor-not-allowed'
          )}>
          <ChevronLeft size={16} className="text-gray-600 dark:text-gray-400" />
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`e-${i}`} className="px-2 py-1.5 text-sm text-gray-400 dark:text-gray-500">...</span>
          ) : (
            <button key={p} onClick={() => onChange(p as number)}
              className={cn(
                'min-w-[40px] h-10 rounded-xl text-sm font-medium transition-all duration-200',
                p === page
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-500/25 dark:bg-primary-500'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}>
              {p}
            </button>
          )
        )}
        <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
          className={cn(
            'p-2.5 rounded-xl transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center',
            'hover:bg-gray-100 dark:hover:bg-gray-800',
            'disabled:opacity-30 disabled:cursor-not-allowed'
          )}>
          <ChevronRight size={16} className="text-gray-600 dark:text-gray-400" />
        </button>
      </div>
    </div>
  )
}
