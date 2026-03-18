import { useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { TrendingUp } from 'lucide-react'

function getGradientColor(score) {
  if (score >= 80) return '#059669'
  if (score >= 50) return '#D97706'
  return '#DC2626'
}

export default function HealthTrendChart({ data, currentScore, loading }) {
  const avgScore = useMemo(() => {
    if (!data || data.length === 0) return 0
    return Math.round(data.reduce((sum, d) => sum + d.health, 0) / data.length)
  }, [data])

  const color = getGradientColor(currentScore)

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-border p-5 animate-pulse min-h-[300px]">
        <div className="h-4 w-52 bg-gray-100 rounded mb-4" />
        <div className="h-48 bg-gray-50 rounded mt-4" />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-border p-5 flex flex-col items-center justify-center min-h-[300px]">
        <TrendingUp className="w-8 h-8 text-muted mb-2" />
        <p className="text-sm font-medium text-muted">No history yet</p>
        <p className="text-xs text-muted">Run the pipeline to start tracking health over time</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text flex items-center gap-2">
          <TrendingUp className="w-4 h-4" style={{ color }} />
          Health Score Trend — Last 30 Days
        </h3>
        <span className="text-xs text-muted">
          Avg: <span className="font-bold text-text">{avgScore}</span>
        </span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="dashHealthGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#CBD5E1" />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#CBD5E1" />
          <Tooltip
            contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #E2E8F0' }}
          />
          <ReferenceLine
            y={avgScore}
            stroke="#94A3B8"
            strokeDasharray="6 4"
            label={{ value: `Avg ${avgScore}`, position: 'right', fontSize: 10, fill: '#94A3B8' }}
          />
          <Area
            type="monotone"
            dataKey="health"
            name="Health Score"
            stroke={color}
            strokeWidth={2.5}
            fill="url(#dashHealthGradient)"
            dot={{ fill: color, r: 2.5 }}
            activeDot={{ r: 5, stroke: color, strokeWidth: 2, fill: '#fff' }}
            animationDuration={1000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
