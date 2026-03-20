import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  console.log('Deleting old snapshots...')
  const { error: delError } = await supabase
    .from('Daily Snapshots')
    .delete()
    .gte('snapshot_date', '2026-03-12')
  
  if (delError) {
    console.error('Error deleting:', delError)
    return
  }
  
  console.log('Inserting new snapshots...')
  const { error: insError } = await supabase
    .from('Daily Snapshots')
    .insert([
      { snapshot_date: '2026-03-12', health_score: 78, total_products: 6, high_count: 1, medium_count: 1, low_count: 4, oos_count: 0, alerts_active: 1, suggestions_pending: 1 },
      { snapshot_date: '2026-03-13', health_score: 76, total_products: 6, high_count: 1, medium_count: 2, low_count: 3, oos_count: 0, alerts_active: 2, suggestions_pending: 2 },
      { snapshot_date: '2026-03-14', health_score: 72, total_products: 6, high_count: 2, medium_count: 1, low_count: 3, oos_count: 0, alerts_active: 2, suggestions_pending: 2 },
      { snapshot_date: '2026-03-15', health_score: 68, total_products: 6, high_count: 2, medium_count: 2, low_count: 2, oos_count: 0, alerts_active: 3, suggestions_pending: 3 },
      { snapshot_date: '2026-03-16', health_score: 62, total_products: 6, high_count: 2, medium_count: 2, low_count: 1, oos_count: 1, alerts_active: 4, suggestions_pending: 4 },
      { snapshot_date: '2026-03-17', health_score: 58, total_products: 6, high_count: 3, medium_count: 1, low_count: 1, oos_count: 1, alerts_active: 4, suggestions_pending: 5 },
      { snapshot_date: '2026-03-18', health_score: 55, total_products: 6, high_count: 3, medium_count: 2, low_count: 1, oos_count: 0, alerts_active: 5, suggestions_pending: 5 }
    ])

  if (insError) {
    console.error('Error inserting:', insError)
  } else {
    console.log('Successfully updated DB')
  }
}

run()
