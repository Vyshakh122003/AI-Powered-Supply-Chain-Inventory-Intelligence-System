import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatCurrency, formatDate } from '../lib/helpers'
import EmptyState from '../components/EmptyState'
import toast from 'react-hot-toast'
import {
  RotateCcw, Check, X, Loader2, ShoppingCart, Sparkles, MessageCircle,
} from 'lucide-react'

export default function Reorder() {
  const [suggestions, setSuggestions] = useState([])
  const [products, setProducts] = useState({})
  const [suppliers, setSuppliers] = useState({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Pending')
  const [actionId, setActionId] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch suggestions
      const { data: suggestionsData, error } = await supabase
        .from('Reorder Suggestions')
        .select('*')
        .eq('status', filter)
        .order('suggestion_date', { ascending: false })

      if (error) throw error

      // Fetch products and suppliers in parallel for lookups
      const [productsRes, suppliersRes] = await Promise.all([
        supabase.from('Products').select('product_id, product_name, unit_price'),
        supabase.from('Suppliers').select('supplier_id, supplier_name, phone_number'),
      ])

      // Build lookup maps
      const productMap = {}
      ;(productsRes.data || []).forEach(p => {
        productMap[p.product_id] = p
      })

      const supplierMap = {}
      ;(suppliersRes.data || []).forEach(s => {
        supplierMap[s.supplier_id] = s
      })

      setProducts(productMap)
      setSuppliers(supplierMap)
      setSuggestions(suggestionsData || [])
    } catch {
      toast.error('Failed to load reorder suggestions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filter])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('reorder-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Reorder Suggestions' }, () => {
        fetchData()
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [filter])

  const handleApprove = async (id) => {
    setActionId(id)
    try {
      const { error } = await supabase
        .from('Reorder Suggestions')
        .update({ status: 'Approved', approved_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      toast.success('Suggestion approved')
      fetchData()
    } catch {
      toast.error('Failed to approve suggestion')
    } finally {
      setActionId(null)
    }
  }

  const handleDismiss = async (id) => {
    setActionId(id)
    try {
      const { error } = await supabase
        .from('Reorder Suggestions')
        .update({ status: 'Dismissed' })
        .eq('id', id)
      if (error) throw error
      toast.success('Suggestion dismissed')
      fetchData()
    } catch {
      toast.error('Failed to dismiss suggestion')
    } finally {
      setActionId(null)
    }
  }

  const handleWhatsApp = (suggestion) => {
    const product = products[suggestion.product_id] || {}
    const supplier = suppliers[suggestion.supplier_id] || {}
    const rawPhone = supplier.phone_number || ''
    if (!rawPhone) {
      toast.error('No phone number on file for this supplier. Add one in the Suppliers page.')
      return
    }
    // Strip non-digits, remove leading 0 or +91, prepend 91
    let digits = rawPhone.replace(/\D/g, '')
    if (digits.startsWith('0')) digits = digits.slice(1)
    if (digits.startsWith('91') && digits.length > 10) { /* already has country code */ }
    else digits = '91' + digits
    const text = encodeURIComponent(
      `Hi, I would like to order ${suggestion.suggested_quantity} units of ${product.product_name || suggestion.product_id}. Please confirm availability and delivery timeline. Thank you.`
    )
    window.open(`https://wa.me/${digits}?text=${text}`, '_blank')
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">Reorder Suggestions</h1>
        <p className="text-sm text-muted">{suggestions.length} {filter.toLowerCase()} suggestions</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['Pending', 'Approved', 'Dismissed'].map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
              filter === tab
                ? 'bg-accent text-white'
                : 'bg-white text-muted border border-border hover:bg-gray-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Suggestion cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      ) : suggestions.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title={`No ${filter.toLowerCase()} suggestions`}
          description={filter === 'Pending'
            ? 'AI analysis will generate reorder suggestions when needed'
            : `${filter} suggestions will appear here`}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {suggestions.map(s => {
            const product = products[s.product_id] || {}
            const supplier = suppliers[s.supplier_id] || {}
            const estimatedCost = (s.suggested_quantity || 0) * (product.unit_price || 0)

            return (
              <div
                key={s.id}
                className={`bg-white rounded-xl border p-5 ${
                  filter === 'Pending' ? 'border-blue-200' :
                  filter === 'Approved' ? 'border-green-200' :
                  'border-border'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <RotateCcw className={`w-5 h-5 shrink-0 ${
                      filter === 'Pending' ? 'text-accent' :
                      filter === 'Approved' ? 'text-success' : 'text-muted'
                    }`} />
                    <h3 className="text-sm font-semibold text-text truncate">
                      {product.product_name || s.product_id}
                    </h3>
                  </div>
                  {s.ai_generated && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                      <Sparkles className="w-3 h-3" />
                      AI
                    </span>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Supplier</span>
                    <span className="font-medium text-text truncate ml-2">
                      {supplier.supplier_name || s.supplier_id || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Quantity</span>
                    <span className="font-medium text-text">{s.suggested_quantity}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Est. Cost</span>
                    <span className="font-bold text-text">{formatCurrency(estimatedCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Date</span>
                    <span className="font-medium text-text">{formatDate(s.suggestion_date)}</span>
                  </div>
                  {s.approved_at && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Approved</span>
                      <span className="font-medium text-success">{formatDate(s.approved_at)}</span>
                    </div>
                  )}
                </div>

                {/* Reason */}
                {s.reason && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-muted mb-0.5">Reason</p>
                    <p className="text-sm text-text">{s.reason}</p>
                  </div>
                )}

                {/* Actions for Pending */}
                {filter === 'Pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(s.id)}
                      disabled={actionId === s.id}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-success hover:bg-success/90 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {actionId === s.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => handleDismiss(s.id)}
                      disabled={actionId === s.id}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-muted bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                      Dismiss
                    </button>
                  </div>
                )}

                {/* WhatsApp button for Approved */}
                {filter === 'Approved' && (
                  <button
                    onClick={() => handleWhatsApp(s)}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp Supplier
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
