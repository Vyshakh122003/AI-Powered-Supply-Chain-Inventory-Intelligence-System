import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { triggerWebhook, WEBHOOKS } from '../lib/config'
import { formatDate, formatCurrency, getHealthColor, getHealthBg, calculateHealthScore, getRiskClasses } from '../lib/helpers'
import KPICard from '../components/KPICard'
import EmptyState from '../components/EmptyState'
import toast from 'react-hot-toast'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart as RBarChart, Bar,
} from 'recharts'
import {
  Package, AlertTriangle, RotateCcw, Activity,
  Zap, MessageCircle, Loader2, TrendingUp,
  ShieldAlert, Clock, Truck,
} from 'lucide-react'

export default function Dashboard() {
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [alerts, setAlerts] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [snapshots, setSnapshots] = useState([])
  const [loading, setLoading] = useState(true)
  const [runningPipeline, setRunningPipeline] = useState(false)
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false)

  const fetchData = async () => {
    try {
      const [productsRes, suppliersRes, alertsRes, suggestionsRes, snapshotsRes] = await Promise.all([
        supabase.from('Products').select('*'),
        supabase.from('Suppliers').select('supplier_id, supplier_name, composite_score, supplier_grade'),
        supabase.from('Stock Alerts').select('*').eq('alert_status', 'Active').order('alert_date', { ascending: false }).limit(5),
        supabase.from('Reorder Suggestions').select('id').eq('status', 'Pending'),
        supabase.from('Daily Snapshots').select('*').order('snapshot_date', { ascending: false }).limit(30),
      ])

      setProducts(productsRes.data || [])
      setSuppliers(suppliersRes.data || [])
      setAlerts(alertsRes.data || [])
      setSuggestions(suggestionsRes.data || [])
      setSnapshots((snapshotsRes.data || []).reverse())
    } catch {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    const alertChannel = supabase
      .channel('dashboard-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Stock Alerts' }, () => fetchData())
      .subscribe()

    const productChannel = supabase
      .channel('dashboard-products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Products' }, () => fetchData())
      .subscribe()

    const snapshotChannel = supabase
      .channel('dashboard-snapshots')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Daily Snapshots' }, () => fetchData())
      .subscribe()

    return () => {
      supabase.removeChannel(alertChannel)
      supabase.removeChannel(productChannel)
      supabase.removeChannel(snapshotChannel)
    }
  }, [])

  // Derived data
  const totalProducts = products.length
  const highRisk = products.filter(p => p.risk_level === 'HIGH').length
  const mediumRisk = products.filter(p => p.risk_level === 'MEDIUM').length
  const lowRisk = products.filter(p => p.risk_level === 'LOW').length
  const oosCount = products.filter(p => (p.current_stock || 0) === 0).length
  const healthScore = calculateHealthScore(lowRisk, mediumRisk, totalProducts)

  // Donut chart data
  const riskDistribution = [
    ...(oosCount > 0 ? [{ name: 'Out of Stock', value: oosCount, color: '#94A3B8' }] : []),
    ...(highRisk - oosCount > 0 ? [{ name: 'High Risk', value: highRisk - oosCount, color: '#DC2626' }] : []),
    ...(mediumRisk > 0 ? [{ name: 'Medium Risk', value: mediumRisk, color: '#D97706' }] : []),
    ...(lowRisk > 0 ? [{ name: 'Low Risk', value: lowRisk, color: '#059669' }] : []),
  ].filter(d => d.value > 0)

  // Inventory value bar data
  const inventoryValueData = products
    .map(p => ({
      name: p.product_name,
      'Stock Value': Math.round((p.unit_price || 0) * (p.current_stock || 0)),
      risk: p.risk_level,
    }))
    .sort((a, b) => b['Stock Value'] - a['Stock Value'])

  // Supplier performance bar list
  const supplierData = suppliers
    .map(s => ({
      name: s.supplier_name,
      value: s.composite_score || 0,
      grade: s.supplier_grade,
    }))
    .sort((a, b) => b.value - a.value)

  // Critical products (top 3 by urgency)
  const criticalProducts = [...products]
    .sort((a, b) => (a.days_to_stockout || 0) - (b.days_to_stockout || 0))
    .slice(0, 3)

  // Chart data
  const chartData = snapshots.map(s => ({
    date: new Date(s.snapshot_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    health: s.health_score,
  }))

  const handleRunPipeline = async () => {
    setRunningPipeline(true)
    try {
      await triggerWebhook(WEBHOOKS.runPipeline)
      toast.success('Pipeline started — results update automatically in ~60s')
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

  const healthColor = healthScore >= 80 ? '#059669' : healthScore >= 50 ? '#D97706' : '#DC2626'

  return (
    <div className="space-y-6">
      {/* Header + Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text">Dashboard</h1>
          <p className="text-sm text-muted mt-0.5">Your inventory intelligence at a glance</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunPipeline}
            disabled={runningPipeline}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {runningPipeline ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {runningPipeline ? 'Running...' : 'Run Pipeline'}
          </button>
          <button
            onClick={handleSendWhatsApp}
            disabled={sendingWhatsApp}
            className="inline-flex items-center gap-2 px-4 py-2 bg-success text-white text-sm font-medium rounded-lg hover:bg-success/90 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {sendingWhatsApp ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
            {sendingWhatsApp ? 'Sending...' : 'WhatsApp'}
          </button>
        </div>
      </div>

      {/* Health Score Gauge + KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Health Score Gauge */}
        <div className={`rounded-xl border border-border p-5 flex flex-col items-center justify-center ${getHealthBg(healthScore)}`}>
          <p className="text-xs font-medium text-muted mb-2">Store Health</p>
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#E2E8F0" strokeWidth="10" />
              <circle cx="60" cy="60" r="52" fill="none" stroke={healthColor} strokeWidth="10"
                strokeDasharray={`${(healthScore / 100) * 2 * Math.PI * 52} ${2 * Math.PI * 52}`}
                strokeLinecap="round" className="transition-all duration-700" />
            </svg>
            <span className={`absolute text-2xl font-bold ${getHealthColor(healthScore)}`}>{healthScore}</span>
          </div>
          <p className="text-xs text-muted mt-2">out of 100</p>
        </div>

        <KPICard title="Total Products" value={totalProducts} icon={Package} color="text-accent" />
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
          subtitle={alerts.length === 0 && highRisk > 0 ? 'Run pipeline to refresh' : undefined}
        />
        <KPICard title="Pending Reorders" value={suggestions.length} icon={RotateCcw} color="text-success" />
      </div>

      {/* Charts Row — 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Risk Distribution Donut */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-danger" />
            Stock Risk Distribution
          </h3>
          {riskDistribution.length > 0 ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    animationDuration={800}
                  >
                    {riskDistribution.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => `${v} product${v > 1 ? 's' : ''}`}
                    contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #E2E8F0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-3">
                {riskDistribution.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    {d.name}: {d.value}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState icon={ShieldAlert} title="No products" description="Add products to see risk distribution" />
          )}
        </div>

        {/* Inventory Value by Product */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-accent" />
            Inventory Value by Product
          </h3>
          {inventoryValueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={208}>
              <RBarChart data={inventoryValueData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" width={60}
                  tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
                />
                <Tooltip
                  formatter={(v) => [formatCurrency(v), 'Stock Value']}
                  contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #E2E8F0' }}
                />
                <Bar dataKey="Stock Value" fill="#2563EB" radius={[4, 4, 0, 0]} animationDuration={800} />
              </RBarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={Package} title="No data" description="Add products to see inventory value" />
          )}
        </div>

        {/* Supplier Performance */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
            <Truck className="w-4 h-4 text-success" />
            Supplier Performance
          </h3>
          {supplierData.length > 0 ? (
            <div className="space-y-4 mt-2">
              {supplierData.map(s => {
                const gradeColor = s.grade === 'A' ? 'text-green-700 bg-green-100' :
                  s.grade === 'B' ? 'text-blue-700 bg-blue-100' :
                  s.grade === 'C' ? 'text-yellow-700 bg-yellow-100' :
                  'text-red-700 bg-red-100'
                const barColor = s.grade === 'A' ? '#059669' :
                  s.grade === 'B' ? '#2563EB' :
                  s.grade === 'C' ? '#D97706' : '#DC2626'
                return (
                  <div key={s.name} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text truncate">{s.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${gradeColor}`}>
                          {s.grade}
                        </span>
                        <span className="text-sm font-bold text-text">{s.value}</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-700"
                        style={{ width: `${s.value}%`, backgroundColor: barColor }}
                      />
                    </div>
                  </div>
                )
              })}
              <p className="text-xs text-muted text-center mt-2">Score out of 100 (reliability + price + speed)</p>
            </div>
          ) : (
            <EmptyState icon={Truck} title="No suppliers" description="Add suppliers to see performance" />
          )}
        </div>
      </div>

      {/* Health Trend + Critical Products + Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Health Score Trend — 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            Health Score Trend — Last 30 Days
          </h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
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
                  stroke="#2563EB"
                  strokeWidth={2}
                  fill="url(#healthGradient)"
                  dot={{ fill: '#2563EB', r: 2 }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={TrendingUp} title="No snapshot data" description="Run the pipeline to start tracking health" />
          )}
        </div>

        {/* Critical Products */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-danger" />
            Critical Products
          </h3>
          {criticalProducts.length > 0 ? (
            <div className="space-y-3">
              {criticalProducts.map(p => {
                const daysLeft = p.days_to_stockout || 0
                const supplier = suppliers.find(s => s.supplier_id === p.preferred_supplier_id)
                return (
                  <div key={p.product_id} className="p-3 bg-gray-50 rounded-lg border border-border">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-sm font-medium text-text leading-snug" title={p.product_name}>{p.product_name}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${getRiskClasses(p.risk_level)}`}>
                        {p.risk_level}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <span className={`font-bold ${daysLeft <= 3 ? 'text-red-600' : daysLeft <= 7 ? 'text-orange-600' : 'text-green-600'}`}>
                        {daysLeft === 0 ? 'OUT OF STOCK' : `${daysLeft} days left`}
                      </span>
                      <span>Stock: {p.current_stock}/{p.reorder_threshold}</span>
                    </div>
                    {supplier && (
                      <p className="text-xs text-muted mt-1">Supplier: {supplier.supplier_name}</p>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState icon={Clock} title="No products" description="Add products to see critical items" />
          )}
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-white rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" />
          Recent Alerts
        </h3>
        {alerts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100"
              >
                <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text leading-snug" title={alert.product_name}>{alert.product_name}</p>
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
            description={
              highRisk > 0
                ? `${highRisk} high-risk product${highRisk > 1 ? 's' : ''} detected — run the pipeline to generate fresh alerts`
                : 'All products are well-stocked'
            }
          />
        )}
      </div>
    </div>
  )
}
