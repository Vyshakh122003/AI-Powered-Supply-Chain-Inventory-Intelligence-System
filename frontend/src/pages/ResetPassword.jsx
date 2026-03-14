import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { Package, Loader2, Mail, Lock, CheckCircle2 } from 'lucide-react'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)

  // Determine mode: 'request' (enter email) or 'update' (enter new password)
  // Supabase redirects back with type=recovery in the URL hash
  const [mode, setMode] = useState('request')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [sent, setSent] = useState(false)

  useEffect(() => {
    // Check if this is a recovery callback (Supabase puts tokens in hash)
    const hash = window.location.hash
    if (hash && hash.includes('type=recovery')) {
      setMode('update')
    }
  }, [])

  const handleRequestReset = async (e) => {
    e.preventDefault()
    if (!email) {
      toast.error('Please enter your email')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setSent(true)
      toast.success('Reset link sent! Check your email.')
    } catch (err) {
      toast.error(err.message || 'Failed to send reset link')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    if (!password || !confirmPassword) {
      toast.error('Please fill in all fields')
      return
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      toast.success('Password updated! Redirecting to login...')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      toast.error(err.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-xl mb-4">
            <Package className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text">StockSense AI</h1>
          <p className="text-muted text-sm mt-1">
            {mode === 'request' ? 'Reset your password' : 'Set a new password'}
          </p>
        </div>

        {/* Request mode — enter email */}
        {mode === 'request' && !sent && (
          <form
            onSubmit={handleRequestReset}
            className="bg-white rounded-xl shadow-sm border border-border p-6 space-y-4"
          >
            <h2 className="text-lg font-semibold text-text flex items-center gap-2">
              <Mail className="w-5 h-5 text-accent" />
              Forgot Password
            </h2>
            <p className="text-sm text-muted">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <p className="text-center text-sm text-muted">
              Remember your password?{' '}
              <Link to="/login" className="text-accent font-medium hover:underline">
                Sign In
              </Link>
            </p>
          </form>
        )}

        {/* Email sent confirmation */}
        {mode === 'request' && sent && (
          <div className="bg-white rounded-xl shadow-sm border border-border p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 text-success" />
            </div>
            <h2 className="text-lg font-semibold text-text">Check your email</h2>
            <p className="text-sm text-muted">
              We sent a password reset link to <strong className="text-text">{email}</strong>.
              Click the link in the email to set a new password.
            </p>
            <p className="text-xs text-muted">
              Didn't receive it? Check your spam folder or{' '}
              <button
                onClick={() => setSent(false)}
                className="text-accent font-medium hover:underline cursor-pointer"
              >
                try again
              </button>.
            </p>
            <Link
              to="/login"
              className="inline-block text-sm font-medium text-accent hover:underline"
            >
              Back to Sign In
            </Link>
          </div>
        )}

        {/* Update mode — set new password */}
        {mode === 'update' && (
          <form
            onSubmit={handleUpdatePassword}
            className="bg-white rounded-xl shadow-sm border border-border p-6 space-y-4"
          >
            <h2 className="text-lg font-semibold text-text flex items-center gap-2">
              <Lock className="w-5 h-5 text-accent" />
              New Password
            </h2>
            <p className="text-sm text-muted">
              Enter your new password below.
            </p>

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
