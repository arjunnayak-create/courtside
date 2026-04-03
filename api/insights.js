export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { awayTeam, homeTeam, sport } = req.body

  if (!awayTeam || !homeTeam || !sport) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':         'application/json',
        'x-api-key':            apiKey,
        'anthropic-version':    '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 60,
        messages: [{
          role:    'user',
          content: `You are a witty sports analyst. One punchy insight about tonight's ${awayTeam} vs ${homeTeam} (${sport}) matchup. Current form or tonight's key storyline only. No historical facts. Max 10 words. No disclaimers.`,
        }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return res.status(502).json({ error: `Anthropic error: ${err}` })
    }

    const data = await response.json()
    const insight = data.content?.[0]?.text?.trim() ?? ''
    return res.status(200).json({ insight })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
