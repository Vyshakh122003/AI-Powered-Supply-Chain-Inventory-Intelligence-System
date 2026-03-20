import { formatCurrency } from '../../lib/helpers'
import { Bell, Clock3, Sparkles, TriangleAlert } from 'lucide-react'

const cards = [
  {
    key: 'nextStockoutDays',
    label: 'Days to Next Stockout',
    icon: Clock3,
    color: '#DC2626',
    bg: 'bg-red-50',
  },
  {
    key: 'inventoryAtRisk',
    label: 'Inventory at Risk',
    icon: TriangleAlert,
    color: '#B45309',
    bg: 'bg-orange-50',
  },
  {
    key: 'alerts',
    label: 'Active Alerts',
    icon: Bell,
    color: '#2563EB',
    bg: 'bg-blue-50',
  },
  {
    key: 'reorders',
    label: 'AI Suggestions Ready',
    icon: Sparkles,
    color: '#0891B2',
    bg: 'bg-cyan-50',
  },
]

export default function KPICards({ data, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-xl border border-border p-4 animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-gray-100 mb-3" />
            <div className="h-7 w-12 bg-gray-100 rounded mb-1" />
            <div className="h-3 w-20 bg-gray-50 rounded" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map(card => {
        const Icon = card.icon
        const rawValue = data[card.key] ?? 0

        const value = (() => {
          if (card.key === 'nextStockoutDays') {
            if (rawValue == null) return '—'
            return `${rawValue} day${rawValue === 1 ? '' : 's'}`
          }
          if (card.key === 'inventoryAtRisk') {
            return `${formatCurrency(Math.round(rawValue))} at risk`
          }
          return rawValue
        })()

        const subtitle = (() => {
          if (card.key === 'nextStockoutDays') return data.nextStockoutLabel || 'No stockout forecast available'
          if (card.key === 'alerts') return `${data.alertsSinceYesterday || 0} since yesterday`
          if (card.key === 'reorders') return 'Tap to review'
          return null
        })()

        const valueClass = (() => {
          if (card.key !== 'nextStockoutDays') return 'text-text'
          if (rawValue == null) return 'text-text'
          if (rawValue <= 3) return 'text-red-600'
          if (rawValue <= 7) return 'text-orange-600'
          return 'text-green-600'
        })()

        return (
          <div
            key={card.key}
            className="bg-white rounded-xl border border-border p-4 hover:shadow-md transition-shadow"
          >
            <div className={`w-9 h-9 ${card.bg} rounded-lg flex items-center justify-center mb-3`}>
              <Icon className="w-4.5 h-4.5" style={{ color: card.color }} />
            </div>
            <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
            <p className="text-xs font-medium text-muted mt-0.5">{card.label}</p>
            {subtitle && (
              <p className="text-[10px] text-muted mt-1">{subtitle}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
