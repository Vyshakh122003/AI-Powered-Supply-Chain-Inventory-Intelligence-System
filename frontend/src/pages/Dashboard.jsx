import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { apiTriggerWorkflow, WORKFLOW_IDS, triggerWebhook, WEBHOOKS } from '../lib/config'
import { formatDate, getHealthColor, getHealthBg, calculateHealthScore } from '../lib/helpers'
import KPICard from '../components/KPICard'
import RiskBadge from '../components/RiskBadge'
import EmptyState from '../components/EmptyState'
import toast from 'react-hot-toast'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  Package, AlertTriangle, RotateCcw, Activity,
  Zap, MessageCircle, Loader2, TrendingUp,
} from 'lucide-react'

export default function Dashboard() {
  const [products, setProducts] = useState([])
  const [alerts, setAlerts] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [snapshots, setSnapshots] = useState([])
  const [latestSnapshot, setLatestSnapshot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [runningPipeline, setRunningPipeline] = useState(false)
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false)

  const fetchData = async () => {
    try {
      const [productsRes, alertsRes, suggestionsRes, snapshotsRes] = await Promise.all([
        supabase.from('Products').select('product_id, risk_level'),
        supabase.from('Stock Alerts').select('*').eq('alert_status', 'Active').order('alert_date', { ascending: false }).limit(5),
        supabase.from('Reorder Suggestions').select('id').eq('status', 'Pending'),
        supabase.from('Daily Snapshots').select('*').order('snapshot_date', { ascending: false }).limit(30),
      ])

      setProducts(productsRes.data || [])
      setAlerts(alertsRes.data || [])
      setSuggestions(suggestionsRes.data || [])

      const snapshotData = (snapshotsRes.data || []).reverse()
      setSnapshots(snapshotData)
      if (snapshotsRes.data && snapshotsRes.data.length > 0) {
        setLatestSnapshot(snapshotsRes.data[0])
      }
    } catch {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Realtime subscriptions
    const alertChannel = supabase
      .channel('dashboard-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Stock Alerts' }, () => {
        fetchData()
      })
      .subscribe()

    const productChannel = supabase
      .channel('dashboard-products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Products' }, () => {
        fetchData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(alertChannel)
      supabase.removeChannel(productChannel)
    }
  }, [])

  const totalProducts = products.length
  const highRisk = products.filter(p => p.risk_level === 'HIGH').length
  const mediumRisk = products.filter(p => p.risk_level === 'MEDIUM').length
  const lowRisk = products.filter(p => p.risk_level === 'LOW').length

  // Calculate health score from live product data, fallback to latest snapshot
  const healthScore = latestSnapshot
    ? latestSnapshot.health_score
    : calculateHealthScore(lowRisk, mediumRisk, totalProducts)

  const handleRunPipeline = async () => {
    setRunningPipeline(true)
    try {
      await apiTriggerWorkflow(WORKFLOW_IDS.WF08)
      toast.success('Pipeline started — results update automatically in ~60 seconds')
    } catch (err) {
      console.error('Pipeline error:', err)
      toast.error(`Failed to start pipeline: ${err.message}`)
    } finally {
      setRunningPipeline(false)
    }
  }

  const handleSendWhatsApp = async () => {
    setSendingWhatsApp(true)
    try {
      await triggerWebhook(WEBHOOKS.sendWhatsApp)
      toast.success('WhatsApp alert sent!')
    } catch {
      toast.error('Failed to send WhatsApp alert')
    } finally {
      setSendingWhatsApp(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    )
  }

  const chartData = snapshots.map(s => ({
    date: new Date(s.snapshot_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    health: s.health_score,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">Dashboard</h1>
        <p className="text-sm text-muted mt-0.5">Your inventory intelligence at a glance</p>
      </div>

      {/* Health Score + KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Health Score — spans full width on mobile, 1 col on desktop */}
        <div className={`rounded-xl border border-border p-5 flex flex-col items-center justify-center ${getHealthBg(healthScore)}`}>
          <p className="text-sm text-muted font-medium">Health Score</p>
          <p className={`text-5xl font-bold mt-1 ${getHealthColor(healthScore)}`}>
            {healthScore}
          </p>
          <p className="text-xs text-muted mt-1">out of 100</p>
        </div>

        <KPICard
          title="Total Products"
          value={totalProducts}
          icon={Package}
          color="text-accent"
        />
        <KPICard
          title="High Risk"
          value={highRisk}
          icon={AlertTriangle}
          color="text-danger"
          subtitle={`${mediumRisk} medium, ${lowRisk} low`}
        />
        <KPICard
          title="Active Alerts"
          value={alerts.length}
          icon={Activity}
          color="text-warning"
        />
        <KPICard
          title="Pending Reorders"
          value={suggestions.length}
          icon={RotateCcw}
          color="text-success"
        />
      </div>

      {/* Charts + Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Score Trend */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            Health Score — Last 30 Days
          </h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
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
                  stroke="#2563EB"
                  strokeWidth={2}
                  dot={{ fill: '#2563EB', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              icon={TrendingUp}
              title="No snapshot data yet"
              description="Run the full pipeline to generate daily snapshots"
            />
          )}
        </div>

        {/* Recent Alerts */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            Recent Alerts
          </h3>
          {alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map(alert => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100"
                >
                  <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text truncate">
                      {alert.product_name}
                    </p>
                    <p className="text-xs text-muted">
                      Stock: {alert.current_stock} / Threshold: {alert.reorder_threshold}
                    </p>
                    <p className="text-xs text-muted">{formatDate(alert.alert_date)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={AlertTriangle}
              title="No active alerts"
              description="All products are well-stocked"
            />
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-accent" />
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleRunPipeline}
            disabled={runningPipeline}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {runningPipeline ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {runningPipeline ? 'Running...' : 'Run Full Pipeline'}
          </button>
          <p className="text-xs text-muted self-center">Results appear automatically within ~60 seconds</p>
          <button
            onClick={handleSendWhatsApp}
            disabled={sendingWhatsApp}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-success text-white text-sm font-medium rounded-lg hover:bg-success/90 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {sendingWhatsApp ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
            {sendingWhatsApp ? 'Sending...' : 'Send WhatsApp Alert'}
          </button>
        </div>
      </div>
    </div>
  )
}
