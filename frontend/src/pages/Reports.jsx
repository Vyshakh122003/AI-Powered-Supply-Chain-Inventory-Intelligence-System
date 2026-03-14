import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatDate, getHealthColor } from '../lib/helpers'
import EmptyState from '../components/EmptyState'
import toast from 'react-hot-toast'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  BarChart3, TrendingUp, TrendingDown, Activity, Loader2,
} from 'lucide-react'

export default function Reports() {
  const [snapshots, setSnapshots] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSnapshots = async () => {
      try {
        const { data, error } = await supabase
          .from('Daily Snapshots')
          .select('*')
          .order('snapshot_date', { ascending: false })
          .limit(30)

        if (error) throw error
        setSnapshots((data || []).reverse())
      } catch {
        toast.error('Failed to load report data')
      } finally {
        setLoading(false)
      }
    }
    fetchSnapshots()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    )
  }

  if (snapshots.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Reports</h1>
          <p className="text-sm text-muted">Inventory health analytics</p>
        </div>
        <EmptyState
          icon={BarChart3}
          title="No report data available"
          description="Run the full pipeline to start generating daily snapshots"
        />
      </div>
    )
  }

  // Calculate stats
  const healthScores = snapshots.map(s => s.health_score).filter(s => s != null)
  const avgHealth = healthScores.length > 0
    ? Math.round(healthScores.reduce((a, b) => a + b, 0) / healthScores.length)
    : 0
  const bestDay = snapshots.reduce((best, s) =>
    (s.health_score || 0) > (best.health_score || 0) ? s : best, snapshots[0])
  const worstDay = snapshots.reduce((worst, s) =>
    (s.health_score || 0) < (worst.health_score || 0) ? s : worst, snapshots[0])

  const chartData = snapshots.map(s => ({
    date: new Date(s.snapshot_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    health: s.health_score,
    alerts: s.alerts_active,
    suggestions: s.suggestions_pending,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">Reports</h1>
        <p className="text-sm text-muted">Inventory health analytics — last 30 days</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-border p-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-accent" />
            <p className="text-sm font-medium text-muted">Average Health</p>
          </div>
          <p className={`text-3xl font-bold ${getHealthColor(avgHealth)}`}>{avgHealth}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-success" />
            <p className="text-sm font-medium text-muted">Best Day</p>
          </div>
          <p className="text-3xl font-bold text-success">{bestDay.health_score}</p>
          <p className="text-xs text-muted mt-1">{formatDate(bestDay.snapshot_date)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-danger" />
            <p className="text-sm font-medium text-muted">Worst Day</p>
          </div>
          <p className="text-3xl font-bold text-danger">{worstDay.health_score}</p>
          <p className="text-xs text-muted mt-1">{formatDate(worstDay.snapshot_date)}</p>
        </div>
      </div>

      {/* Health Score Trend Chart */}
      <div className="bg-white rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-accent" />
          Health Score Trend
        </h3>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94A3B8" />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#94A3B8" />
            <Tooltip
              contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #E2E8F0' }}
            />
            <Line
              type="monotone"
              dataKey="health"
              name="Health Score"
              stroke="#2563EB"
              strokeWidth={2}
              dot={{ fill: '#2563EB', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Snapshots Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-text">Daily Snapshots</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-muted">Date</th>
                <th className="text-right px-4 py-3 font-medium text-muted">Health</th>
                <th className="text-right px-4 py-3 font-medium text-muted">Products</th>
                <th className="text-right px-4 py-3 font-medium text-muted">High</th>
                <th className="text-right px-4 py-3 font-medium text-muted">Medium</th>
                <th className="text-right px-4 py-3 font-medium text-muted">Low</th>
                <th className="text-right px-4 py-3 font-medium text-muted">OOS</th>
                <th className="text-right px-4 py-3 font-medium text-muted">Alerts</th>
                <th className="text-right px-4 py-3 font-medium text-muted">Suggestions</th>
              </tr>
            </thead>
            <tbody>
              {[...snapshots].reverse().map(s => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-text">{formatDate(s.snapshot_date)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-bold ${getHealthColor(s.health_score)}`}>
                      {s.health_score}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{s.total_products}</td>
                  <td className="px-4 py-3 text-right font-mono text-red-600">{s.high_count}</td>
                  <td className="px-4 py-3 text-right font-mono text-orange-600">{s.medium_count}</td>
                  <td className="px-4 py-3 text-right font-mono text-green-600">{s.low_count}</td>
                  <td className="px-4 py-3 text-right font-mono">{s.oos_count}</td>
                  <td className="px-4 py-3 text-right font-mono">{s.alerts_active}</td>
                  <td className="px-4 py-3 text-right font-mono">{s.suggestions_pending}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
