export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const n8nBase = process.env.VITE_N8N_BASE_URL
  if (!n8nBase) {
    return res.status(500).json({ error: 'N8N webhook URL not configured' })
  }

  try {
    const response = await fetch(`${n8nBase}/webhook/run-pipeline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body || {}),
    })

    const text = await response.text()
    res.status(response.status).send(text)
  } catch (err) {
    res.status(502).json({ error: 'Failed to reach n8n', detail: err.message })
  }
}
