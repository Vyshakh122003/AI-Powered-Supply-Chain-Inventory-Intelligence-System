export const WEBHOOKS = {
  productIngest: '/webhook/product-sales-ingest',
  runPipeline: '/webhook/run-daily-pipeline',
  sendWhatsApp: '/webhook/send-whatsapp-alerts',
}

export async function postWebhook(path, payload) {
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Webhook failed with status ${response.status}`)
  }

  return response.json().catch(() => ({}))
}

export async function triggerWebhook(path) {
  return postWebhook(path, {})
}
