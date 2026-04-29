import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-muted">Loading...</div>
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return children
}
