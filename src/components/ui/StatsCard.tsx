import { ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  title: string
  value: string | number
  icon: ReactNode
  iconBg?: string
  change?: number
  changeSuffix?: string
  subtitle?: string
}

export default function StatsCard({ title, value, icon, iconBg = 'bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-400', change, subtitle }: Props) {
  return (
    <div className="card-hover p-6 group">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium truncate">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white truncate tracking-tight">{value}</p>
          {change !== undefined && (
            <div className={cn(
              'flex items-center gap-1.5 mt-2 text-xs font-semibold',
              change > 0 ? 'text-emerald-600 dark:text-emerald-400'
                : change < 0 ? 'text-red-500 dark:text-red-400'
                : 'text-gray-400'
            )}>
              <div className={cn(
                'flex items-center justify-center w-5 h-5 rounded-md',
                change > 0 ? 'bg-emerald-100 dark:bg-emerald-900/30'
                  : change < 0 ? 'bg-red-100 dark:bg-red-900/30'
                  : 'bg-gray-100 dark:bg-gray-800'
              )}>
                {change > 0 ? <TrendingUp size={11} /> : change < 0 ? <TrendingDown size={11} /> : <Minus size={11} />}
              </div>
              <span>{change > 0 ? '+' : ''}{change}% so với tháng trước</span>
            </div>
          )}
          {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">{subtitle}</p>}
        </div>
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ml-4',
          'transition-transform duration-300 group-hover:scale-110',
          iconBg
        )}>
          {icon}
        </div>
      </div>
    </div>
  )
}
