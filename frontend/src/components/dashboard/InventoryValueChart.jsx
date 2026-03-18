import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { formatCurrency } from '../../lib/helpers'
import { Package } from 'lucide-react'

const RISK_BAR_COLORS = {
  HIGH: '#DC2626',
  MEDIUM: '#D97706',
  LOW: '#059669',
  UNKNOWN: '#94A3B8',
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-text mb-1">{d.name}</p>
      <p className="text-muted">Stock: {d.stock} units</p>
      <p className="text-muted">Unit Price: {formatCurrency(d.unitPrice)}</p>
      <p className="font-bold text-text mt-1">Value: {formatCurrency(d.value)}</p>
    </div>
  )
}

export default function InventoryValueChart({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-border p-5 animate-pulse min-h-[280px]">
        <div className="h-4 w-40 bg-gray-100 rounded mb-4" />
        <div className="space-y-3 mt-6">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-5 bg-gray-50 rounded" style={{ width: `${90 - i * 12}%` }} />
          ))}
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-border p-5 flex flex-col items-center justify-center min-h-[280px]">
        <Package className="w-8 h-8 text-muted mb-2" />
        <p className="text-sm font-medium text-muted">No inventory data</p>
        <p className="text-xs text-muted">Add products to see value at risk</p>
      </div>
    )
  }

  // Take top 8, sorted by value descending
  const chartData = data.slice(0, 8)

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
        <Package className="w-4 h-4 text-blue-500" />
        Inventory Value at Risk
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 10 }}
            stroke="#CBD5E1"
            tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
          />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fontSize: 10 }}
            stroke="#CBD5E1"
            width={80}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC' }} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} animationDuration={800} barSize={18}>
            {chartData.map((d, i) => (
              <Cell key={i} fill={RISK_BAR_COLORS[d.risk] || '#94A3B8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
