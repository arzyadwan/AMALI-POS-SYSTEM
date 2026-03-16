import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Wraps a Route to require authentication.
 * If not logged in → redirect to /login
 * If role is required and user doesn't have it → redirect to /
 */
export default function ProtectedRoute({ children, requiredRole }) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />
  }

  return children
}
