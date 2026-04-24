import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsApi } from '@/api/settings.api'
import { Save, RefreshCw } from 'lucide-react'
import { PageLoader } from '@/components/ui/Spinner'
import Spinner from '@/components/ui/Spinner'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

const SETTING_GROUPS = [
  { key: 'general', label: 'Chung', fields: ['site_name', 'site_description', 'contact_email', 'contact_phone', 'address'] },
  { key: 'payment', label: 'Thanh toán', fields: ['payment_methods', 'vnpay_terminal_id', 'momo_partner_code', 'cod_enabled'] },
  { key: 'shipping', label: 'Vận chuyển', fields: ['free_shipping_threshold', 'default_shipping_fee', 'shipping_providers'] },
  { key: 'email', label: 'Email', fields: ['email_sender_name', 'email_sender_address', 'smtp_host', 'smtp_port'] },
]

export default function SettingsPage() {
  const qc = useQueryClient()
  const [activeGroup, setActiveGroup] = useState('general')
  const [editedValues, setEditedValues] = useState<Record<string, string>>({})

  const { data, isLoading } = useQuery({ queryKey: ['settings'], queryFn: settingsApi.list })
  const settings: any[] = data?.data || []

  const settingMap = settings.reduce((acc, s) => { acc[s.key] = s.value; return acc }, {} as Record<string, string>)

  const bulkMut = useMutation({
    mutationFn: () => settingsApi.bulkUpdate(editedValues),
    onSuccess: () => { toast.success('Đã lưu cài đặt'); qc.invalidateQueries({ queryKey: ['settings'] }); setEditedValues({}) },
  })

  const getValue = (key: string) => editedValues[key] !== undefined ? editedValues[key] : (settingMap[key] ?? '')
  const setValue = (key: string, value: string) => setEditedValues((p) => ({ ...p, [key]: value }))

  const activeFields = SETTING_GROUPS.find((g) => g.key === activeGroup)?.fields || []
  const allGroupSettings = settings.filter((s) => activeFields.includes(s.key))
  const extraSettings = settings.filter((s) => !SETTING_GROUPS.flatMap((g) => g.fields).includes(s.key))

  const formatKey = (key: string) => key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  const renderField = (key: string, value: string) => {
    const isLong = value?.length > 60 || key.includes('description') || key.includes('address')
    const isBool = value === 'true' || value === 'false'
    if (isBool) return (
      <select value={getValue(key)} onChange={(e) => setValue(key, e.target.value)} className="input">
        <option value="true">Bật</option>
        <option value="false">Tắt</option>
      </select>
    )
    if (isLong) return (
      <textarea value={getValue(key)} onChange={(e) => setValue(key, e.target.value)} className="input resize-none" rows={3} />
    )
    return <input value={getValue(key)} onChange={(e) => setValue(key, e.target.value)} className="input" />
  }

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Cài đặt hệ thống</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setEditedValues({})} className="btn-secondary btn-sm">
            <RefreshCw size={14} /> Đặt lại
          </button>
          <button onClick={() => bulkMut.mutate()} disabled={bulkMut.isPending || Object.keys(editedValues).length === 0} className="btn-primary">
            {bulkMut.isPending ? <Spinner className="w-4 h-4" /> : <><Save size={16} /> Lưu cài đặt</>}
          </button>
        </div>
      </div>

      {Object.keys(editedValues).length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-2.5 text-sm text-blue-700 dark:text-blue-400 animate-fade-in">
          {Object.keys(editedValues).length} thay đổi chưa được lưu
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Tabs trên mobile, sidebar trên desktop */}
        <div className="lg:w-48 flex-shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 lg:space-y-1">
            {SETTING_GROUPS.map((g) => (
              <button key={g.key} onClick={() => setActiveGroup(g.key)}
                className={cn(
                  'whitespace-nowrap text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px]',
                  activeGroup === g.key
                    ? 'bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                )}>
                {g.label}
              </button>
            ))}
            <button onClick={() => setActiveGroup('other')}
              className={cn(
                'whitespace-nowrap text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px]',
                activeGroup === 'other'
                  ? 'bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}>
              Khác
            </button>
          </div>
        </div>

        {/* Settings Form */}
        <div className="flex-1 card p-5 sm:p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-5">{SETTING_GROUPS.find((g) => g.key === activeGroup)?.label || 'Cài đặt khác'}</h2>
          <div className="space-y-5">
            {(activeGroup === 'other' ? extraSettings : allGroupSettings).map((s: any) => (
              <div key={s.key}>
                <label className="label">{s.label || formatKey(s.key)}</label>
                {renderField(s.key, s.value)}
                {s.description && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">{s.description}</p>}
              </div>
            ))}
            {activeGroup !== 'other' && activeFields.filter((f) => !allGroupSettings.find((s) => s.key === f)).map((key) => (
              <div key={key}>
                <label className="label">{formatKey(key)}</label>
                <input value={getValue(key)} onChange={(e) => setValue(key, e.target.value)} className="input" placeholder={`Nhập ${formatKey(key).toLowerCase()}...`} />
              </div>
            ))}
            {activeGroup === 'other' && !extraSettings.length && (
              <p className="text-gray-400 dark:text-gray-500 text-sm animate-fade-in">Không có cài đặt nào trong nhóm này.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
