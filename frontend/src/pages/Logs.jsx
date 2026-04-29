import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import EmptyState from '../components/EmptyState'

export default function Logs() {
  const [logs, setLogs] = useState([])

  useEffect(() => {
    supabase
      .from('System Logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => setLogs(data || []))
  }, [])

  return (
    <Layout title="System Logs">
      {logs.length === 0 ? (
        <EmptyState title="No logs" description="WF-08 orchestrator writes execution telemetry here." />
      ) : (
        <div className="space-y-2">
          {logs.map((l) => (
            <div key={l.id} className="rounded-xl border border-border bg-white p-3 text-sm">
              <p className="font-medium text-primary">{l.workflow_name}</p>
              <p className="text-muted">Status: {l.status} • Records: {l.records_processed || 0}</p>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
