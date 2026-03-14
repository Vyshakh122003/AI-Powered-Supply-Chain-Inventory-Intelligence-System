import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { apiTriggerWorkflow, triggerWebhook, WEBHOOKS, WORKFLOW_IDS } from '../lib/config'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import {
  Settings as SettingsIcon, Save, Loader2, Play,
  Calculator, AlertTriangle, ShieldCheck, Brain,
  Star, MessageCircle, Zap,
} from 'lucide-react'

const workflowButtons = [
  { key: 'runWF02', label: 'Calculate Stockout Dates', icon: Calculator, trigger: () => apiTriggerWorkflow(WORKFLOW_IDS.WF02) },
  { key: 'runWF03', label: 'Generate Alerts', icon: AlertTriangle, trigger: () => apiTriggerWorkflow(WORKFLOW_IDS.WF03) },
  { key: 'runWF04', label: 'Classify Risk', icon: ShieldCheck, trigger: () => apiTriggerWorkflow(WORKFLOW_IDS.WF04) },
  { key: 'runWF05', label: 'Run AI Analysis', icon: Brain, trigger: () => apiTriggerWorkflow(WORKFLOW_IDS.WF05), cooldown: 60 },
  { key: 'runWF06', label: 'Score Suppliers', icon: Star, trigger: () => apiTriggerWorkflow(WORKFLOW_IDS.WF06) },
  { key: 'sendWhatsApp', label: 'Send WhatsApp', icon: MessageCircle, trigger: () => triggerWebhook(WEBHOOKS.sendWhatsApp) },
  { key: 'runWF08', label: 'Run Full Pipeline', icon: Zap, trigger: () => apiTriggerWorkflow(WORKFLOW_IDS.WF08) },
]

export default function Settings() {
  const { user, storeProfile, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    store_name: '',
    owner_name: '',
    phone: '',
    whatsapp_numbers: '',
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
      const whatsappArr = form.whatsapp_numbers
        ? form.whatsapp_numbers.split(',').map(n => n.trim()).filter(Boolean)
        : []

      const { error } = await supabase
        .from('Store Profiles')
        .update({
          store_name: form.store_name,
          owner_name: form.owner_name,
          phone: form.phone,
          whatsapp_numbers: whatsappArr,
        })
        .eq('id', user.id)

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
        <form onSubmit={handleSaveProfile} className="space-y-4">
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
          Manual Workflow Triggers
        </h2>
        <p className="text-sm text-muted mb-4">
          Manually trigger individual pipeline steps or the full pipeline.
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
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg border transition-colors text-left disabled:opacity-50 cursor-pointer ${
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
