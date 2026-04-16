// ── n8n integration config ──────────────────────────────────────────
// Dev:  Vite proxies /webhook/* to local n8n (same-origin, no CORS).
// Prod: Vercel serverless functions at /api/* proxy to Railway n8n
//       (same-origin to browser, server-to-server to n8n — no CORS).
const isDev = import.meta.env.DEV

export const WEBHOOKS = {
  productIngest: isDev ? '/webhook/product-sales-ingest' : '/api/product-ingest',
  sendWhatsApp:  isDev ? '/webhook/send-whatsapp'        : '/api/send-whatsapp',
  runPipeline:   isDev ? '/webhook/run-pipeline'          : '/api/run-pipeline',
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
