import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '@/api/auth.api'
import Spinner from '@/components/ui/Spinner'
import toast from 'react-hot-toast'

const schema = z.object({
  firstName: z.string().min(1, 'Nhập họ'),
  lastName: z.string().min(1, 'Nhập tên'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  confirmPassword: z.string().min(1, 'Xác nhận mật khẩu'),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Mật khẩu không khớp',
  path: ['confirmPassword'],
})
type FormData = z.infer<typeof schema>

export default function Register() {
  const navigate = useNavigate()
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await authApi.register({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      })
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.')
      navigate('/login')
    } catch (e: any) {
      setError('root', { message: e?.response?.data?.message || e?.message || 'Đăng ký thất bại' })
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-900 dark:from-gray-950 dark:via-primary-950 dark:to-gray-950" />
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary-400/20 rounded-full blur-[100px] animate-pulse-soft" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400/15 rounded-full blur-[120px] animate-pulse-soft" style={{ animationDelay: '1s' }} />

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-xl rounded-2xl mb-4 border border-white/20 shadow-glow p-2">
            <img src="/assets/logos/logo.png" alt="Halo" className="h-full w-auto object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Halo Admin</h1>
          <p className="text-primary-200/80 dark:text-gray-400 mt-1.5 text-sm">Quản trị hệ thống Giấy In Halo</p>
        </div>

        {/* Form */}
        <div className="bg-white/95 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-float border border-white/20 dark:border-gray-800/50 p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Tạo tài khoản</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Họ</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input {...register('firstName')} type="text" placeholder="Nguyễn"
                    className="input pl-10" autoComplete="given-name" />
                </div>
                {errors.firstName && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="label">Tên</label>
                <input {...register('lastName')} type="text" placeholder="Văn A"
                  className="input" autoComplete="family-name" />
                {errors.lastName && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input {...register('email')} type="email" placeholder="admin@example.com"
                  className="input pl-10" autoComplete="email" />
              </div>
              {errors.email && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Mật khẩu</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input {...register('password')} type={showPass ? 'text' : 'password'} placeholder="••••••••"
                  className="input pl-10 pr-11" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.password.message}</p>}
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

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 text-[15px] mt-2">
              {isSubmitting ? <Spinner className="w-4 h-4" /> : 'Đăng ký'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
