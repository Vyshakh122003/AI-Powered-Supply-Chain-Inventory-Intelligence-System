import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

export default function Signup() {
  const navigate = useNavigate()
  const { session, signUp } = useAuth()
  const [form, setForm] = useState({ storeName: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)

  if (session) {
    return <Navigate to="/onboarding" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signUp(form.email, form.password, form.storeName)
      toast.success('Account created')
      navigate('/onboarding')
    } catch (err) {
      toast.error(err.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-surface px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xl border border-border bg-white p-6 space-y-4">
        <h1 className="text-xl font-semibold text-primary">Create account</h1>
        <input className="w-full rounded-lg border border-border px-3 py-2" placeholder="Store name" value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} required />
        <input className="w-full rounded-lg border border-border px-3 py-2" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input className="w-full rounded-lg border border-border px-3 py-2" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <button disabled={loading} className="w-full rounded-lg bg-accent px-4 py-2 text-white">{loading ? 'Creating...' : 'Sign Up'}</button>
      </form>
    </div>
  )
}
