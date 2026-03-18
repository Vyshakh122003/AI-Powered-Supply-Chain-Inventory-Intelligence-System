import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { ShieldAlert } from 'lucide-react'

const RISK_COLORS = {
  'Out of Stock': '#94A3B8',
  'High Risk': '#DC2626',
  'Medium Risk': '#D97706',
  'Low Risk': '#059669',
}

export default function RiskDonutChart({ data, totalProducts, loading }) {
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

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <h3 className="text-sm font-semibold text-text mb-1 flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-red-500" />
        Stock Risk Distribution
      </h3>
      <div className="flex flex-col items-center">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
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
            {/* Center label */}
            <text x="50%" y="46%" textAnchor="middle" className="fill-gray-900 text-lg font-bold">
              {totalProducts}
            </text>
            <text x="50%" y="56%" textAnchor="middle" className="fill-gray-400 text-[10px]">
              products
            </text>
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-1">
          {data.map(d => (
            <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: RISK_COLORS[d.name] }}
              />
              {d.name}: {d.value} ({totalProducts > 0 ? Math.round((d.value / totalProducts) * 100) : 0}%)
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
