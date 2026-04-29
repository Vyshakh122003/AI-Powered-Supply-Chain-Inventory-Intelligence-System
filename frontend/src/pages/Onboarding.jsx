import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function Onboarding() {
  const navigate = useNavigate()
  const { session, storeProfile, refreshProfile, setStoreProfile } = useAuth()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    store_name: storeProfile?.store_name || '',
    owner_name: storeProfile?.owner_name || '',
    phone: storeProfile?.phone || '',
    city: storeProfile?.city || '',
    store_type: storeProfile?.store_type || 'Kirana',
    whatsapp_numbers: storeProfile?.whatsapp_numbers || '',
    safety_factor: String(storeProfile?.safety_factor || 1.5),
    default_lead_days: String(storeProfile?.default_lead_days || 3),
  })

  if (!session) {
    return <Navigate to="/login" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload = {
        ...form,
        safety_factor: Number(form.safety_factor) || 1.5,
        default_lead_days: Number(form.default_lead_days) || 3,
        onboarding_complete: true,
      }

      if (storeProfile?.id) {
        const { error } = await supabase
          .from('Store Profiles')
          .update(payload)
          .eq('id', storeProfile.id)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('Store Profiles')
          .insert(payload)
          .select()
          .single()
        if (error) throw error
        setStoreProfile(data)
      }

      await refreshProfile()
      toast.success('Store profile saved')
      navigate('/dashboard')
    } catch (err) {
      toast.error(`Failed to save profile: ${err.message || 'Please try again'}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-surface px-4 py-8">
      <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-4 rounded-xl border border-border bg-white p-6">
        <h1 className="text-xl font-semibold text-primary">Set Up Your Store</h1>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input className="rounded-lg border border-border px-3 py-2" placeholder="Store name" value={form.store_name} onChange={(e) => setForm({ ...form, store_name: e.target.value })} required />
          <input className="rounded-lg border border-border px-3 py-2" placeholder="Owner name" value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} required />
          <input className="rounded-lg border border-border px-3 py-2" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className="rounded-lg border border-border px-3 py-2" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <input className="rounded-lg border border-border px-3 py-2" placeholder="Store type" value={form.store_type} onChange={(e) => setForm({ ...form, store_type: e.target.value })} />
          <input className="rounded-lg border border-border px-3 py-2" placeholder="WhatsApp numbers" value={form.whatsapp_numbers} onChange={(e) => setForm({ ...form, whatsapp_numbers: e.target.value })} />
          <input className="rounded-lg border border-border px-3 py-2" placeholder="Safety factor" value={form.safety_factor} onChange={(e) => setForm({ ...form, safety_factor: e.target.value })} />
          <input className="rounded-lg border border-border px-3 py-2" placeholder="Default lead days" value={form.default_lead_days} onChange={(e) => setForm({ ...form, default_lead_days: e.target.value })} />
        </div>
        <button disabled={saving} className="rounded-lg bg-accent px-4 py-2 text-white">{saving ? 'Saving...' : 'Finish Setup'}</button>
      </form>
    </div>
  )
}
