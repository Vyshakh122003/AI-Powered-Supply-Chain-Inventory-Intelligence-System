import { Package, AlertTriangle, Bell, RotateCcw } from 'lucide-react'

const cards = [
  {
    key: 'products',
    label: 'Total Products',
    icon: Package,
    color: '#2563EB',
    bg: 'bg-blue-50',
  },
  {
    key: 'highRisk',
    label: 'High Risk',
    icon: AlertTriangle,
    color: '#DC2626',
    bg: 'bg-red-50',
  },
  {
    key: 'alerts',
    label: 'Active Alerts',
    icon: Bell,
    color: '#D97706',
    bg: 'bg-orange-50',
  },
  {
    key: 'reorders',
    label: 'Pending Reorders',
    icon: RotateCcw,
    color: '#7C3AED',
    bg: 'bg-purple-50',
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
        const value = data[card.key] ?? 0
        const subtitle = card.key === 'highRisk' ? data.highRiskSubtitle : null

        return (
          <div
            key={card.key}
            className="bg-white rounded-xl border border-border p-4 hover:shadow-md transition-shadow"
          >
            <div className={`w-9 h-9 ${card.bg} rounded-lg flex items-center justify-center mb-3`}>
              <Icon className="w-4.5 h-4.5" style={{ color: card.color }} />
            </div>
            <p className="text-2xl font-bold text-text">{value}</p>
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
