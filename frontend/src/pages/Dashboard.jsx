import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

export default function Dashboard() {
  const [stats, setStats] = useState({ products: 0, alerts: 0, suggestions: 0, suppliers: 0 })

  useEffect(() => {
    const load = async () => {
      const [p, a, r, s] = await Promise.all([
        supabase.from('Products').select('id', { count: 'exact', head: true }),
        supabase.from('Stock Alerts').select('id', { count: 'exact', head: true }).eq('alert_status', 'Active'),
        supabase.from('Reorder Suggestions').select('id', { count: 'exact', head: true }).eq('status', 'Pending'),
        supabase.from('Suppliers').select('id', { count: 'exact', head: true }),
      ])

      setStats({
        products: p.count || 0,
        alerts: a.count || 0,
        suggestions: r.count || 0,
        suppliers: s.count || 0,
      })
    }

    load()
  }, [])

  return (
    <Layout title="Dashboard">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Object.entries(stats).map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-white p-5">
            <p className="text-sm capitalize text-muted">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-primary">{value}</p>
          </div>
        ))}
      </div>
    </Layout>
  )
}
