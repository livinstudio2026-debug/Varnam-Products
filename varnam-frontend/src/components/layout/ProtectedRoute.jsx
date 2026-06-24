import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuthStore()

  if (loading) return null

  if (!isAuthenticated) return <Navigate to="/login" replace />

  return children
}