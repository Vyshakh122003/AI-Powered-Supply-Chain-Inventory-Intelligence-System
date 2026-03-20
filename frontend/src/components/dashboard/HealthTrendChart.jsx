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

function getScoreBand(score) {
  if (score >= 80) return 'Healthy'
  if (score >= 50) return 'Warning'
  return 'Critical'
}

function TrendTooltip({ active, payload }) {
  if (!active || !payload?.[0]) return null

  const d = payload[0].payload

  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-text mb-1">{d.date}</p>
      <p className="text-muted">Score: <span className="font-semibold text-text">{d.score}</span></p>
      <p className="text-muted">Status: <span className="font-semibold text-text">{getScoreBand(d.score)}</span></p>
    </div>
  )
}

export default function HealthTrendChart({ snapshots, currentScore, loading }) {
  const chartData = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

    const pastData = (snapshots || [])
      .filter(s => 
        s.health_score !== null && 
        s.health_score > 0 && 
        s.health_score <= 100 && 
        s.total_products > 0
      )
      .map(s => ({
        date: new Date(s.snapshot_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        score: Math.round(s.health_score),
      }))
      .filter(d => d.date !== todayStr)

    return [...pastData, { date: todayStr, score: currentScore }]
  }, [snapshots, currentScore])

  const avgScore = useMemo(() => {
    if (chartData.length === 0) return 0
    return Math.round(chartData.reduce((sum, d) => sum + d.score, 0) / chartData.length)
  }, [chartData])

  const color = getGradientColor(currentScore)

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-border p-5 animate-pulse min-h-[300px]">
        <div className="h-4 w-52 bg-gray-100 rounded mb-4" />
        <div className="h-48 bg-gray-50 rounded mt-4" />
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-border p-5 flex flex-col items-center justify-center min-h-[300px]">
        <TrendingUp className="w-8 h-8 text-muted mb-2" />
        <p className="text-sm font-medium text-muted">No valid trend data yet</p>
        <p className="text-xs text-muted">Snapshots with health score above 0 will appear here</p>
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
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="dashHealthGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16A34A" stopOpacity={0.22} />
              <stop offset="50%" stopColor="#EA580C" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#DC2626" stopOpacity={0.14} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#CBD5E1" />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#CBD5E1" />
          <Tooltip content={<TrendTooltip />} />
          <ReferenceLine
            y={50}
            stroke="#F59E0B"
            strokeDasharray="4 4"
            label={{ value: 'Warning threshold', position: 'insideTopLeft', fontSize: 10, fill: '#B45309' }}
          />
          <ReferenceLine
            y={80}
            stroke="#16A34A"
            strokeDasharray="4 4"
            label={{ value: 'Healthy threshold', position: 'insideTopRight', fontSize: 10, fill: '#166534' }}
          />
          <ReferenceLine
            y={avgScore}
            stroke="#94A3B8"
            strokeDasharray="6 4"
            label={{ value: `Avg ${avgScore}`, position: 'right', fontSize: 10, fill: '#94A3B8' }}
          />
          <Area
            type="monotone"
            dataKey="score"
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
