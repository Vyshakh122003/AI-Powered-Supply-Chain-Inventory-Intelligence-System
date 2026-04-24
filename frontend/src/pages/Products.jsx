import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { WEBHOOKS, postWebhook } from '../lib/config'
import { formatCurrency } from '../lib/helpers'
import { useAuth } from '../contexts/AuthContext'
import RiskBadge from '../components/RiskBadge'
import EmptyState from '../components/EmptyState'
import AddProductModal from '../components/AddProductModal'
import CsvImportModal from '../components/CsvImportModal'
import toast from 'react-hot-toast'
import {
  Package, Search, Plus, ChevronLeft, ChevronRight,
  Loader2, Pencil, X, Check, Upload, Trash2,
} from 'lucide-react'

const PAGE_SIZE = 20

export default function Products() {
  const { storeProfile } = useAuth()
  const location = useLocation()
  const initialParams = new URLSearchParams(location.search)
  const initialRisk = (() => {
    const risk = initialParams.get('risk')
    return ['HIGH', 'MEDIUM', 'LOW'].includes(risk) ? risk : 'ALL'
  })()
  const initialOutOfStockOnly = initialParams.get('outOfStock') === '1'

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState(initialRisk)
  const [outOfStockOnly, setOutOfStockOnly] = useState(initialOutOfStockOnly)
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showCsvModal, setShowCsvModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})

  const fetchProducts = async () => {
    if (!storeProfile?.id) {
      setProducts([])
      setTotalCount(0)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      let query = supabase
        .from('Products')
        .select('*', { count: 'exact' })
        .eq('store_id', storeProfile.id)
        .order('days_to_stockout', { ascending: true, nullsFirst: false })

      if (search) {
        query = query.ilike('product_name', `%${search}%`)
      }
      if (riskFilter !== 'ALL') {
        query = query.eq('risk_level', riskFilter)
      }
      if (outOfStockOnly) {
        query = query.eq('current_stock', 0)
      }
      if (categoryFilter !== 'ALL') {
        query = query.eq('category', categoryFilter)
      }

      const from = page * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      query = query.range(from, to)

      const { data, error, count } = await query
      if (error) throw error
      setProducts(data || [])
      setTotalCount(count || 0)
    } catch {
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  // Fetch all categories for filter dropdown
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  useEffect(() => {
    if (!storeProfile?.id) return
    supabase
      .from('Products')
      .select('category')
      .eq('store_id', storeProfile.id)
      .then(({ data }) => {
        const cats = [...new Set((data || []).map(d => d.category).filter(Boolean))]
        setCategories(cats.sort())
      })

    // Fetch suppliers for the inline edit dropdown and table view
    supabase
      .from('Suppliers')
      .select('supplier_id, supplier_name')
      .eq('store_id', storeProfile.id)
      .order('supplier_name')
      .then(({ data }) => setSuppliers(data || []))
  }, [storeProfile])

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    fetchProducts()
  }, [search, riskFilter, outOfStockOnly, categoryFilter, page, storeProfile])
  /* eslint-enable react-hooks/exhaustive-deps */

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const risk = params.get('risk')
    const oos = params.get('outOfStock') === '1'

    if (['HIGH', 'MEDIUM', 'LOW'].includes(risk)) {
      setRiskFilter(risk)
      setOutOfStockOnly(false)
    } else {
      setRiskFilter('ALL')
    }

    setOutOfStockOnly(oos)
  }, [location.search])

  // Reset page when filters change
  useEffect(() => {
    setPage(0)
  }, [search, riskFilter, outOfStockOnly, categoryFilter])

  // Realtime subscription
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const channel = supabase
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Products' }, () => {
        fetchProducts()
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [search, riskFilter, outOfStockOnly, categoryFilter, page])
  /* eslint-enable react-hooks/exhaustive-deps */

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const handleEdit = (product) => {
    setEditingId(product.product_id)
    setEditData({
      product_name: product.product_name,
      category: product.category,
      current_stock: product.current_stock,
      reorder_threshold: product.reorder_threshold,
      unit_price: product.unit_price,
      avg_daily_sales: product.avg_daily_sales,
      preferred_supplier_id: product.preferred_supplier_id,
    })
  }

  const handleSaveEdit = async (productId) => {
    try {
      const body = {
        product_id: productId,
        product_name: editData.product_name,
        category: editData.category,
        current_stock: Number(editData.current_stock),
        reorder_threshold: Number(editData.reorder_threshold),
        unit_price: Number(editData.unit_price),
        avg_daily_sales: Number(editData.avg_daily_sales),
        preferred_supplier_id: editData.preferred_supplier_id || null,
      }
      await postWebhook(WEBHOOKS.productIngest, body)

      // Patch supplier association after webhook processes.
      // Small delay to let the async webhook update the row first.
      if (editData.preferred_supplier_id !== undefined) {
        await new Promise(r => setTimeout(r, 1000))
        await supabase.from('Products').update({
          preferred_supplier_id: editData.preferred_supplier_id || null
        }).eq('product_id', productId).eq('store_id', storeProfile.id)
      }

      toast.success('Product updated')
      setEditingId(null)
      fetchProducts()
    } catch {
      toast.error('Failed to update product')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditData({})
  }

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) return
    try {
      const { error } = await supabase.from('Products').delete().eq('product_id', productId)
        .eq('store_id', storeProfile.id)
      if (error) throw error
      toast.success('Product deleted')
      fetchProducts()
    } catch {
      toast.error('Failed to delete product')
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text">Products</h1>
          <p className="text-sm text-muted">{totalCount} products total</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCsvModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-text text-sm font-medium rounded-lg border border-border hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white"
        >
          <option value="ALL">All Risk Levels</option>
          <option value="HIGH">High Risk</option>
          <option value="MEDIUM">Medium Risk</option>
          <option value="LOW">Low Risk</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white"
        >
          <option value="ALL">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <button
          onClick={() => setOutOfStockOnly(prev => !prev)}
          className={`px-3 py-2 border rounded-lg text-sm transition-colors cursor-pointer ${outOfStockOnly ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-border text-muted hover:bg-gray-50'}`}
        >
          Out of Stock Only
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products found"
            description={search || riskFilter !== 'ALL' || categoryFilter !== 'ALL'
              || outOfStockOnly
              ? 'Try adjusting your filters'
              : 'Add your first product to get started'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-muted">Product</th>
                  <th className="text-left px-4 py-3 font-medium text-muted">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-muted">Supplier</th>
                  <th className="text-right px-4 py-3 font-medium text-muted">Stock</th>
                  <th className="text-right px-4 py-3 font-medium text-muted">Threshold</th>
                  <th className="text-right px-4 py-3 font-medium text-muted">Days to Stockout</th>
                  <th className="text-center px-4 py-3 font-medium text-muted">Risk</th>
                  <th className="text-right px-4 py-3 font-medium text-muted">Unit Price</th>
                  <th className="text-center px-4 py-3 font-medium text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.product_id} className="border-b border-border last:border-0 hover:bg-gray-50">
                    {editingId === product.product_id ? (
                      <>
                        <td className="px-4 py-3">
                          <input
                            value={editData.product_name}
                            onChange={(e) => setEditData(prev => ({ ...prev, product_name: e.target.value }))}
                            className="w-full px-2 py-1 border border-border rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            value={editData.category}
                            onChange={(e) => setEditData(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full px-2 py-1 border border-border rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={editData.preferred_supplier_id || ''}
                            onChange={(e) => setEditData(prev => ({ ...prev, preferred_supplier_id: e.target.value }))}
                            className="w-full px-2 py-1 border border-border rounded text-sm bg-white"
                          >
                            <option value="">None</option>
                            {suppliers.map(s => (
                              <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            value={editData.current_stock}
                            onChange={(e) => setEditData(prev => ({ ...prev, current_stock: e.target.value }))}
                            className="w-20 px-2 py-1 border border-border rounded text-sm text-right"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            value={editData.reorder_threshold}
                            onChange={(e) => setEditData(prev => ({ ...prev, reorder_threshold: e.target.value }))}
                            className="w-20 px-2 py-1 border border-border rounded text-sm text-right"
                          />
                        </td>
                        <td className="px-4 py-3 text-right text-muted">
                          {product.days_to_stockout ?? '—'}
                        </td>
                        <td className="text-center px-4 py-3">
                          <RiskBadge level={product.risk_level} stock={product.current_stock} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            step="0.01"
                            value={editData.unit_price}
                            onChange={(e) => setEditData(prev => ({ ...prev, unit_price: e.target.value }))}
                            className="w-24 px-2 py-1 border border-border rounded text-sm text-right"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleSaveEdit(product.product_id)}
                              className="p-1.5 text-success hover:bg-green-50 rounded cursor-pointer"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1.5 text-danger hover:bg-red-50 rounded cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 font-medium text-text">{product.product_name}</td>
                        <td className="px-4 py-3 text-muted">{product.category || '—'}</td>
                        <td 
                          className="px-4 py-3 text-muted truncate max-w-[120px]" 
                          title={suppliers.find(s => s.supplier_id === product.preferred_supplier_id)?.supplier_name || '—'}
                        >
                          {suppliers.find(s => s.supplier_id === product.preferred_supplier_id)?.supplier_name || '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">{product.current_stock}</td>
                        <td className="px-4 py-3 text-right font-mono">{product.reorder_threshold}</td>
                        <td className="px-4 py-3 text-right font-mono">
                          {product.days_to_stockout != null
                            ? `${product.days_to_stockout} days`
                            : '—'}
                        </td>
                        <td className="text-center px-4 py-3">
                          <RiskBadge level={product.risk_level} stock={product.current_stock} />
                        </td>
                        <td className="px-4 py-3 text-right font-mono">{formatCurrency(product.unit_price)}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleEdit(product)}
                              className="p-1.5 text-muted hover:text-accent hover:bg-blue-50 rounded cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product.product_id)}
                              className="p-1.5 text-muted hover:text-danger hover:bg-red-50 rounded cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchProducts}
      />

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={showCsvModal}
        onClose={() => setShowCsvModal(false)}
        onSuccess={fetchProducts}
      />
    </div>
  )
}
