// Local dev API server — mirrors api/insights.js for Vercel
// Run via: node --env-file=.env.local server.js
import http from 'http'

const PORT = 3000

const server = http.createServer(async (req, res) => {
  // CORS headers for Vite dev server
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.method === 'POST' && req.url === '/api/insights') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', async () => {
      try {
        const { awayTeam, homeTeam, sport } = JSON.parse(body)
        const apiKey = process.env.ANTHROPIC_API_KEY

        if (!apiKey) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set' }))
          return
        }

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type':      'application/json',
            'x-api-key':         apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model:      'claude-haiku-4-5-20251001',
            max_tokens: 60,
            messages: [{
              role:    'user',
              content: `Give one fun, specific fact or rivalry insight about ${awayTeam} vs ${homeTeam} in ${sport}. Max 10 words. No disclaimers.`,
            }],
          }),
        })

        const data = await response.json()
        const insight = data.content?.[0]?.text?.trim() ?? ''
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ insight }))
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: err.message }))
      }
    })
    return
  }

  res.writeHead(404)
  res.end()
})

server.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`)
})
