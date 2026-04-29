import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import EmptyState from '../components/EmptyState'

export default function Alerts() {
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    supabase
      .from('Stock Alerts')
      .select('*')
      .order('alert_date', { ascending: false })
      .then(({ data }) => setAlerts(data || []))
  }, [])

  return (
    <Layout title="Stock Alerts">
      {alerts.length === 0 ? (
        <EmptyState title="No active alerts" description="WF-03 generates alerts when products cross threshold." />
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => (
            <div key={a.id} className="rounded-xl border border-border bg-white p-4">
              <p className="font-medium text-primary">{a.product_name}</p>
              <p className="text-sm text-muted">Current stock: {a.current_stock} • Threshold: {a.reorder_threshold}</p>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
