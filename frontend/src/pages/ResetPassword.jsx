import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ResetPassword() {
  const { session } = useAuth()

  if (session) return <Navigate to="/dashboard" replace />

  return (
    <div className="grid min-h-screen place-items-center bg-surface px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-white p-6">
        <h1 className="text-xl font-semibold text-primary">Reset Password</h1>
        <p className="mt-2 text-sm text-muted">Use Supabase Auth email reset flow from your deployed auth templates.</p>
      </div>
    </div>
  )
}
