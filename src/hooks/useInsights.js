import { useState, useEffect, useRef } from 'react'

// Fetch a single game's insight from the serverless function
async function fetchInsight(game) {
  const res = await fetch('/api/insights', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      awayTeam: game.awayTeam.name,
      homeTeam: game.homeTeam.name,
      sport:    game.sport,
    }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const { insight } = await res.json()
  return insight
}

// games: array of game objects (qualifying: all live + NBA pre-game)
// Returns a Map of gameId → insight string (or '__loading__' while pending)
export function useInsights(games) {
  const cacheRef  = useRef(new Map())   // gameId → insight text (permanent)
  const pendingRef = useRef(new Set())  // gameIds currently in-flight
  const [, setBump] = useState(0)       // force re-render when cache fills

  useEffect(() => {
    if (!games || games.length === 0) return

    let changed = false
    const toFetch = games.filter(g => {
      if (!g.awayTeam || !g.homeTeam) return false
      return !cacheRef.current.has(g.id) && !pendingRef.current.has(g.id)
    })

    if (toFetch.length === 0) return

    for (const game of toFetch) {
      pendingRef.current.add(game.id)
      cacheRef.current.set(game.id, '__loading__')
      changed = true

      fetchInsight(game)
        .then(text => {
          cacheRef.current.set(game.id, text)
          pendingRef.current.delete(game.id)
          setBump(b => b + 1)
        })
        .catch(() => {
          cacheRef.current.delete(game.id)
          pendingRef.current.delete(game.id)
        })
    }

    if (changed) setBump(b => b + 1)
  }, [games])

  return cacheRef.current
}
