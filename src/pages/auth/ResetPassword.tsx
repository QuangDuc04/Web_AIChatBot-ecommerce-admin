import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Lock, CheckCircle, XCircle } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { authApi } from '@/api/auth.api'
import Spinner from '@/components/ui/Spinner'

const schema = z.object({
  newPassword: z.string()
    .min(8, 'Mật khẩu tối thiểu 8 ký tự')
    .regex(/[a-z]/, 'Cần ít nhất 1 chữ thường')
    .regex(/[A-Z]/, 'Cần ít nhất 1 chữ hoa')
    .regex(/\d/, 'Cần ít nhất 1 chữ số')
    .regex(/[@$!%*?&]/, 'Cần ít nhất 1 ký tự đặc biệt (@$!%*?&)'),
  confirmPassword: z.string().min(1, 'Xác nhận mật khẩu'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Mật khẩu không khớp',
  path: ['confirmPassword'],
})
type FormData = z.infer<typeof schema>

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [success, setSuccess] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  if (!token) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-900 dark:from-gray-950 dark:via-primary-950 dark:to-gray-950" />
        <div className="w-full max-w-md relative z-10 animate-fade-in-up">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-xl rounded-2xl mb-4 border border-white/20 shadow-glow p-2">
              <img src="/assets/logos/logo.png" alt="Halo" className="h-full w-auto object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Halo Admin</h1>
          </div>
          <div className="bg-white/95 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-float border border-white/20 dark:border-gray-800/50 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl mb-4">
              <XCircle size={32} className="text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Link không hợp lệ</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu link mới.
            </p>
            <Link to="/forgot-password" className="btn-primary inline-block px-6 py-2.5">
              Yêu cầu link mới
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const onSubmit = async (data: FormData) => {
    try {
      await authApi.resetPassword({ token, newPassword: data.newPassword })
      setSuccess(true)
    } catch (e: any) {
      setError('root', { message: e?.response?.data?.message || e?.message || 'Đặt lại mật khẩu thất bại' })
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-900 dark:from-gray-950 dark:via-primary-950 dark:to-gray-950" />
      <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-primary-400/20 rounded-full blur-[100px] animate-pulse-soft" />

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-xl rounded-2xl mb-4 border border-white/20 shadow-glow p-2">
            <img src="/assets/logos/logo.png" alt="Halo" className="h-full w-auto object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Halo Admin</h1>
          <p className="text-primary-200/80 dark:text-gray-400 mt-1.5 text-sm">Quản trị hệ thống Giấy In Halo</p>
        </div>

        {/* Card */}
        <div className="bg-white/95 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-float border border-white/20 dark:border-gray-800/50 p-8">
          {success ? (
            <div className="text-center animate-fade-in-up">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl mb-4">
                <CheckCircle size={32} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Đặt lại mật khẩu thành công!</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                Mật khẩu của bạn đã được cập nhật. Bạn có thể đăng nhập bằng mật khẩu mới.
              </p>
              <Link to="/login" className="btn-primary inline-block px-6 py-2.5">
                Đăng nhập
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Đặt lại mật khẩu</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Nhập mật khẩu mới cho tài khoản của bạn.</p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="label">Mật khẩu mới</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input {...register('newPassword')} type={showPass ? 'text' : 'password'} placeholder="••••••••"
                      className="input pl-10 pr-11" autoComplete="new-password" autoFocus />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.newPassword && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.newPassword.message}</p>}
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-1.5">Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt</p>
                </div>

                <div>
                  <label className="label">Xác nhận mật khẩu</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input {...register('confirmPassword')} type={showConfirm ? 'text' : 'password'} placeholder="••••••••"
                      className="input pl-10 pr-11" autoComplete="new-password" />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.confirmPassword.message}</p>}
                </div>

                {errors.root && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-xl px-4 py-3 animate-fade-in">
                    {errors.root.message}
                  </div>
                )}

                <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 text-[15px]">
                  {isSubmitting ? <Spinner className="w-4 h-4" /> : 'Đặt lại mật khẩu'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
