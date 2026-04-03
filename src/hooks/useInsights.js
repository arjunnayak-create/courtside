import { useState, useEffect, useRef } from 'react'

// Module-level cache — survives re-renders and 5s polling cycles
const cache   = new Map()   // gameId → insight string
const pending = new Set()   // gameIds currently in-flight

async function fetchInsight(game) {
  const res = await fetch('/api/insights', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      awayTeam: game.awayTeam?.name ?? '',
      homeTeam: game.homeTeam?.name ?? '',
      sport:    game.sport,
    }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const { insight } = await res.json()
  if (!insight) throw new Error('empty')
  return insight
}

// Returns a Map of gameId → '__loading__' | insight string
// Re-renders the consumer whenever a new insight lands
export function useInsights(games) {
  const [, setBump] = useState(0)

  useEffect(() => {
    if (!games || games.length === 0) return

    let dirty = false

    for (const game of games) {
      if (!game?.awayTeam || !game?.homeTeam) continue
      if (cache.has(game.id) || pending.has(game.id)) continue

      pending.add(game.id)
      cache.set(game.id, '__loading__')
      dirty = true

      fetchInsight(game)
        .then(text => {
          cache.set(game.id, text)
          pending.delete(game.id)
          setBump(b => b + 1)
        })
        .catch(() => {
          // Fail silently — remove so it doesn't show skeleton forever
          cache.delete(game.id)
          pending.delete(game.id)
          setBump(b => b + 1)
        })
    }

    if (dirty) setBump(b => b + 1)
  }, [games])

  return cache
}
