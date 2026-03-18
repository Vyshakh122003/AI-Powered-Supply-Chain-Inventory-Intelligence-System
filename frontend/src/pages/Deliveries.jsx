import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { postWebhook, WEBHOOKS } from '../lib/config'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import {
  Truck, Loader2, Plus, Trash2, Package,
  CheckCircle2, ClipboardList,
} from 'lucide-react'

export default function Deliveries() {
  const { storeProfile } = useAuth()
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Delivery form state: array of line items
  const [items, setItems] = useState([createEmptyItem()])
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [notes, setNotes] = useState('')

  // Past deliveries (from Stock Transactions)
  const [recentDeliveries, setRecentDeliveries] = useState([])
  const [loadingRecent, setLoadingRecent] = useState(true)

  function createEmptyItem() {
    return { product_id: '', quantity: '', id: Date.now() + Math.random() }
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [prodRes, supRes] = await Promise.all([
        supabase.from('Products').select('product_id, product_name, category, current_stock, unit').order('product_name'),
        supabase.from('Suppliers').select('supplier_id, supplier_name').order('supplier_name'),
      ])
      if (prodRes.error) throw prodRes.error
      if (supRes.error) throw supRes.error
      setProducts(prodRes.data || [])
      setSuppliers(supRes.data || [])
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchRecentDeliveries = useCallback(async () => {
    setLoadingRecent(true)
    try {
      const { data, error } = await supabase
        .from('Stock Transactions')
        .select('*')
        .eq('transaction_type', 'delivery')
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) throw error
      setRecentDeliveries(data || [])
    } catch {
      // Table might be empty, that's ok
    } finally {
      setLoadingRecent(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    fetchRecentDeliveries()
  }, [fetchData, fetchRecentDeliveries])

  const addItem = () => {
    setItems((prev) => [...prev, createEmptyItem()])
  }

  const removeItem = (id) => {
    if (items.length <= 1) return
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const updateItem = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate
    const validItems = items.filter((item) => item.product_id && item.quantity > 0)
    if (validItems.length === 0) {
      toast.error('Add at least one product with a quantity')
      return
    }

    setSubmitting(true)
    let successCount = 0

    try {
      for (const item of validItems) {
        const product = products.find((p) => p.product_id === item.product_id)
        if (!product) continue

        const qty = parseInt(item.quantity, 10)
        const newStock = (product.current_stock || 0) + qty

        try {
          // 1. Update Supabase Products table directly (instant)
          const { error: updateError } = await supabase
            .from('Products')
            .update({
              current_stock: newStock,
              last_restock_date: new Date().toISOString().split('T')[0],
            })
            .eq('product_id', item.product_id)

          if (updateError) throw updateError

          // 2. Log to Stock Transactions (best-effort)
          supabase.from('Stock Transactions').insert({
            product_id: item.product_id,
            product_name: product.product_name,
            transaction_type: 'delivery',
            quantity_change: qty,
            new_stock_level: newStock,
            store_id: storeProfile?.id || null,
            notes: notes ? `${notes} (Supplier: ${selectedSupplier || 'None'})` : `Supplier: ${selectedSupplier || 'None'}`,
          }).then(({ error }) => {
            if (error) console.warn('Could not log transaction:', error.message)
          })

          // 3. Fire n8n webhook in background (fire-and-forget, non-critical)
          postWebhook(WEBHOOKS.productIngest, {
            product_id: item.product_id,
            product_name: product.product_name,
            category: product.category,
            current_stock: newStock,
            unit: product.unit,
          }).catch((err) => console.warn('Webhook fire-and-forget failed (non-critical):', err.message))

          successCount++
        } catch {
          toast.error(`Failed to update ${product.product_name}`)
        }
      }

      if (successCount > 0) {
        toast.success(`Recorded delivery for ${successCount} product${successCount > 1 ? 's' : ''}`)
        setItems([createEmptyItem()])
        setSelectedSupplier('')
        setNotes('')
        fetchData()
        fetchRecentDeliveries()
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <Truck className="w-6 h-6 text-accent" />
          Record Delivery
        </h1>
        <p className="text-sm text-muted">Log incoming stock deliveries from suppliers</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Supplier selection */}
          <div className="bg-white border border-border rounded-xl p-4">
            <label className="block text-sm font-medium text-text mb-1.5">
              Supplier (optional)
            </label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Select supplier...</option>
              {suppliers.map((s) => (
                <option key={s.supplier_id} value={s.supplier_id}>
                  {s.supplier_name} ({s.supplier_id})
                </option>
              ))}
            </select>
          </div>

          {/* Line items */}
          <div className="bg-white border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text">Products Received</h2>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Product
              </button>
            </div>

            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <select
                  value={item.product_id}
                  onChange={(e) => updateItem(item.id, 'product_id', e.target.value)}
                  className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent min-w-0"
                >
                  <option value="">Select product...</option>
                  {products.map((p) => (
                    <option key={p.product_id} value={p.product_id}>
                      {p.product_name} (stock: {p.current_stock} {p.unit || 'pcs'})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                  placeholder="Qty"
                  className="w-20 px-3 py-2 border border-border rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-accent"
                />
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-muted hover:text-danger transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Notes */}
          <div className="bg-white border border-border rounded-xl p-4">
            <label className="block text-sm font-medium text-text mb-1.5">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Invoice #1234, partial delivery"
              rows={2}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 bg-accent text-white py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            {submitting ? 'Recording...' : 'Record Delivery'}
          </button>
        </form>
      )}

      {/* Recent deliveries */}
      <div className="bg-white border border-border rounded-xl p-4">
        <h2 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-accent" />
          Recent Deliveries
        </h2>
        {loadingRecent ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted" />
          </div>
        ) : recentDeliveries.length === 0 ? (
          <div className="text-center py-6">
            <Package className="w-8 h-8 text-muted mx-auto mb-2" />
            <p className="text-sm text-muted">No deliveries recorded yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentDeliveries.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-text">{d.product_name || d.product_id}</p>
                  <p className="text-xs text-muted">
                    +{d.quantity_change} units &middot; {new Date(d.created_at).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <span className="text-xs text-muted">
                  Stock: {d.new_stock_level}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
