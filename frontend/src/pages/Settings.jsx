import { useState } from 'react'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import { WEBHOOKS, triggerWebhook } from '../lib/config'

export default function Settings() {
  const [running, setRunning] = useState(false)

  const handleRun = async () => {
    setRunning(true)
    try {
      await triggerWebhook(WEBHOOKS.runPipeline)
      toast.success('Pipeline trigger sent')
    } catch (err) {
      toast.error(err.message || 'Failed to trigger pipeline')
    } finally {
      setRunning(false)
    }
  }

  return (
    <Layout title="Settings">
      <div className="rounded-xl border border-border bg-white p-5">
        <h3 className="text-base font-semibold text-primary">Automation</h3>
        <p className="mt-2 text-sm text-muted">Run the master pipeline workflow (WF-08) on demand.</p>
        <button onClick={handleRun} disabled={running} className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm text-white">
          {running ? 'Triggering...' : 'Run Daily Pipeline'}
        </button>
      </div>
    </Layout>
  )
}
