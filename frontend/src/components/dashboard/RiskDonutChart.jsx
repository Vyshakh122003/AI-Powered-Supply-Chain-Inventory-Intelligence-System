import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { ArrowRight, ShieldAlert } from 'lucide-react'

const RISK_COLORS = {
  'Out of Stock': '#94A3B8',
  'High Risk': '#DC2626',
  'Medium Risk': '#D97706',
  'Low Risk': '#059669',
}

const RISK_META = [
  { name: 'Out of Stock', label: 'Out of Stock', icon: '🔴', query: 'OUT_OF_STOCK' },
  { name: 'High Risk', label: 'High Risk', icon: '🟠', query: 'HIGH' },
  { name: 'Medium Risk', label: 'Medium Risk', icon: '🟡', query: 'MEDIUM' },
  { name: 'Low Risk', label: 'Low Risk', icon: '🟢', query: 'LOW' },
]

export default function RiskDonutChart({ data, totalProducts, loading, onSelectRisk }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-border p-5 animate-pulse min-h-[280px]">
        <div className="h-4 w-36 bg-gray-100 rounded mb-4" />
        <div className="w-32 h-32 rounded-full bg-gray-50 mx-auto mt-6" />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-border p-5 flex flex-col items-center justify-center min-h-[280px]">
        <ShieldAlert className="w-8 h-8 text-muted mb-2" />
        <p className="text-sm font-medium text-muted">No products</p>
        <p className="text-xs text-muted">Add products to see risk distribution</p>
      </div>
    )
  }

  const valueMap = Object.fromEntries((data || []).map(d => [d.name, d.value]))

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <h3 className="text-sm font-semibold text-text mb-1 flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-red-500" />
        Stock Status Overview
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start mt-3">
        <div className="md:col-span-2 space-y-2">
          {RISK_META.map(row => {
            const count = valueMap[row.name] || 0
            const percent = totalProducts > 0 ? Math.round((count / totalProducts) * 100) : 0

            return (
              <button
                key={row.name}
                onClick={() => onSelectRisk && onSelectRisk(row.query)}
                className="w-full text-left border border-gray-100 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{row.icon}</span>
                    <span className="text-xs font-semibold uppercase tracking-wide text-text">{row.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-text">{count}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-2 bg-gray-100 rounded-full flex-1 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${percent}%`, backgroundColor: RISK_COLORS[row.name] }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-muted w-8 text-right">{percent}%</span>
                </div>
              </button>
            )
          })}
        </div>

        <div className="w-full">
          <ResponsiveContainer width="100%" height={170}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={62}
                paddingAngle={3}
                animationDuration={800}
                animationBegin={200}
              >
                {data.map((d, i) => (
                  <Cell key={i} fill={RISK_COLORS[d.name] || '#94A3B8'} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => `${v} product${v > 1 ? 's' : ''}`}
                contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #E2E8F0' }}
              />
              <text x="50%" y="46%" textAnchor="middle" className="fill-gray-900 text-base font-bold">
                {totalProducts}
              </text>
              <text x="50%" y="57%" textAnchor="middle" className="fill-gray-400 text-[10px]">
                products
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
