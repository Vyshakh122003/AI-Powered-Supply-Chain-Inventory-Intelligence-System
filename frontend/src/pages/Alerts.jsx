import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/helpers'
import { useAuth } from '../contexts/AuthContext'
import EmptyState from '../components/EmptyState'
import toast from 'react-hot-toast'
import {
  AlertTriangle, Bell, BellOff, Loader2, CheckCircle2, XCircle,
} from 'lucide-react'

export default function Alerts() {
  const { storeProfile } = useAuth()
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Active')
  const [dismissingAll, setDismissingAll] = useState(false)
  const [dismissingId, setDismissingId] = useState(null)

  const fetchAlerts = async () => {
    if (!storeProfile?.id) {
      setAlerts([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('Stock Alerts')
        .select('*')
        .eq('store_id', storeProfile.id)
        .eq('alert_status', filter)
        .order('alert_date', { ascending: false })

      if (error) throw error
      setAlerts(data || [])
    } catch {
      toast.error('Failed to load alerts')
    } finally {
      setLoading(false)
    }
  }

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    fetchAlerts()
  }, [filter, storeProfile])
  /* eslint-enable react-hooks/exhaustive-deps */

  // Realtime subscription
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const channel = supabase
      .channel('alerts-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Stock Alerts' }, () => {
        fetchAlerts()
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [filter])
  /* eslint-enable react-hooks/exhaustive-deps */

  const handleDismiss = async (id) => {
    if (!storeProfile?.id) return
    setDismissingId(id)
    try {
      const { error } = await supabase
        .from('Stock Alerts')
        .update({ alert_status: 'Dismissed' })
        .eq('id', id)
        .eq('store_id', storeProfile.id)
      if (error) throw error
      toast.success('Alert dismissed')
      fetchAlerts()
    } catch {
      toast.error('Failed to dismiss alert')
    } finally {
      setDismissingId(null)
    }
  }

  const handleDismissAll = async () => {
    if (!storeProfile?.id) return
    setDismissingAll(true)
    try {
      const { error } = await supabase
        .from('Stock Alerts')
        .update({ alert_status: 'Dismissed' })
        .eq('store_id', storeProfile.id)
        .eq('alert_status', 'Active')
      if (error) throw error
      toast.success('All alerts dismissed')
      fetchAlerts()
    } catch {
      toast.error('Failed to dismiss all alerts')
    } finally {
      setDismissingAll(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text">Stock Alerts</h1>
          <p className="text-sm text-muted">{alerts.length} {filter.toLowerCase()} alerts</p>
        </div>
        {filter === 'Active' && alerts.length > 0 && (
          <button
            onClick={handleDismissAll}
            disabled={dismissingAll}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-text text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {dismissingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <BellOff className="w-4 h-4" />}
            {dismissingAll ? 'Dismissing...' : 'Dismiss All'}
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['Active', 'Dismissed'].map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
              filter === tab
                ? 'bg-accent text-white'
                : 'bg-white text-muted border border-border hover:bg-gray-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Alert cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      ) : alerts.length === 0 ? (
        <EmptyState
          icon={filter === 'Active' ? Bell : BellOff}
          title={filter === 'Active' ? 'No active alerts' : 'No dismissed alerts'}
          description={filter === 'Active'
            ? 'All products are above their reorder thresholds'
            : 'Dismissed alerts will appear here'}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`bg-white rounded-xl border p-5 ${
                filter === 'Active' ? 'border-orange-200' : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {filter === 'Active' ? (
                    <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-muted shrink-0" />
                  )}
                  <h3 className="text-sm font-semibold text-text truncate">
                    {alert.product_name}
                  </h3>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Current Stock</span>
                  <span className="font-medium text-text">{alert.current_stock}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Reorder Threshold</span>
                  <span className="font-medium text-text">{alert.reorder_threshold}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Alert Date</span>
                  <span className="font-medium text-text">{formatDate(alert.alert_date)}</span>
                </div>
                {alert.alert_name && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Type</span>
                    <span className="font-medium text-text">{alert.alert_name}</span>
                  </div>
                )}
              </div>

              {/* Stock bar */}
              <div className="mb-4">
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      alert.current_stock <= alert.reorder_threshold * 0.5
                        ? 'bg-danger'
                        : 'bg-warning'
                    }`}
                    style={{
                      width: `${Math.min(100, alert.reorder_threshold > 0
                        ? (alert.current_stock / alert.reorder_threshold) * 100
                        : 0)}%`
                    }}
                  />
                </div>
              </div>

              {filter === 'Active' && (
                <button
                  onClick={() => handleDismiss(alert.id)}
                  disabled={dismissingId === alert.id}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-muted bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {dismissingId === alert.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  Dismiss
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
