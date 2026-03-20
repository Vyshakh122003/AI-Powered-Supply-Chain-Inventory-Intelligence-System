const supabaseUrl = 'https://xixdkapttirdedoivskx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpeGRrYXB0dGlyZGVkb2l2c2t4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNzg5ODQsImV4cCI6MjA4NTk1NDk4NH0.M3HLRgpB8tTVtrzVTdPaoVCX1YMGQ1KAutYgVFrW6rc'

const headers = {
  apikey: supabaseKey,
  Authorization: `Bearer ${supabaseKey}`,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal'
}

async function run() {
  console.log('Deleting...')
  const delRes = await fetch(`${supabaseUrl}/rest/v1/Daily%20Snapshots?snapshot_date=gte.2026-03-12`, {
    method: 'DELETE',
    headers
  })
  if (!delRes.ok) throw new Error(await delRes.text())
  
  console.log('Inserting...')
  const data = [
      { snapshot_date: '2026-03-12', health_score: 78, total_products: 6, high_count: 1, medium_count: 1, low_count: 4, oos_count: 0, alerts_active: 1, suggestions_pending: 1 },
      { snapshot_date: '2026-03-13', health_score: 76, total_products: 6, high_count: 1, medium_count: 2, low_count: 3, oos_count: 0, alerts_active: 2, suggestions_pending: 2 },
      { snapshot_date: '2026-03-14', health_score: 72, total_products: 6, high_count: 2, medium_count: 1, low_count: 3, oos_count: 0, alerts_active: 2, suggestions_pending: 2 },
      { snapshot_date: '2026-03-15', health_score: 68, total_products: 6, high_count: 2, medium_count: 2, low_count: 2, oos_count: 0, alerts_active: 3, suggestions_pending: 3 },
      { snapshot_date: '2026-03-16', health_score: 62, total_products: 6, high_count: 2, medium_count: 2, low_count: 1, oos_count: 1, alerts_active: 4, suggestions_pending: 4 },
      { snapshot_date: '2026-03-17', health_score: 58, total_products: 6, high_count: 3, medium_count: 1, low_count: 1, oos_count: 1, alerts_active: 4, suggestions_pending: 5 },
      { snapshot_date: '2026-03-18', health_score: 55, total_products: 6, high_count: 3, medium_count: 2, low_count: 1, oos_count: 0, alerts_active: 5, suggestions_pending: 5 }
  ]
  
  const insRes = await fetch(`${supabaseUrl}/rest/v1/Daily%20Snapshots`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  })
  if (!insRes.ok) throw new Error(await insRes.text())
  
  console.log('Success!')
}

run().catch(console.error)
