import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { formatDate, getHealthColor } from '../lib/helpers'
import EmptyState from '../components/EmptyState'
import toast from 'react-hot-toast'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  BarChart3, TrendingUp, TrendingDown, Activity,
  Loader2, ShieldAlert, AlertTriangle, ChevronLeft, ChevronRight, Filter,
} from 'lucide-react'

const ROWS_PER_PAGE = 10

export default function Reports() {
  const [allSnapshots, setAllSnapshots] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState(30)
  const [tablePage, setTablePage] = useState(0)

  useEffect(() => {
    const fetchSnapshots = async () => {
      try {
        const { data, error } = await supabase
          .from('Daily Snapshots')
          .select('*')
          .order('snapshot_date', { ascending: true })
          .limit(90)

        if (error) throw error
        setAllSnapshots(data || [])
      } catch {
        toast.error('Failed to load report data')
      } finally {
        setLoading(false)
      }
    }
    fetchSnapshots()
  }, [])

  // Filter by date range
  const snapshots = useMemo(() => {
    if (!allSnapshots.length) return []
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - dateRange)
    return allSnapshots.filter(s => new Date(s.snapshot_date) >= cutoff)
  }, [allSnapshots, dateRange])

  // Reset table page when date range changes
  useEffect(() => { setTablePage(0) }, [dateRange])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    )
  }

  if (allSnapshots.length === 0) {
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

  // Stats
  const healthScores = snapshots.map(s => s.health_score).filter(s => s != null)
  const avgHealth = healthScores.length > 0
    ? Math.round(healthScores.reduce((a, b) => a + b, 0) / healthScores.length)
    : 0
  const bestDay = snapshots.reduce((best, s) =>
    (s.health_score || 0) > (best.health_score || 0) ? s : best, snapshots[0])
  const worstDay = snapshots.reduce((worst, s) =>
    (s.health_score || 0) < (worst.health_score || 0) ? s : worst, snapshots[0])

  // Chart data
  const chartData = snapshots.map(s => ({
    date: new Date(s.snapshot_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    health: s.health_score,
    high: s.high_count || 0,
    medium: s.medium_count || 0,
    low: s.low_count || 0,
    alerts: s.alerts_active || 0,
    suggestions: s.suggestions_pending || 0,
    oos: s.oos_count || 0,
  }))

  // Table pagination
  const tableData = [...snapshots].reverse()
  const totalPages = Math.ceil(tableData.length / ROWS_PER_PAGE)
  const pageData = tableData.slice(tablePage * ROWS_PER_PAGE, (tablePage + 1) * ROWS_PER_PAGE)

  return (
    <div className="space-y-6">
      {/* Header + Date Range */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text">Reports</h1>
          <p className="text-sm text-muted mt-0.5">Inventory health analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted" />
          <select
            value={dateRange}
            onChange={e => setDateRange(Number(e.target.value))}
            className="text-sm border border-border rounded-lg px-3 py-1.5 bg-white text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-border p-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-accent" />
            <p className="text-sm font-medium text-muted">Average Health</p>
          </div>
          <p className={`text-4xl font-bold ${getHealthColor(avgHealth)}`}>{avgHealth}</p>
          <p className="text-xs text-muted mt-1">across {snapshots.length} days</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-success" />
            <p className="text-sm font-medium text-muted">Best Day</p>
          </div>
          <p className="text-4xl font-bold text-success">{bestDay?.health_score ?? 0}</p>
          <p className="text-xs text-muted mt-1">{formatDate(bestDay?.snapshot_date)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-danger" />
            <p className="text-sm font-medium text-muted">Worst Day</p>
          </div>
          <p className="text-4xl font-bold text-danger">{worstDay?.health_score ?? 0}</p>
          <p className="text-xs text-muted mt-1">{formatDate(worstDay?.snapshot_date)}</p>
        </div>
      </div>

      {/* Health Score Trend — Area Chart */}
      <div className="bg-white rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-accent" />
          Health Score Trend
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#059669" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94A3B8" />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#94A3B8" />
            <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #E2E8F0' }} />
            <Area
              type="monotone"
              dataKey="health"
              name="Health Score"
              stroke="#059669"
              strokeWidth={2}
              fill="url(#healthGrad)"
              dot={{ fill: '#059669', r: 2 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Second Row — Risk Over Time + Alerts Over Time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Stacked Risk Over Time */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-danger" />
            Stock Risk Over Time
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94A3B8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" />
              <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #E2E8F0' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              <Area type="monotone" dataKey="high" name="High Risk" stackId="1" stroke="#DC2626" fill="#DC2626" fillOpacity={0.6} />
              <Area type="monotone" dataKey="medium" name="Medium Risk" stackId="1" stroke="#D97706" fill="#D97706" fillOpacity={0.5} />
              <Area type="monotone" dataKey="low" name="Low Risk" stackId="1" stroke="#059669" fill="#059669" fillOpacity={0.4} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Alerts + Suggestions Over Time */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            Alerts & Suggestions Over Time
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94A3B8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #E2E8F0' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="alerts" name="Active Alerts" fill="#D97706" radius={[2, 2, 0, 0]} />
              <Bar dataKey="suggestions" name="Suggestions" fill="#2563EB" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Snapshots Table — Paginated */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text">Daily Snapshots</h3>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>{tableData.length} records</span>
            {totalPages > 1 && (
              <>
                <span>|</span>
                <span>Page {tablePage + 1} of {totalPages}</span>
              </>
            )}
          </div>
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
              {pageData.map(s => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-text">{formatDate(s.snapshot_date)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`inline-flex items-center justify-center w-10 h-6 rounded-full text-xs font-bold ${
                      s.health_score >= 80 ? 'bg-green-100 text-green-700' :
                      s.health_score >= 50 ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
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
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-border flex items-center justify-end gap-2">
            <button
              onClick={() => setTablePage(p => Math.max(0, p - 1))}
              disabled={tablePage === 0}
              className="p-1.5 rounded-lg border border-border hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-text" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setTablePage(i)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  i === tablePage
                    ? 'bg-accent text-white'
                    : 'border border-border hover:bg-gray-50 text-text'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setTablePage(p => Math.min(totalPages - 1, p + 1))}
              disabled={tablePage === totalPages - 1}
              className="p-1.5 rounded-lg border border-border hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 text-text" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
