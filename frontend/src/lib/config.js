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

// All other workflows are triggered via the n8n public API
export const WORKFLOW_IDS = {
  WF02: 'JgDNR0tDWj0Z_DVfHB4Fo',  // Stockout Calculator
  WF03: 'P_JZINAHgGw-IVQOjI4eg',  // Inventory Processing & Alerts
  WF04: 'VkFbE0ZONeTximBLOw5Wx',  // Stock Risk Classification
  WF05: 'ivm5yQJMfSZn0VrNt40RB',  // AI Reorder Intelligence
  WF06: 'WkRvETkpAySDKEAzPwRWi',  // Supplier Scoring
  WF08: 'YGmf1h03MCjFVIMU3q0Zn',  // Daily Orchestrator (full pipeline)
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
 * Use for WF-01 (productIngest) and WF-07 (sendWhatsApp).
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

/**
 * Trigger a workflow via the n8n public API (for workflows without webhooks).
 * POST /api/v1/workflows/{id}/run  — fire-and-forget, returns executionId.
 */
export const apiTriggerWorkflow = async (workflowId) => {
  const apiKey = import.meta.env.VITE_N8N_API_KEY
  const url = `${N8N_BASE}/api/v1/workflows/${workflowId}/run`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': apiKey,
    },
    body: JSON.stringify({}),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res
}
