import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { WEBHOOKS, postWebhook } from '../lib/config'
import { formatCurrency } from '../lib/helpers'
import RiskBadge from '../components/RiskBadge'
import EmptyState from '../components/EmptyState'
import AddProductModal from '../components/AddProductModal'
import toast from 'react-hot-toast'
import {
  Package, Search, Plus, ChevronLeft, ChevronRight,
  Loader2, Pencil, X, Check, Filter,
} from 'lucide-react'

const PAGE_SIZE = 20

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})

  const fetchProducts = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('Products')
        .select('*', { count: 'exact' })
        .order('days_to_stockout', { ascending: true, nullsFirst: false })

      if (search) {
        query = query.ilike('product_name', `%${search}%`)
      }
      if (riskFilter !== 'ALL') {
        query = query.eq('risk_level', riskFilter)
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
  useEffect(() => {
    supabase
      .from('Products')
      .select('category')
      .then(({ data }) => {
        const cats = [...new Set((data || []).map(d => d.category).filter(Boolean))]
        setCategories(cats.sort())
      })
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [search, riskFilter, categoryFilter, page])

  // Reset page when filters change
  useEffect(() => {
    setPage(0)
  }, [search, riskFilter, categoryFilter])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Products' }, () => {
        fetchProducts()
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [search, riskFilter, categoryFilter, page])

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
      }
      await postWebhook(WEBHOOKS.productIngest, body)
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text">Products</h1>
          <p className="text-sm text-muted">{totalCount} products total</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
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
                          <RiskBadge level={product.risk_level} />
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
                        <td className="px-4 py-3 text-right font-mono">{product.current_stock}</td>
                        <td className="px-4 py-3 text-right font-mono">{product.reorder_threshold}</td>
                        <td className="px-4 py-3 text-right font-mono">
                          {product.days_to_stockout != null
                            ? `${product.days_to_stockout} days`
                            : '—'}
                        </td>
                        <td className="text-center px-4 py-3">
                          <RiskBadge level={product.risk_level} />
                        </td>
                        <td className="px-4 py-3 text-right font-mono">{formatCurrency(product.unit_price)}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-1.5 text-muted hover:text-accent hover:bg-blue-50 rounded cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
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
    </div>
  )
}
