import { useState, useEffect } from 'react'
import { WEBHOOKS, postWebhook } from '../lib/config'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { X, Loader2 } from 'lucide-react'

export default function AddProductModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState([])
  const [formData, setFormData] = useState({
    product_id: '',
    product_name: '',
    category: '',
    current_stock: '',
    avg_daily_sales: '',
    reorder_threshold: '',
    unit_price: '',
    preferred_supplier_id: '',
  })

  useEffect(() => {
    if (isOpen) {
      supabase.from('Suppliers').select('supplier_id, supplier_name').order('supplier_name')
        .then(({ data }) => setSuppliers(data || []))
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.product_id || !formData.product_name) {
      toast.error('Product ID and name are required')
      return
    }
    setLoading(true)
    try {
      const body = {
        product_id: formData.product_id,
        product_name: formData.product_name,
        category: formData.category,
        current_stock: Number(formData.current_stock) || 0,
        avg_daily_sales: Number(formData.avg_daily_sales) || 0,
        reorder_threshold: Number(formData.reorder_threshold) || 0,
        unit_price: Number(formData.unit_price) || 0,
        preferred_supplier_id: formData.preferred_supplier_id || null,
      }
      await postWebhook(WEBHOOKS.productIngest, body)
      
      // Patch supplier association after webhook has created/updated the product.
      // Retry with delay since the webhook is async and the row may not exist yet.
      if (formData.preferred_supplier_id) {
        const patchSupplier = async (retries = 3) => {
          const { error: patchErr } = await supabase.from('Products').update({
            preferred_supplier_id: formData.preferred_supplier_id
          }).eq('product_id', formData.product_id)
          if (patchErr && retries > 0) {
            await new Promise(r => setTimeout(r, 1000))
            return patchSupplier(retries - 1)
          }
        }
        // Wait a moment for the webhook to process, then patch
        await new Promise(r => setTimeout(r, 1500))
        await patchSupplier()
      }

      toast.success('Product added successfully!')
      setFormData({
        product_id: '', product_name: '', category: '',
        current_stock: '', avg_daily_sales: '', reorder_threshold: '', unit_price: '',
        preferred_supplier_id: '',
      })
      onSuccess?.()
      onClose()
    } catch {
      toast.error('Failed to add product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-lg border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text">Add Product</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded cursor-pointer">
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Product ID *</label>
              <input
                name="product_id"
                value={formData.product_id}
                onChange={handleChange}
                placeholder="e.g. SKU001"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Category</label>
              <input
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g. Dairy"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Product Name *</label>
              <input
                name="product_name"
                value={formData.product_name}
                onChange={handleChange}
                placeholder="e.g. Amul Butter 500g"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Preferred Supplier</label>
              <select
                name="preferred_supplier_id"
                value={formData.preferred_supplier_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Select supplier...</option>
                {suppliers.map(s => (
                  <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Current Stock</label>
              <input
                name="current_stock"
                type="number"
                value={formData.current_stock}
                onChange={handleChange}
                placeholder="0"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Avg Daily Sales</label>
              <input
                name="avg_daily_sales"
                type="number"
                step="0.1"
                value={formData.avg_daily_sales}
                onChange={handleChange}
                placeholder="0"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Reorder Threshold</label>
              <input
                name="reorder_threshold"
                type="number"
                value={formData.reorder_threshold}
                onChange={handleChange}
                placeholder="0"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Unit Price (₹)</label>
              <input
                name="unit_price"
                type="number"
                step="0.01"
                value={formData.unit_price}
                onChange={handleChange}
                placeholder="0"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
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
              {loading ? 'Adding...' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
