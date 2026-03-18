import { getRiskClasses } from '../../lib/helpers'
import { Clock, AlertTriangle } from 'lucide-react'

function getDaysColor(days) {
  if (days <= 0) return 'text-red-700'
  if (days <= 3) return 'text-red-600'
  if (days <= 7) return 'text-orange-600'
  return 'text-green-600'
}

export default function CriticalProductsList({ products, suppliers, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-border p-5 animate-pulse">
        <div className="h-4 w-32 bg-gray-100 rounded mb-4" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-10 flex-1 bg-gray-50 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!products || products.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-border p-5 flex flex-col items-center justify-center min-h-[280px]">
        <Clock className="w-8 h-8 text-muted mb-2" />
        <p className="text-sm font-medium text-muted">No critical products</p>
        <p className="text-xs text-muted">All products are well-stocked</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-red-500" />
        Critical Products
      </h3>
      <div className="space-y-3">
        {products.map(p => {
          const daysLeft = p.days_to_stockout || 0
          const isOOS = (p.current_stock || 0) === 0
          const supplier = suppliers?.find(s => s.supplier_id === p.preferred_supplier_id)
          const threshold = p.reorder_threshold || 1
          const stockRatio = Math.min((p.current_stock || 0) / threshold, 1)

          return (
            <div key={p.product_id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-sm font-medium text-text leading-snug truncate">{p.product_name}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${getRiskClasses(p.risk_level)}`}>
                  {p.risk_level}
                </span>
              </div>

              {/* Days left + stock label */}
              <div className="flex items-center justify-between text-xs mb-2">
                <span className={`font-bold ${isOOS ? 'text-red-700' : getDaysColor(daysLeft)}`}>
                  {isOOS ? '⚠ OUT OF STOCK' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                </span>
                <span className="text-muted">
                  {p.current_stock} / {p.reorder_threshold}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${stockRatio * 100}%`,
                    backgroundColor: isOOS ? '#DC2626' : daysLeft <= 3 ? '#DC2626' : daysLeft <= 7 ? '#D97706' : '#059669',
                  }}
                />
              </div>

              {supplier && (
                <p className="text-[10px] text-muted mt-1.5">Supplier: {supplier.supplier_name}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
