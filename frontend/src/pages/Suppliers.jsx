import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import EmptyState from '../components/EmptyState'

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([])

  useEffect(() => {
    supabase
      .from('Suppliers')
      .select('*')
      .order('composite_score', { ascending: false })
      .then(({ data }) => setSuppliers(data || []))
  }, [])

  return (
    <Layout title="Suppliers">
      {suppliers.length === 0 ? (
        <EmptyState title="No suppliers yet" description="Add suppliers to power scoring and reorder recommendations." />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {suppliers.map((s) => (
            <div key={s.id} className="rounded-xl border border-border bg-white p-4">
              <h3 className="font-medium text-primary">{s.supplier_name}</h3>
              <p className="text-sm text-muted">Grade: {s.supplier_grade || 'N/A'} • Score: {s.composite_score || 0}</p>
              <p className="mt-1 text-sm text-muted">Delivery: {s.delivery_time_days || '-'} days</p>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
