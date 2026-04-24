import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { authApi } from '@/api/auth.api'
import Spinner from '@/components/ui/Spinner'

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
})
type FormData = z.infer<typeof schema>

export default function ForgotPassword() {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await authApi.forgotPassword(data.email)
      setSent(true)
    } catch (e: any) {
      setError('root', { message: e?.response?.data?.message || e?.message || 'Gửi yêu cầu thất bại' })
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-900 dark:from-gray-950 dark:via-primary-950 dark:to-gray-950" />
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary-400/20 rounded-full blur-[100px] animate-pulse-soft" />

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
          {sent ? (
            <div className="text-center animate-fade-in-up">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl mb-4">
                <CheckCircle size={32} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Kiểm tra email của bạn</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu. Vui lòng kiểm tra hộp thư (bao gồm thư mục spam).
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mb-6">Link đặt lại mật khẩu sẽ hết hạn sau 1 giờ.</p>
              <Link to="/login" className="btn-primary inline-flex items-center gap-2 px-6 py-2.5">
                <ArrowLeft size={16} />
                Quay lại đăng nhập
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Quên mật khẩu?</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                Nhập email đã đăng ký, chúng tôi sẽ gửi link đặt lại mật khẩu cho bạn.
              </p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="label">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input {...register('email')} type="email" placeholder="admin@example.com"
                      className="input pl-10" autoComplete="email" autoFocus />
                  </div>
                  {errors.email && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.email.message}</p>}
                </div>
                {errors.root && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-xl px-4 py-3 animate-fade-in">
                    {errors.root.message}
                  </div>
                )}
                <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 text-[15px]">
                  {isSubmitting ? <Spinner className="w-4 h-4" /> : 'Gửi link đặt lại mật khẩu'}
                </button>
              </form>
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                <Link to="/login" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline inline-flex items-center gap-1">
                  <ArrowLeft size={14} />
                  Quay lại đăng nhập
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
