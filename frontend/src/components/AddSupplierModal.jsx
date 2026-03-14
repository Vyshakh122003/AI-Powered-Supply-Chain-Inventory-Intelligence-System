import { useState } from 'react'
import toast from 'react-hot-toast'
import { X, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function AddSupplierModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    supplier_id: '',
    supplier_name: '',
    contact_person: '',
    phone_number: '',
    email: '',
    delivery_time_days: '',
    supplies_categories: '',
  })

  if (!isOpen) return null

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.supplier_id || !formData.supplier_name) {
      toast.error('Supplier ID and name are required')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.from('Suppliers').insert({
        supplier_id: formData.supplier_id,
        supplier_name: formData.supplier_name,
        contact_person: formData.contact_person || null,
        phone_number: formData.phone_number || null,
        email: formData.email || null,
        delivery_time_days: formData.delivery_time_days ? Number(formData.delivery_time_days) : null,
        supplies_categories: formData.supplies_categories
          ? formData.supplies_categories.split(',').map(c => c.trim()).filter(Boolean)
          : [],
        reliability_score: 0.5,
        price_score: 0.5,
        composite_score: 50,
        supplier_grade: 'C',
      })
      if (error) throw error
      toast.success('Supplier added successfully!')
      setFormData({
        supplier_id: '', supplier_name: '', contact_person: '',
        phone_number: '', email: '', delivery_time_days: '', supplies_categories: '',
      })
      onSuccess?.()
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to add supplier')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-lg border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text">Add Supplier</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded cursor-pointer">
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Supplier ID *</label>
              <input
                name="supplier_id"
                value={formData.supplier_id}
                onChange={handleChange}
                placeholder="e.g. SUP001"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Supplier Name *</label>
              <input
                name="supplier_name"
                value={formData.supplier_name}
                onChange={handleChange}
                placeholder="e.g. Amul Distributors"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Contact Person</label>
            <input
              name="contact_person"
              value={formData.contact_person}
              onChange={handleChange}
              placeholder="e.g. Rajesh Kumar"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Phone Number</label>
              <input
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="e.g. +91 98765 43210"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Email</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="supplier@example.com"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Delivery Time (days)</label>
              <input
                name="delivery_time_days"
                type="number"
                value={formData.delivery_time_days}
                onChange={handleChange}
                placeholder="e.g. 3"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Categories</label>
              <input
                name="supplies_categories"
                value={formData.supplies_categories}
                onChange={handleChange}
                placeholder="Dairy, Snacks, Beverages"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <p className="text-xs text-muted mt-1">Comma-separated</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted hover:text-text transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Adding...' : 'Add Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
