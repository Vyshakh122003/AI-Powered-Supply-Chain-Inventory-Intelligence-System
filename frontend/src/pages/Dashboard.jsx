import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { triggerWebhook, WEBHOOKS } from '../lib/config'
import toast from 'react-hot-toast'
import HealthScoreGauge from '../components/dashboard/HealthScoreGauge'
import KPICards from '../components/dashboard/KPICards'
import RiskDonutChart from '../components/dashboard/RiskDonutChart'
import InventoryValueChart from '../components/dashboard/InventoryValueChart'
import SupplierPerformanceList from '../components/dashboard/SupplierPerformanceList'
import HealthTrendChart from '../components/dashboard/HealthTrendChart'
import CriticalProductsList from '../components/dashboard/CriticalProductsList'
import ActivityFeed from '../components/dashboard/ActivityFeed'
import {
  Zap, MessageCircle, Loader2,
} from 'lucide-react'

/* ─── Health Score Formula (fixed) ─── */
function computeHealthScore(products) {
  const total = products.length
  if (total === 0) return 0
  const oos = products.filter(p => (p.current_stock || 0) === 0).length
  const high = products.filter(p => p.risk_level === 'HIGH' && (p.current_stock || 0) > 0).length
  const medium = products.filter(p => p.risk_level === 'MEDIUM').length
  const low = products.filter(p => p.risk_level === 'LOW').length
  const score = Math.round(((low * 100) + (medium * 60) + (high * 20) + (oos * 0)) / total)
  return Math.min(100, Math.max(0, score))
}

export default function Dashboard() {
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [alerts, setAlerts] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [snapshots, setSnapshots] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [runningPipeline, setRunningPipeline] = useState(false)
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false)

  const fetchData = async () => {
    try {
      const [productsRes, suppliersRes, alertsRes, suggestionsRes, snapshotsRes, txRes] =
        await Promise.all([
          supabase.from('Products').select('*'),
          supabase.from('Suppliers').select('supplier_id, supplier_name, composite_score, supplier_grade'),
          supabase.from('Stock Alerts').select('*').eq('alert_status', 'Active').order('alert_date', { ascending: false }).limit(5),
          supabase.from('Reorder Suggestions').select('id').eq('status', 'Pending'),
          supabase.from('Daily Snapshots').select('*').order('snapshot_date', { ascending: false }).limit(30),
          supabase.from('Stock Transactions').select('*').order('created_at', { ascending: false }).limit(10),
        ])

      setProducts(productsRes.data || [])
      setSuppliers(suppliersRes.data || [])
      setAlerts(alertsRes.data || [])
      setSuggestions(suggestionsRes.data || [])
      setSnapshots((snapshotsRes.data || []).reverse())
      setTransactions(txRes.data || [])
    } catch {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    const channels = [
      supabase.channel('dash-products')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'Products' }, () => fetchData())
        .subscribe(),
      supabase.channel('dash-alerts')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'Stock Alerts' }, () => fetchData())
        .subscribe(),
      supabase.channel('dash-snapshots')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'Daily Snapshots' }, () => fetchData())
        .subscribe(),
      supabase.channel('dash-transactions')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'Stock Transactions' }, () => fetchData())
        .subscribe(),
    ]

    return () => channels.forEach(c => supabase.removeChannel(c))
  }, [])

  /* ─── Derived data ─── */
  const healthScore = computeHealthScore(products)
  const totalProducts = products.length
  const oosCount = products.filter(p => (p.current_stock || 0) === 0).length
  const highRisk = products.filter(p => p.risk_level === 'HIGH' && (p.current_stock || 0) > 0).length
  const mediumRisk = products.filter(p => p.risk_level === 'MEDIUM').length
  const lowRisk = products.filter(p => p.risk_level === 'LOW').length

  // KPI data
  const kpiData = {
    products: totalProducts,
    highRisk: highRisk + oosCount,
    highRiskSubtitle: `${mediumRisk} medium · ${lowRisk} low`,
    alerts: alerts.length,
    reorders: suggestions.length,
  }

  // Risk donut data
  const riskDistribution = [
    ...(oosCount > 0 ? [{ name: 'Out of Stock', value: oosCount }] : []),
    ...(highRisk > 0 ? [{ name: 'High Risk', value: highRisk }] : []),
    ...(mediumRisk > 0 ? [{ name: 'Medium Risk', value: mediumRisk }] : []),
    ...(lowRisk > 0 ? [{ name: 'Low Risk', value: lowRisk }] : []),
  ]

  // Inventory value at risk (sorted by ₹ value descending)
  const inventoryValueData = products
    .map(p => ({
      name: (p.product_name || '').length > 16
        ? p.product_name.slice(0, 14) + '…'
        : p.product_name || p.product_id,
      value: Math.round((p.unit_price || 0) * (p.current_stock || 0)),
      risk: p.risk_level || 'UNKNOWN',
      stock: p.current_stock || 0,
      unitPrice: p.unit_price || 0,
    }))
    .sort((a, b) => b.value - a.value)

  // Supplier performance
  const supplierData = suppliers
    .map(s => ({
      name: s.supplier_name,
      value: s.composite_score || 0,
      grade: s.supplier_grade,
    }))
    .sort((a, b) => b.value - a.value)

  // Chart data for health trend (filter out zero/null scores from broken snapshot rows)
  const chartData = snapshots
    .filter(s => s.health_score != null && s.health_score > 0)
    .map(s => ({
      date: new Date(s.snapshot_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      health: s.health_score,
    }))

  // Critical products (top 5 by days_to_stockout ascending)
  const criticalProducts = [...products]
    .sort((a, b) => (a.days_to_stockout || 0) - (b.days_to_stockout || 0))
    .slice(0, 5)

  /* ─── Quick Actions ─── */
  const handleRunPipeline = async () => {
    setRunningPipeline(true)
    try {
      await triggerWebhook(WEBHOOKS.runPipeline)
      toast('Pipeline triggered — processing...', { icon: '⏳', duration: 4000 })
      // Poll for completion
      const poll = async (attempt = 1) => {
        if (attempt > 6) return
        await new Promise(r => setTimeout(r, 10000))
        try {
          const { data } = await supabase
            .from('System Logs')
            .select('status, error_message, records_processed')
            .order('created_at', { ascending: false })
            .limit(1)
          if (data?.[0]) {
            if (data[0].status === 'success') {
              toast.success(`Pipeline done — ${data[0].records_processed || 0} products processed`)
              fetchData()
              return
            }
            if (data[0].status === 'error') {
              toast.error(`Pipeline failed: ${data[0].error_message || 'Unknown error'}`)
              return
            }
          }
          poll(attempt + 1)
        } catch {
          poll(attempt + 1)
        }
      }
      poll()
    } catch (err) {
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

  /* ─── Render ─── */
  return (
    <div className="space-y-5">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-text">Dashboard</h1>
        <p className="text-sm text-muted mt-0.5">Your inventory intelligence at a glance</p>
      </div>

      {/* Row 1 — Health Gauge + KPI Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2">
          <HealthScoreGauge score={healthScore} totalProducts={totalProducts} loading={loading} />
        </div>
        <div className="lg:col-span-3">
          <KPICards data={kpiData} loading={loading} />
        </div>
      </div>

      {/* Row 2 — Three Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RiskDonutChart data={riskDistribution} totalProducts={totalProducts} loading={loading} />
        <InventoryValueChart data={inventoryValueData} loading={loading} />
        <SupplierPerformanceList data={supplierData} loading={loading} />
      </div>

      {/* Row 3 — Health Trend */}
      <HealthTrendChart data={chartData} currentScore={healthScore} loading={loading} />

      {/* Row 4 — Critical Products + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <CriticalProductsList products={criticalProducts} suppliers={suppliers} loading={loading} />
        </div>
        <div className="lg:col-span-2">
          <ActivityFeed transactions={transactions} loading={loading} />
        </div>
      </div>

      {/* Quick Actions — subtle, at the bottom */}
      <div className="border-t border-border pt-4">
        <p className="text-xs font-medium text-muted mb-2 uppercase tracking-wider">Quick Actions</p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunPipeline}
            disabled={runningPipeline}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted bg-gray-50 border border-border rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {runningPipeline ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            {runningPipeline ? 'Running...' : 'Run Pipeline'}
          </button>
          <button
            onClick={handleSendWhatsApp}
            disabled={sendingWhatsApp}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted bg-gray-50 border border-border rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {sendingWhatsApp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageCircle className="w-3.5 h-3.5" />}
            {sendingWhatsApp ? 'Sending...' : 'Send WhatsApp Report'}
          </button>
        </div>
      </div>
    </div>
  )
}
