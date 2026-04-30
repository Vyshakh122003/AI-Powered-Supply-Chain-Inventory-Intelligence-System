import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { triggerWebhook, WEBHOOKS } from '../lib/config'
import toast from 'react-hot-toast'
import {
  Zap, MessageCircle, AlertTriangle, ShoppingCart, ShieldAlert, PackageX, CheckCircle2, Loader2
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import RiskBadge from '../components/RiskBadge'
import PipelineOverlay from '../components/dashboard/PipelineOverlay'

const PIPELINE_STEPS = [
  'Initializing orchestration...',
  'Simulating daily stock depletion...',
  'Calculating stockout risks...',
  'AI generating reorder plans...',
  'Updating dashboard health metrics...'
]

export default function Dashboard() {
  const [products, setProducts] = useState([])
  const [alertsCount, setAlertsCount] = useState(0)
  const [reordersCount, setReordersCount] = useState(0)
  const [suppliers, setSuppliers] = useState([])
  const [snapshots, setSnapshots] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [pipelineState, setPipelineState] = useState('idle') // 'idle', 'running', 'complete'
  const [currentStep, setCurrentStep] = useState(0)
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false)

  const fetchData = async () => {
    try {
      const [productsRes, alertsRes, reordersRes, suppliersRes, snapshotsRes] = await Promise.all([
        supabase.from('Products').select('*'),
        supabase.from('Stock Alerts').select('id').eq('alert_status', 'Active'),
        supabase.from('Reorder Suggestions').select('id').eq('status', 'Pending'),
        supabase.from('Suppliers').select('supplier_id, supplier_name'),
        supabase.from('Daily Snapshots').select('snapshot_date, health_score').order('snapshot_date', { ascending: true }).limit(30),
      ])

      setProducts(productsRes.data || [])
      setAlertsCount(alertsRes.data?.length || 0)
      setReordersCount(reordersRes.data?.length || 0)
      setSuppliers(suppliersRes.data || [])
      setSnapshots(snapshotsRes.data || [])
    } catch {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    const channels = [
      supabase.channel('dash-products').on('postgres_changes', { event: '*', schema: 'public', table: 'Products' }, () => fetchData()).subscribe(),
      supabase.channel('dash-alerts').on('postgres_changes', { event: '*', schema: 'public', table: 'Stock Alerts' }, () => fetchData()).subscribe(),
      supabase.channel('dash-reorders').on('postgres_changes', { event: '*', schema: 'public', table: 'Reorder Suggestions' }, () => fetchData()).subscribe(),
      supabase.channel('dash-logs').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'System Logs' }, (payload) => {
        if (payload.new && payload.new.workflow_name === 'WF-08 Daily Orchestrator') {
          setPipelineState('complete')
          fetchData()
        }
      }).subscribe(),
    ]

    return () => channels.forEach(c => supabase.removeChannel(c))
  }, [])

  // Cycle through fake steps while running
  useEffect(() => {
    if (pipelineState === 'running') {
      const interval = setInterval(() => {
        setCurrentStep(prev => (prev < PIPELINE_STEPS.length - 1 ? prev + 1 : prev))
      }, 3500)
      return () => clearInterval(interval)
    } else {
      setCurrentStep(0)
    }
  }, [pipelineState])

  // Clear states after delay
  useEffect(() => {
    if (pipelineState === 'complete') {
      const t = setTimeout(() => setPipelineState('idle'), 1500)
      return () => clearTimeout(t)
    }
    if (pipelineState === 'failed') {
      const t = setTimeout(() => setPipelineState('idle'), 3500)
      return () => clearTimeout(t)
    }
  }, [pipelineState])

  /* --- Derived Data --- */
  const total = products.length
  let healthScore = total > 0 ? 0 : '-'
  if (total > 0) {
    const oos = products.filter(p => (p.current_stock || 0) === 0).length
    const high = products.filter(p => p.risk_level === 'HIGH' && (p.current_stock || 0) > 0).length
    const medium = products.filter(p => p.risk_level === 'MEDIUM').length
    const low = products.filter(p => p.risk_level === 'LOW').length
    const score = Math.round(((low * 100) + (medium * 70) + (high * 30) + (oos * 5)) / total)
    healthScore = Math.min(100, Math.max(0, score))
  }

  const highRiskCount = products.filter(p => p.risk_level === 'HIGH' && (p.current_stock || 0) > 0).length
  const oosCount = products.filter(p => (p.current_stock || 0) === 0).length

  // Subtitle format: Friday, 14 March 2026
  const todayLabel = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  // Critical products: HIGH or OOS, max 8, sorted by days_to_stockout ASC
  const criticalProducts = products
    .filter(p => p.risk_level === 'HIGH' || (p.current_stock || 0) === 0)
    .sort((a, b) => (a.days_to_stockout ?? 999) - (b.days_to_stockout ?? 999))
    .slice(0, 8)

  // Supplier Name Lookup Helper
  const getSupplierName = (id) => {
    const s = suppliers.find(s => s.supplier_id === id)
    return s ? s.supplier_name : 'Unknown'
  }

  // Chart Data
  const chartData = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    const pastData = snapshots
      .filter(s => s.health_score !== null && s.health_score > 0)
      .map(s => ({
        date: new Date(s.snapshot_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        score: Math.round(s.health_score),
      }))
      .filter(d => d.date !== todayStr)

    return [...pastData, { date: todayStr, score: healthScore }]
  }, [snapshots, healthScore])

  /* --- Handlers --- */
  const handleRunPipeline = async () => {
    setPipelineState('running')
    try {
      await triggerWebhook(WEBHOOKS.runPipeline)
      // Safety timeout: transition to failed after 20s if DB event never arrives.
      setTimeout(() => {
        setPipelineState((prev) => {
          if (prev === 'running') {
            return 'failed'
          }
          return prev
        })
      }, 20000)
    } catch (e) {
      toast.error(e.message || 'Failed to start pipeline')
      setPipelineState('idle')
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

  /* --- UI Helpers --- */
  const getScoreColorClass = (score) => {
    if (score === '-') return 'text-muted'
    if (score >= 80) return 'text-success'
    if (score >= 50) return 'text-warning'
    return 'text-danger'
  }

  const getDaysPill = (days) => {
    if (days == null) return <span className="text-muted text-xs">-</span>
    if (days <= 1) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700">{days} {days === 1 ? 'day' : 'days'}</span>
    if (days <= 3) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-700">{days} {days === 1 ? 'day' : 'days'}</span>
    if (days <= 7) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">{days} {days === 1 ? 'day' : 'days'}</span>
    return <span className="text-muted text-xs font-medium">{days} days</span>
  }

  const ChartTooltip = ({ active, payload }) => {
    if (!active || !payload?.[0]) return null
    const d = payload[0].payload
    return (
      <div className="bg-white border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
        <p className="font-semibold text-text mb-1">{d.date}</p>
        <p className="text-muted">Score: <span className="font-semibold text-text">{d.score}</span></p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8 relative">
      
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Dashboard</h1>
          <p className="text-sm text-muted mt-1">{todayLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRunPipeline}
            disabled={pipelineState !== 'idle'}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-border text-text text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {pipelineState === 'running' ? <Loader2 className="w-4 h-4 animate-spin text-accent" /> : <Zap className="w-4 h-4 text-accent" />}
            {pipelineState === 'running' ? 'Running...' : pipelineState === 'complete' ? 'Done!' : 'Run Pipeline'}
          </button>
          <button
            onClick={handleSendWhatsApp}
            disabled={sendingWhatsApp}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {sendingWhatsApp ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
            Send WhatsApp
          </button>
        </div>
      </div>

      {/* 2. HEALTH SCORE + 4 KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Score Card */}
        <div className="bg-white rounded-xl border border-border p-5 flex flex-col justify-center items-center text-center shadow-sm">
          <span className={`text-5xl font-extrabold ${getScoreColorClass(healthScore)}`}>
            {healthScore}
          </span>
          <span className="text-sm font-medium text-muted mt-2 tracking-wide uppercase">Inventory Health</span>
        </div>
        
        {/* KPI 1 */}
        <div className="bg-white rounded-xl border border-border p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-muted">Active Alerts</p>
            <div className="p-2 bg-orange-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
          </div>
          <p className="text-3xl font-bold text-text mt-4">{alertsCount}</p>
        </div>

        {/* KPI 2 */}
        <div className="bg-white rounded-xl border border-border p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-muted">Pending Reorders</p>
            <div className="p-2 bg-blue-50 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-accent" />
            </div>
          </div>
          <p className="text-3xl font-bold text-text mt-4">{reordersCount}</p>
        </div>

        {/* KPI 3 */}
        <div className="bg-white rounded-xl border border-border p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-muted">High Risk</p>
            <div className="p-2 bg-red-50 rounded-lg">
              <ShieldAlert className="w-5 h-5 text-danger" />
            </div>
          </div>
          <p className="text-3xl font-bold text-text mt-4">{highRiskCount}</p>
        </div>

        {/* KPI 4 */}
        <div className="bg-white rounded-xl border border-border p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-muted">Out of Stock</p>
            <div className="p-2 bg-gray-100 rounded-lg">
              <PackageX className="w-5 h-5 text-gray-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-text mt-4">{oosCount}</p>
        </div>
      </div>

      {/* 3. CRITICAL PRODUCTS TABLE */}
      <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-danger animate-pulse" />
          <h2 className="text-base font-semibold text-text">Needs Attention</h2>
        </div>
        
        {total === 0 ? (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <PackageX className="w-10 h-10 text-muted mb-3" />
            <p className="text-sm font-medium text-text">No products in inventory</p>
            <p className="text-xs text-muted mt-1">Add your first product to see stock intelligence.</p>
          </div>
        ) : criticalProducts.length === 0 ? (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="w-10 h-10 text-success mb-3" />
            <p className="text-sm font-medium text-text">All products are well stocked</p>
            <p className="text-xs text-muted mt-1">No high risk or out of stock items found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-xs text-muted uppercase tracking-wider border-b border-border">
                  <th className="font-medium px-5 py-3">Product Name</th>
                  <th className="font-medium px-5 py-3 text-right">Stock</th>
                  <th className="font-medium px-5 py-3 text-right">Threshold</th>
                  <th className="font-medium px-5 py-3 text-center">Days Left</th>
                  <th className="font-medium px-5 py-3">Risk</th>
                  <th className="font-medium px-5 py-3">Supplier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {criticalProducts.map(p => (
                  <tr key={p.product_id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-text">{p.product_name}</td>
                    <td className="px-5 py-3 text-right text-text">{p.current_stock ?? 0}</td>
                    <td className="px-5 py-3 text-right text-muted">{p.reorder_threshold ?? 0}</td>
                    <td className="px-5 py-3 text-center">{getDaysPill(p.days_to_stockout)}</td>
                    <td className="px-5 py-3 text-center">
                      <RiskBadge level={p.risk_level} stock={p.current_stock} />
                    </td>
                    <td className="px-5 py-3 text-muted truncate max-w-[150px]" title={getSupplierName(p.preferred_supplier_id)}>
                      {getSupplierName(p.preferred_supplier_id)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. HEALTH TREND CHART */}
      <div className="bg-white rounded-xl border border-border shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-text">Health Score — Last 30 Days</h2>
        </div>
        
        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[220px] bg-gray-50/50 rounded-lg border border-dashed border-border px-4 py-8 text-center">
            <AreaChart className="w-8 h-8 text-muted mb-2 opacity-50" />
            <p className="text-sm font-medium text-muted">Run the pipeline to start tracking health score over time</p>
          </div>
        ) : (
          <div className="w-full h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: '#64748B' }} 
                  axisLine={false} 
                  tickLine={false} 
                  dy={10} 
                />
                <YAxis 
                  domain={[0, 100]} 
                  tick={{ fontSize: 10, fill: '#64748B' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <RechartsTooltip content={<ChartTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#059669" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#scoreGradient)" 
                  activeDot={{ r: 4, strokeWidth: 0, fill: '#059669' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 5. PIPELINE EXECUTION OVERLAY */}
      <PipelineOverlay 
        pipelineState={pipelineState} 
        pipelineResult={{ products: total, alerts: alertsCount, reorders: reordersCount }}
        onClose={() => setPipelineState('idle')} 
      />

    </div>
  )
}
