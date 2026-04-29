import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import GradeBadge from '../components/GradeBadge'
import EmptyState from '../components/EmptyState'
import AddSupplierModal from '../components/AddSupplierModal'
import toast from 'react-hot-toast'
import {
  Truck, Plus, Loader2, Pencil, Check, X, Trash2, AlertTriangle, TrendingUp,
} from 'lucide-react'

export default function Suppliers() {
  const { storeProfile } = useAuth()
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchSuppliers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('Suppliers')
        .select('*')
        .order('composite_score', { ascending: false })

      if (error) throw error
      setSuppliers(data || [])
    } catch {
      toast.error('Failed to load suppliers')
    } finally {
      setLoading(false)
    }
  }

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    fetchSuppliers()
  }, [storeProfile])
  /* eslint-enable react-hooks/exhaustive-deps */

  // Robustly parse supplies_categories from any format Supabase returns
  const parseCategories = (cats) => {
    if (!cats) return []
    // Already a clean JS array of strings
    if (Array.isArray(cats)) {
      // Each element might itself be a Postgres literal like {dairy,beverages}
      return cats.flatMap(item => {
        if (typeof item === 'string' && item.startsWith('{') && item.endsWith('}')) {
          return item.slice(1, -1).split(',').map(c => c.trim().replace(/^"|"$/g, ''))
        }
        return item
      }).filter(Boolean)
    }
    // Postgres text array literal: {dairy,beverages}
    if (typeof cats === 'string' && cats.startsWith('{') && cats.endsWith('}')) {
      return cats.slice(1, -1).split(',').map(c => c.trim().replace(/^"|"$/g, '')).filter(Boolean)
    }
    // JSON stringified array
    if (typeof cats === 'string' && cats.startsWith('[')) {
      try {
        const parsed = JSON.parse(cats)
        return parseCategories(parsed)
      } catch { /* fall through */ }
    }
    // Plain comma-separated string
    if (typeof cats === 'string') {
      return cats.split(',').map(c => c.trim()).filter(Boolean)
    }
    return []
  }

  const handleEdit = (supplier) => {
    setEditingId(supplier.supplier_id)
    setEditData({
      supplier_name: supplier.supplier_name,
      contact_person: supplier.contact_person || '',
      phone_number: supplier.phone_number || '',
      email: supplier.email || '',
      delivery_time_days: supplier.delivery_time_days || '',
      supplies_categories: parseCategories(supplier.supplies_categories).join(', '),
    })
  }

  const handleSaveEdit = async (supplierId) => {
    try {
      const categoriesArray = editData.supplies_categories
        ? editData.supplies_categories.split(',').map(c => c.trim()).filter(Boolean)
        : []

      const { error } = await supabase
        .from('Suppliers')
        .update({
          supplier_name: editData.supplier_name,
          contact_person: editData.contact_person || null,
          phone_number: editData.phone_number || null,
          email: editData.email || null,
          delivery_time_days: editData.delivery_time_days ? Number(editData.delivery_time_days) : null,
          supplies_categories: categoriesArray,
        })
        .eq('supplier_id', supplierId)
      if (error) throw error
      toast.success('Supplier updated')
      setEditingId(null)
      fetchSuppliers()
    } catch {
      toast.error('Failed to update supplier')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditData({})
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('Suppliers')
        .delete()
        .eq('supplier_id', deleteTarget.supplier_id)
      if (error) throw error
      toast.success('Supplier deleted')
      setDeleteTarget(null)
      fetchSuppliers()
    } catch {
      toast.error('Failed to delete supplier')
    } finally {
      setDeleting(false)
    }
  }

  const formatCategories = (cats) => {
    const parsed = parseCategories(cats)
    return parsed.length > 0 ? parsed.join(', ') : '—'
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text">Suppliers</h1>
          <p className="text-sm text-muted">{suppliers.length} suppliers</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Supplier
        </button>
      </div>

      {/* Table */}
      {!loading && suppliers.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            Supplier Performance
          </h3>
          <div className="space-y-3">
            {suppliers.slice(0, 5).map((supplier) => {
              const score = supplier.composite_score || 0
              const barColor = score >= 80 ? '#059669' : score >= 65 ? '#2563EB' : score >= 50 ? '#D97706' : '#DC2626'

              return (
                <div key={supplier.supplier_id}>
                  <div className="flex items-center justify-between mb-1.5 gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text truncate">{supplier.supplier_name}</p>
                      <p className="text-[10px] text-muted">Grade {supplier.supplier_grade || '—'}</p>
                    </div>
                    <span className="text-xs font-bold text-text">{score}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(score, 100)}%`, backgroundColor: barColor }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-[10px] text-muted mt-4 text-center">Composite score out of 100</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
          </div>
        ) : suppliers.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="No suppliers found"
            description="Add your first supplier to get started"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-muted">Supplier</th>
                  <th className="text-center px-4 py-3 font-medium text-muted">Grade</th>
                  <th className="text-right px-4 py-3 font-medium text-muted">Score</th>
                  <th className="text-right px-4 py-3 font-medium text-muted">Reliability</th>
                  <th className="text-right px-4 py-3 font-medium text-muted">Price</th>
                  <th className="text-right px-4 py-3 font-medium text-muted">Delivery (days)</th>
                  <th className="text-left px-4 py-3 font-medium text-muted">Categories</th>
                  <th className="text-center px-4 py-3 font-medium text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map(supplier => (
                  <tr key={supplier.supplier_id} className="border-b border-border last:border-0 hover:bg-gray-50">
                    {editingId === supplier.supplier_id ? (
                      <>
                        <td className="px-4 py-3">
                          <input
                            value={editData.supplier_name}
                            onChange={(e) => setEditData(prev => ({ ...prev, supplier_name: e.target.value }))}
                            className="w-full px-2 py-1 border border-border rounded text-sm"
                          />
                        </td>
                        <td className="text-center px-4 py-3">
                          <GradeBadge grade={supplier.supplier_grade} />
                        </td>
                        <td className="text-right px-4 py-3 font-mono">
                          {supplier.composite_score ?? '—'}
                        </td>
                        <td className="text-right px-4 py-3 font-mono text-muted">
                          {supplier.reliability_score != null ? (supplier.reliability_score * 10).toFixed(1) : '—'}/10
                        </td>
                        <td className="text-right px-4 py-3 font-mono text-muted">
                          {supplier.price_score != null ? (supplier.price_score * 10).toFixed(1) : '—'}/10
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            value={editData.delivery_time_days}
                            onChange={(e) => setEditData(prev => ({ ...prev, delivery_time_days: e.target.value }))}
                            className="w-20 px-2 py-1 border border-border rounded text-sm text-right"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            value={editData.supplies_categories}
                            onChange={(e) => setEditData(prev => ({ ...prev, supplies_categories: e.target.value }))}
                            className="w-full px-2 py-1 border border-border rounded text-sm"
                            placeholder="Comma-separated"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleSaveEdit(supplier.supplier_id)}
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
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-text">{supplier.supplier_name}</p>
                            {supplier.contact_person && (
                              <p className="text-xs text-muted">{supplier.contact_person}</p>
                            )}
                          </div>
                        </td>
                        <td className="text-center px-4 py-3">
                          <GradeBadge grade={supplier.supplier_grade} />
                        </td>
                        <td className="text-right px-4 py-3 font-mono font-medium">
                          {supplier.composite_score ?? '—'}
                        </td>
                        <td className="text-right px-4 py-3 font-mono">
                          {supplier.reliability_score != null ? (supplier.reliability_score * 10).toFixed(1) : '—'}<span className="text-muted">/10</span>
                        </td>
                        <td className="text-right px-4 py-3 font-mono">
                          {supplier.price_score != null ? (supplier.price_score * 10).toFixed(1) : '—'}<span className="text-muted">/10</span>
                        </td>
                        <td className="text-right px-4 py-3 font-mono">
                          {supplier.delivery_time_days ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-muted text-xs max-w-xs truncate">
                          {formatCategories(supplier.supplies_categories)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleEdit(supplier)}
                              className="p-1.5 text-muted hover:text-accent hover:bg-blue-50 rounded cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(supplier)}
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
      </div>

      <AddSupplierModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchSuppliers}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-5 h-5 text-danger" />
              </div>
              <h3 className="text-lg font-semibold text-text">Delete Supplier</h3>
            </div>
            <p className="text-sm text-muted mb-1">
              Are you sure you want to delete{' '}
              <span className="font-medium text-text">{deleteTarget.supplier_name}</span>?
            </p>
            <p className="text-xs text-muted mb-6">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-muted bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-danger rounded-lg hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
