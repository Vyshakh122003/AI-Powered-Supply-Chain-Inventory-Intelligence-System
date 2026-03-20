import { useNavigate } from 'react-router-dom'
import { Package, ArrowRight } from 'lucide-react'

function getAction(days) {
  if (days <= 3) return 'Order Now'
  if (days <= 4) return 'Reorder Soon'
  return 'Monitor'
}

function getRowTint(days) {
  if (days <= 3) return 'bg-red-50 border-red-100'
  if (days <= 7) return 'bg-orange-50 border-orange-100'
  return 'bg-white border-gray-100'
}

export default function InventoryValueChart({ data, loading }) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-border p-5 animate-pulse min-h-[280px]">
        <div className="h-4 w-52 bg-gray-100 rounded mb-4" />
        <div className="space-y-3 mt-6">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-10 bg-gray-50 rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-border p-5 flex flex-col items-center justify-center min-h-[280px]">
        <Package className="w-8 h-8 text-muted mb-2" />
        <p className="text-sm font-medium text-muted">No products need action</p>
        <p className="text-xs text-muted">Urgent products will appear here</p>
      </div>
    )
  }

  const ranked = data.slice(0, 5)

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
        <Package className="w-4 h-4 text-red-500" />
        Top 5 Products Needing Action
      </h3>
      <div className="grid grid-cols-[34px_1fr_60px_72px_120px] gap-2 px-2 py-1 text-[10px] uppercase tracking-wide text-muted font-semibold border-b border-gray-100">
        <span>Rank</span>
        <span>Product</span>
        <span className="text-right">Stock</span>
        <span className="text-right">Days Left</span>
        <span className="text-right">Action</span>
      </div>
      <div className="mt-2 space-y-2">
        {ranked.map((p, idx) => {
          const days = p.days_to_stockout ?? 999
          const action = getAction(days)

          return (
            <div key={p.product_id} className={`grid grid-cols-[34px_1fr_60px_72px_120px] gap-2 items-center px-2 py-2 border rounded-lg ${getRowTint(days)}`}>
              <span className="text-xs font-bold text-muted">{idx + 1}</span>
              <span className="text-sm font-medium text-text truncate">{p.product_name || p.product_id}</span>
              <span className="text-sm font-mono text-right text-text">{p.current_stock || 0}</span>
              <span className="text-sm text-right text-text">{days} day{days === 1 ? '' : 's'}</span>
              <button
                onClick={() => navigate('/reorder')}
                className="inline-flex items-center justify-end gap-1 text-xs font-semibold text-accent hover:text-blue-700 cursor-pointer"
              >
                {action}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
