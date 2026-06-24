import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export default function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuthStore()

  if (loading) return null

  if (!isAuthenticated || !isAdmin) return <Navigate to="/admin/login" replace />

  return children
}