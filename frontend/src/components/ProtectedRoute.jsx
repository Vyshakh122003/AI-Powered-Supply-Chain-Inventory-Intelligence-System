import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Loader2 } from 'lucide-react'

export default function ProtectedRoute({ children }) {
  const { session, loading, storeProfile } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-muted text-sm">Loading StockSense AI...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  // Fail-closed: if profile is missing or onboarding not completed, redirect to onboarding.
  // This prevents users with no profile (failed fetch, new signup race) from seeing unscoped data.
  if (!storeProfile || !storeProfile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />
  }

  return children
}
