import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import EmptyState from '../components/EmptyState'

export default function Products() {
  const [products, setProducts] = useState([])

  useEffect(() => {
    supabase
      .from('Products')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setProducts(data || []))
  }, [])

  return (
    <Layout title="Products">
      {products.length === 0 ? (
        <EmptyState title="No products yet" description="Use Add Product or CSV import to begin." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-muted">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Threshold</th>
                <th className="px-4 py-3">Risk</th>
              </tr>
            </thead>
            <tbody>
              {products.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-4 py-3">{row.product_name}</td>
                  <td className="px-4 py-3">{row.current_stock}</td>
                  <td className="px-4 py-3">{row.reorder_threshold}</td>
                  <td className="px-4 py-3">{row.risk_level || 'UNKNOWN'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  )
}
