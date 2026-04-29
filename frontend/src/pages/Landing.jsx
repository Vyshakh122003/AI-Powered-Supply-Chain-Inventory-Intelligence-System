import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Landing() {
  const navigate = useNavigate()
  const { session } = useAuth()

  if (session) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="grid min-h-screen place-items-center bg-surface px-4">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-white p-8 text-center">
        <h1 className="text-3xl font-semibold text-primary">StockSense AI</h1>
        <p className="mt-3 text-muted">Inventory intelligence for small Indian retail stores.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white" onClick={() => navigate('/signup')}>
            Get Started
          </button>
          <button className="rounded-lg border border-border px-4 py-2 text-sm font-medium" onClick={() => navigate('/login')}>
            Login
          </button>
        </div>
      </div>
    </div>
  )
}
