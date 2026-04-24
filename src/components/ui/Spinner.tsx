import { cn } from '@/lib/utils'

export default function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn(
      'inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin',
      className
    )} />
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64 animate-fade-in">
      <div className="text-center">
        <div className="relative">
          <div className="w-10 h-10 border-3 border-primary-200 dark:border-primary-900 rounded-full" />
          <div className="absolute inset-0 w-10 h-10 border-3 border-primary-600 dark:border-primary-400 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 font-medium">Đang tải...</p>
      </div>
    </div>
  )
}
