// ── n8n integration config ──────────────────────────────────────────
// In dev, Vite proxies /webhook/* and /api/v1/* to n8n via ngrok.
// Use empty base so requests stay same-origin → no CORS issues.
const N8N_BASE = import.meta.env.DEV ? '' : import.meta.env.VITE_N8N_BASE_URL

// Webhook endpoints for workflows that have webhook triggers
export const WEBHOOKS = {
  productIngest: `${N8N_BASE}/webhook/product-sales-ingest`,
  sendWhatsApp:  `${N8N_BASE}/webhook/send-whatsapp`,
  runPipeline:   `${N8N_BASE}/webhook/run-pipeline`,
}

// ── helpers ─────────────────────────────────────────────────────────

const parseError = async (res) => {
  try {
    const data = await res.json()
    if (res.status === 404 && data.hint) {
      return 'Workflow not active in n8n. Activate it in the n8n editor.'
    }
    return data.message || `HTTP ${res.status}`
  } catch {
    return `HTTP ${res.status}`
  }
}

/**
 * Fire-and-forget webhook trigger (no request body).
 * Use for WF-08 (runPipeline) and WF-07 (sendWhatsApp).
 */
export const triggerWebhook = async (url) => {
  const res = await fetch(url, { method: 'POST' })
  if (!res.ok) throw new Error(await parseError(res))
  return res
}

/**
 * Webhook call that sends a JSON body (used by AddProductModal → WF-01).
 */
export const postWebhook = async (url, body) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res
}
