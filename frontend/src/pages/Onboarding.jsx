import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import {
  Package, Store, User, Clock,
  ArrowRight, ArrowLeft, Loader2, CheckCircle2,
} from 'lucide-react'

const STORE_TYPES = [
  'Kirana / General Store',
  'Grocery Store',
  'Supermarket',
  'Pharmacy',
  'Bakery',
  'Dairy Shop',
  'Other',
]

const CITIES = [
  'Amaravati', 'Vijayawada', 'Visakhapatnam', 'Guntur', 'Tirupati',
  'Hyderabad', 'Bangalore', 'Chennai', 'Mumbai', 'Delhi', 'Kolkata',
  'Other',
]

export default function Onboarding() {
  const { user, session, loading: authLoading, storeProfile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    store_name: '',
    owner_name: '',
    phone: '',
    city: '',
    store_type: '',
    whatsapp_numbers: '',
    safety_factor: '1.5',
    default_lead_days: '3',
  })

  // If not logged in, redirect to login
  if (!authLoading && !session) {
    return <Navigate to="/login" replace />
  }

  // If onboarding already completed, go to dashboard
  if (!authLoading && storeProfile?.onboarding_complete) {
    return <Navigate to="/dashboard" replace />
  }

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSelect = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleFinish = async () => {
    if (!user) return
    setSaving(true)
    try {
      const whatsappStr = form.whatsapp_numbers
        ? form.whatsapp_numbers.split(',').map((n) => n.trim()).filter(Boolean).join(', ')
        : null

      const { error } = await supabase
        .from('Store Profiles')
        .update({
          store_name: form.store_name || storeProfile?.store_name || 'My Store',
          owner_name: form.owner_name,
          phone: form.phone,
          city: form.city,
          store_type: form.store_type,
          whatsapp_numbers: whatsappStr,
          safety_factor: parseFloat(form.safety_factor) || 1.5,
          default_lead_days: parseInt(form.default_lead_days, 10) || 3,
          onboarding_complete: true,
        })
        .eq('user_id', user.id)

      if (error) throw error
      toast.success('Store setup complete!')
      refreshProfile()
      navigate('/dashboard')
    } catch (err) {
      toast.error('Failed to save profile. Please try again.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const steps = [
    // Step 0 — Store info
    {
      title: 'Store Details',
      subtitle: 'Tell us about your store',
      icon: Store,
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Store Name</label>
            <input
              name="store_name"
              value={form.store_name}
              onChange={handleChange}
              placeholder="e.g. Kumar General Store"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Store Type</label>
            <div className="grid grid-cols-2 gap-2">
              {STORE_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleSelect('store_type', type)}
                  className={`px-3 py-2 border rounded-lg text-sm text-left transition-colors cursor-pointer ${
                    form.store_type === type
                      ? 'border-accent bg-accent/5 text-accent font-medium'
                      : 'border-border text-text hover:bg-gray-50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">City</label>
            <select
              name="city"
              value={form.city}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white"
            >
              <option value="">Select city...</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      ),
      validate: () => !!form.store_name,
    },
    // Step 1 — Owner info
    {
      title: 'Owner Details',
      subtitle: 'Your contact information',
      icon: User,
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Owner Name</label>
            <input
              name="owner_name"
              value={form.owner_name}
              onChange={handleChange}
              placeholder="e.g. Rajesh Kumar"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Phone Number</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              WhatsApp Numbers for Alerts
            </label>
            <input
              name="whatsapp_numbers"
              value={form.whatsapp_numbers}
              onChange={handleChange}
              placeholder="+91 98765 43210, +91 91234 56789"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <p className="text-xs text-muted mt-1">Comma-separated. Used for stock alert notifications.</p>
          </div>
        </div>
      ),
      validate: () => true,
    },
    // Step 2 — Preferences
    {
      title: 'Preferences',
      subtitle: 'Customize how StockSense AI works for you',
      icon: Clock,
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              Safety Factor
            </label>
            <input
              name="safety_factor"
              type="number"
              step="0.1"
              min="1"
              max="3"
              value={form.safety_factor}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <p className="text-xs text-muted mt-1">
              Multiplier for reorder safety stock (1.0 = no buffer, 2.0 = double buffer). Default: 1.5
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              Default Lead Time (days)
            </label>
            <input
              name="default_lead_days"
              type="number"
              min="1"
              max="30"
              value={form.default_lead_days}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <p className="text-xs text-muted mt-1">
              Average days for suppliers to deliver orders. Default: 3
            </p>
          </div>
        </div>
      ),
      validate: () => true,
    },
  ]

  const currentStep = steps[step]
  const StepIcon = currentStep.icon
  const isLastStep = step === steps.length - 1
  const canGoNext = currentStep.validate()

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-xl mb-3">
            <Package className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-text">Set Up Your Store</h1>
          <p className="text-sm text-muted mt-1">
            Step {step + 1} of {steps.length}
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-2 mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-accent' : 'bg-border'
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
              <StepIcon className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text">{currentStep.title}</h2>
              <p className="text-xs text-muted">{currentStep.subtitle}</p>
            </div>
          </div>

          {currentStep.content}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
            {step > 0 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-text transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <div />
            )}

            {isLastStep ? (
              <button
                onClick={handleFinish}
                disabled={saving || !canGoNext}
                className="inline-flex items-center gap-2 bg-accent text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Finish Setup
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canGoNext}
                className="inline-flex items-center gap-1.5 bg-accent text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
