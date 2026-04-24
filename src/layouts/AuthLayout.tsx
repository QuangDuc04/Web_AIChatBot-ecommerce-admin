import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { PageLoader } from '@/components/ui/Spinner'

export default function AuthLayout() {
  const { user, loading } = useAuth()
  if (loading) return <div className="h-screen flex items-center justify-center"><PageLoader /></div>
  if (user) return <Navigate to="/" replace />
  return <Outlet />
}
