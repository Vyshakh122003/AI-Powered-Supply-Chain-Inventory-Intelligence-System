import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { triggerWebhook, WEBHOOKS } from '../lib/config'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import {
  Settings as SettingsIcon, Save, Loader2, Play,
  MessageCircle, Zap, MapPin, Clock, Store,
} from 'lucide-react'

const workflowButtons = [
  { key: 'runWF08', label: 'Run Full Pipeline', icon: Zap, trigger: () => triggerWebhook(WEBHOOKS.runPipeline), description: 'Calculates stockouts, classifies risk, generates alerts, scores suppliers' },
  { key: 'sendWhatsApp', label: 'Send WhatsApp Alert', icon: MessageCircle, trigger: () => triggerWebhook(WEBHOOKS.sendWhatsApp), description: 'Send current alerts summary to WhatsApp' },
]

export default function Settings() {
  const { user, storeProfile, refreshProfile } = useAuth()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    store_name: '',
    owner_name: '',
    phone: '',
    whatsapp_numbers: '',
    city: '',
    store_type: '',
    safety_factor: '1.5',
    default_lead_days: '3',
    alert_time: '08:00',
    timezone: 'Asia/Kolkata',
  })

  // Workflow button states
  const [runningWF, setRunningWF] = useState({})
  const [cooldowns, setCooldowns] = useState({})
  const cooldownTimers = useRef({})

  useEffect(() => {
    if (storeProfile) {
      setForm({
        store_name: storeProfile.store_name || '',
        owner_name: storeProfile.owner_name || '',
        phone: storeProfile.phone || '',
        whatsapp_numbers: Array.isArray(storeProfile.whatsapp_numbers)
          ? storeProfile.whatsapp_numbers.join(', ')
          : storeProfile.whatsapp_numbers || '',
        city: storeProfile.city || '',
        store_type: storeProfile.store_type || '',
        safety_factor: String(storeProfile.safety_factor ?? '1.5'),
        default_lead_days: String(storeProfile.default_lead_days ?? '3'),
        alert_time: storeProfile.alert_time || '08:00',
        timezone: storeProfile.timezone || 'Asia/Kolkata',
      })
    }
  }, [storeProfile])

  // Cleanup cooldown timers
  useEffect(() => {
    return () => {
      Object.values(cooldownTimers.current).forEach(timer => clearInterval(timer))
    }
  }, [])

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    try {
      const whatsappStr = form.whatsapp_numbers
        ? form.whatsapp_numbers.split(',').map(n => n.trim()).filter(Boolean).join(', ')
        : null

      const { error } = await supabase
        .from('Store Profiles')
        .update({
          store_name: form.store_name,
          owner_name: form.owner_name,
          phone: form.phone,
          whatsapp_numbers: whatsappStr,
          city: form.city || null,
          store_type: form.store_type || null,
          safety_factor: parseFloat(form.safety_factor) || 1.5,
          default_lead_days: parseInt(form.default_lead_days, 10) || 3,
          alert_time: form.alert_time || '08:00',
          timezone: form.timezone || 'Asia/Kolkata',
          onboarding_complete: true,
        })
        .eq('user_id', user.id)

      if (error) throw error
      toast.success('Profile saved')
      refreshProfile()
    } catch {
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handleRunWorkflow = async (wf) => {
    // Check cooldown
    if (cooldowns[wf.key] > 0) {
      toast.error(`Please wait ${cooldowns[wf.key]}s before running again`)
      return
    }

    setRunningWF(prev => ({ ...prev, [wf.key]: true }))
    try {
      await wf.trigger()
      toast.success(`${wf.label} started successfully!`)

      // Start cooldown if applicable
      if (wf.cooldown) {
        setCooldowns(prev => ({ ...prev, [wf.key]: wf.cooldown }))
        cooldownTimers.current[wf.key] = setInterval(() => {
          setCooldowns(prev => {
            const remaining = (prev[wf.key] || 0) - 1
            if (remaining <= 0) {
              clearInterval(cooldownTimers.current[wf.key])
              const { [wf.key]: _, ...rest } = prev
              return rest
            }
            return { ...prev, [wf.key]: remaining }
          })
        }, 1000)
      }
    } catch {
      toast.error(`Failed to run ${wf.label}`)
    } finally {
      setRunningWF(prev => ({ ...prev, [wf.key]: false }))
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">Settings</h1>
        <p className="text-sm text-muted">Manage your store profile and run workflows</p>
      </div>

      {/* Store Profile Form */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="text-base font-semibold text-text mb-4 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-accent" />
          Store Profile
        </h2>
        <form onSubmit={handleSaveProfile} className="space-y-5">
          {/* ── Basic Info ─────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Store Name</label>
              <input
                name="store_name"
                value={form.store_name}
                onChange={handleChange}
                placeholder="e.g. Kumar General Store"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Owner Name</label>
              <input
                name="owner_name"
                value={form.owner_name}
                onChange={handleChange}
                placeholder="e.g. Rajesh Kumar"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          {/* ── Location & Type ────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-muted" />
                City
              </label>
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="e.g. Vijayawada"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-muted" />
                Store Type
              </label>
              <select
                name="store_type"
                value={form.store_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Select type...</option>
                <option value="Kirana / General Store">Kirana / General Store</option>
                <option value="Grocery Store">Grocery Store</option>
                <option value="Supermarket">Supermarket</option>
                <option value="Pharmacy">Pharmacy</option>
                <option value="Bakery">Bakery</option>
                <option value="Dairy Shop">Dairy Shop</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* ── Contact ────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Phone</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">WhatsApp Numbers</label>
              <input
                name="whatsapp_numbers"
                value={form.whatsapp_numbers}
                onChange={handleChange}
                placeholder="+91 98765 43210, +91 91234 56789"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <p className="text-xs text-muted mt-1">Comma-separated phone numbers</p>
            </div>
          </div>

          {/* ── Pipeline Preferences ───────────────── */}
          <div className="pt-2 border-t border-border">
            <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-accent" />
              Pipeline Preferences
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Safety Factor</label>
                <input
                  name="safety_factor"
                  type="number"
                  step="0.1"
                  min="1"
                  max="3"
                  value={form.safety_factor}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <p className="text-xs text-muted mt-1">Reorder buffer multiplier (1.0 - 3.0)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Default Lead Days</label>
                <input
                  name="default_lead_days"
                  type="number"
                  min="1"
                  max="30"
                  value={form.default_lead_days}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <p className="text-xs text-muted mt-1">Avg supplier delivery time in days</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Daily Alert Time</label>
                <input
                  name="alert_time"
                  type="time"
                  value={form.alert_time}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <p className="text-xs text-muted mt-1">When the daily pipeline runs</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Timezone</label>
                <select
                  name="timezone"
                  value={form.timezone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="Asia/Colombo">Asia/Colombo (SLT)</option>
                  <option value="Asia/Dhaka">Asia/Dhaka (BST)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Workflow Triggers */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="text-base font-semibold text-text mb-2 flex items-center gap-2">
          <Play className="w-5 h-5 text-accent" />
          Workflow Actions
        </h2>
        <p className="text-sm text-muted mb-4">
          Manually run the AI pipeline or send WhatsApp alerts.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {workflowButtons.map(wf => {
            const isRunning = runningWF[wf.key]
            const cooldownRemaining = cooldowns[wf.key] || 0
            const isDisabled = isRunning || cooldownRemaining > 0
            const Icon = wf.icon

            return (
              <button
                key={wf.key}
                onClick={() => handleRunWorkflow(wf)}
                disabled={isDisabled}
                className={`flex items-center gap-3 px-4 py-3.5 text-sm font-medium rounded-lg border transition-colors text-left disabled:opacity-50 cursor-pointer ${
                  wf.key === 'runWF08'
                    ? 'bg-primary text-white border-primary hover:bg-primary/90'
                    : 'bg-white text-text border-border hover:bg-gray-50'
                }`}
              >
                {isRunning ? (
                  <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                ) : (
                  <Icon className="w-5 h-5 shrink-0" />
                )}
                <div className="min-w-0">
                  <p>{wf.label}</p>
                  {wf.description && !cooldownRemaining && (
                    <p className={`text-xs mt-0.5 ${wf.key === 'runWF08' ? 'text-white/70' : 'text-muted'}`}>{wf.description}</p>
                  )}
                  {cooldownRemaining > 0 && (
                    <p className="text-xs opacity-70">Wait {cooldownRemaining}s</p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="text-base font-semibold text-text mb-4">Account</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Email</span>
            <span className="text-text font-medium">{user?.email || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">User ID</span>
            <span className="text-text font-mono text-xs">{user?.id || '—'}</span>
          </div>
          {storeProfile?.store_id && (
            <div className="flex justify-between">
              <span className="text-muted">Store ID</span>
              <span className="text-text font-mono text-xs">{storeProfile.store_id}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
