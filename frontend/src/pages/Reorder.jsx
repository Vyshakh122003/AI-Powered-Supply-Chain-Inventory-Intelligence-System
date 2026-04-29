import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import EmptyState from '../components/EmptyState'

export default function Reorder() {
  const [items, setItems] = useState([])

  useEffect(() => {
    supabase
      .from('Reorder Suggestions')
      .select('*')
      .order('suggestion_date', { ascending: false })
      .then(({ data }) => setItems(data || []))
  }, [])

  return (
    <Layout title="Reorder Suggestions">
      {items.length === 0 ? (
        <EmptyState title="No suggestions" description="Run WF-05 to generate AI reorder recommendations." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-muted">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3">{r.product_id}</td>
                  <td className="px-4 py-3">{r.suggested_quantity}</td>
                  <td className="px-4 py-3">{r.supplier_id}</td>
                  <td className="px-4 py-3">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  )
}
