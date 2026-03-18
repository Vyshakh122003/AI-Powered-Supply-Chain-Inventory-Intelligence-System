import { RefreshCw, ArrowUp, ArrowDown, Pencil, Activity } from 'lucide-react'

const TYPE_CONFIG = {
  sale: { icon: ArrowDown, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Sale' },
  delivery: { icon: ArrowUp, color: 'text-green-500', bg: 'bg-green-50', label: 'Delivery' },
  restock: { icon: ArrowUp, color: 'text-green-500', bg: 'bg-green-50', label: 'Restock' },
  adjustment: { icon: Pencil, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Adjustment' },
  manual_update: { icon: Pencil, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Update' },
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function ActivityFeed({ transactions, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-border p-5 animate-pulse">
        <div className="h-4 w-28 bg-gray-100 rounded mb-4" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-gray-100 shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-full bg-gray-50 rounded" />
                <div className="h-2.5 w-16 bg-gray-50 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-border p-5 flex flex-col items-center justify-center min-h-[280px]">
        <Activity className="w-8 h-8 text-muted mb-2" />
        <p className="text-sm font-medium text-muted">No activity yet</p>
        <p className="text-xs text-muted">Run the pipeline to start tracking</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
        <Activity className="w-4 h-4 text-blue-500" />
        Live Activity
      </h3>
      <div className="space-y-3">
        {transactions.map(t => {
          const config = TYPE_CONFIG[t.transaction_type] || TYPE_CONFIG.adjustment
          const Icon = config.icon
          const qty = t.quantity_change || 0
          const sign = qty >= 0 ? '+' : ''

          return (
            <div key={t.id} className="flex items-start gap-2.5">
              <div className={`w-7 h-7 ${config.bg} rounded-lg flex items-center justify-center shrink-0 mt-0.5`}>
                <Icon className={`w-3.5 h-3.5 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-text truncate">
                  {t.product_name || t.product_id}
                </p>
                <p className="text-[10px] text-muted">
                  {config.label} · {sign}{qty} units → Stock: {t.new_stock_level}
                </p>
              </div>
              <span className="text-[10px] text-muted shrink-0 mt-0.5">
                {timeAgo(t.created_at)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
