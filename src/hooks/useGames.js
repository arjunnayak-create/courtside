import { useState, useEffect } from 'react'

const ENDPOINTS = [
  { sport: 'NBA',    path: 'basketball/nba' },
  { sport: 'NFL',    path: 'football/nfl' },
  { sport: 'MLB',    path: 'baseball/mlb' },
  { sport: 'NHL',    path: 'hockey/nhl' },
  { sport: 'Soccer', path: 'soccer/usa.1' },
  { sport: 'CFB',    path: 'football/college-football' },
  { sport: 'CBB',    path: 'basketball/mens-college-basketball' },
  { sport: 'Golf',   path: 'golf/pga' },
  { sport: 'MMA',    path: 'mma/ufc' },
]

const SPORT_PRIORITY = { NBA: 0, MLB: 1, NHL: 2, Soccer: 3, CBB: 4, CFB: 5, NFL: 6, Tennis: 7, Golf: 8, MMA: 9 }

const FAVORITES = [
  { match: 'Knicks',  color: '#F58426' },
  { match: 'Yankees', color: '#003087' },
  { match: 'Giants',  color: '#0B2265' },
  { match: 'Lakers',  color: '#552583' },
]

function getFavoriteColor(displayName = '') {
  for (const fav of FAVORITES) {
    if (displayName.includes(fav.match)) return fav.color
  }
  return null
}

// Always format in ET
function formatStartTime(isoDate) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      hour:     'numeric',
      minute:   '2-digit',
      timeZone: 'America/New_York',
    }).format(new Date(isoDate))
  } catch {
    return ''
  }
}

// Returns 'YYYY-MM-DD' in ET
function getGameDate(isoDate) {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/New_York',
    }).format(new Date(isoDate))
  } catch {
    return ''
  }
}

// Returns 'YYYYMMDD' string for ESPN ?dates= param
function toESPNDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

// Get next 7 calendar days as YYYYMMDD strings (in ET)
function getNext7Days() {
  // Start from "today" in ET
  const nowET = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
  )
  const dates = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(nowET)
    d.setDate(nowET.getDate() + i)
    dates.push(toESPNDate(d))
  }
  return dates
}

function normalizeGolfEvent(event, sport) {
  try {
    // Golf scoreboard has no event.status — derive state from date range
    const now   = Date.now()
    const start = new Date(event.date).getTime()
    const end   = new Date(event.endDate).getTime()
    // ESPN endDate is midnight ET on final day; add 18h so Sunday play isn't "post"
    const endBuffer = end + 18 * 60 * 60 * 1000

    const isLive  = now >= start && now < endBuffer
    const isPre   = now < start
    const isFinal = now >= endBuffer
    if (!isLive && !isPre && !isFinal) return null

    const state       = isLive ? 'in' : isPre ? 'pre' : 'post'
    const allNetworks = event.competitions?.[0]?.broadcasts?.[0]?.names ?? []
    const network     = allNetworks[0] ?? ''

    // Approximate current round from day offset within tournament
    const dayIndex = Math.max(0, Math.floor((now - start) / 86400000))
    const period   = isLive ? `Round ${Math.min(4, dayIndex + 1)}` : isFinal ? 'Final' : null

    return {
      id:             event.id,
      sport,
      homeTeam:       { name: event.name, abbr: 'GOLF', score: null, logo: null },
      awayTeam:       null,
      status:         state,
      period,
      clock:          null,
      network,
      allNetworks,
      isLive,
      isFinal,
      startTime:      isPre ? formatStartTime(event.date) : null,
      gameDate:       getGameDate(event.date),
      startTimestamp: start,
      isFavorite:     false,
      favoriteColor:  null,
    }
  } catch {
    return null
  }
}

function normalizeGame(event, sport) {
  if (sport === 'Golf') return normalizeGolfEvent(event, sport)

  try {
    const competition = event.competitions?.[0]
    if (!competition) return null

    const competitors = competition.competitors ?? []
    const home = competitors.find(c => c.homeAway === 'home')
    const away = competitors.find(c => c.homeAway === 'away')
    if (!home || !away) return null

    const state   = event.status?.type?.state   // 'pre' | 'in' | 'post'
    const isLive  = state === 'in'
    const isPre   = state === 'pre'
    const isFinal = state === 'post'
    if (!isLive && !isPre && !isFinal) return null

    const network  = competition.broadcasts?.[0]?.names?.[0] ?? ''
    const homeName = home.team.name || home.team.shortDisplayName || home.team.displayName || ''
    const awayName = away.team.name || away.team.shortDisplayName || away.team.displayName || ''
    const favColor = getFavoriteColor(home.team.displayName || homeName)
                  || getFavoriteColor(away.team.displayName || awayName)

    const homeScore = isPre ? null : (parseInt(home.score) || 0)
    const awayScore = isPre ? null : (parseInt(away.score) || 0)

    const period = (isLive || isFinal) ? (event.status?.type?.shortDetail ?? '') : null

    return {
      id:       event.id,
      sport,
      homeTeam: {
        name:  homeName,
        abbr:  home.team.abbreviation ?? '',
        score: homeScore,
        logo:  home.team.logo ?? null,
      },
      awayTeam: {
        name:  awayName,
        abbr:  away.team.abbreviation ?? '',
        score: awayScore,
        logo:  away.team.logo ?? null,
      },
      status:         state,
      period,
      clock:          null,
      network,
      isLive,
      isFinal,
      startTime:      isPre ? formatStartTime(event.date) : null,
      gameDate:       getGameDate(event.date),
      startTimestamp: new Date(event.date).getTime(),
      isFavorite:     !!favColor,
      favoriteColor:  favColor,
    }
  } catch {
    return null
  }
}

async function fetchSportDate({ sport, path }, dateStr) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/${path}/scoreboard?dates=${dateStr}`
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${sport} HTTP ${r.status}`)
  const data = await r.json()
  return { sport, events: data.events ?? [] }
}

function sportPri(sport) {
  return SPORT_PRIORITY[sport] ?? 99
}

function sortLive(games) {
  return [...games].sort((a, b) => {
    if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1
    const pd = sportPri(a.sport) - sportPri(b.sport)
    if (pd !== 0) return pd
    // closest score = most exciting
    const diffA = Math.abs((a.homeTeam.score ?? 0) - (a.awayTeam?.score ?? 0))
    const diffB = Math.abs((b.homeTeam.score ?? 0) - (b.awayTeam?.score ?? 0))
    return diffA - diffB
  })
}

function sortUpcoming(games) {
  return [...games].sort((a, b) => {
    if (a.gameDate < b.gameDate) return -1
    if (a.gameDate > b.gameDate) return 1
    if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1
    const pd = sportPri(a.sport) - sportPri(b.sport)
    if (pd !== 0) return pd
    return a.startTimestamp - b.startTimestamp
  })
}

export function useGames() {
  const [liveGames,      setLiveGames]      = useState([])
  const [todayGames,     setTodayGames]     = useState([])
  const [finalGames,     setFinalGames]     = useState([])
  const [upcomingByDate, setUpcomingByDate] = useState({}) // { 'YYYY-MM-DD': [game, ...] }
  const [activeSports,   setActiveSports]   = useState(new Set(['All']))
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState(null)

  async function fetchAll(isRefresh = false) {
    try {
      const dates     = getNext7Days()
      const todayDate = dates[0]

      // Fetch all sport × date combos in parallel
      const fetches = ENDPOINTS.flatMap(ep => dates.map(d => fetchSportDate(ep, d)))
      const results = await Promise.allSettled(fetches)
      const fulfilled = results.filter(r => r.status === 'fulfilled')

      if (fulfilled.length === 0) {
        if (!isRefresh) {
          setError('Unable to reach ESPN. Check your connection.')
          setLoading(false)
        }
        return 0
      }

      // Deduplicate by event id across date fetches
      const seen = new Set()
      const all  = []
      for (const r of fulfilled) {
        const { sport, events } = r.value
        for (const e of events) {
          if (!seen.has(e.id)) {
            seen.add(e.id)
            const g = normalizeGame(e, sport)
            if (g) all.push(g)
          }
        }
      }

      const live       = sortLive(all.filter(g => g.isLive))
      const todayPre   = sortUpcoming(all.filter(g => g.status === 'pre'  && g.gameDate === todayDate))
      const todayFinal = all.filter(g => g.isFinal && g.gameDate === todayDate)
      const futurePre  = sortUpcoming(all.filter(g => g.status === 'pre'  && g.gameDate !== todayDate))

      // Group future pre-games by date
      const byDate = {}
      for (const g of futurePre) {
        if (!byDate[g.gameDate]) byDate[g.gameDate] = []
        byDate[g.gameDate].push(g)
      }

      // Sports active in the 7-day window
      const sportSet = new Set(['All'])
      for (const g of all) sportSet.add(g.sport)

      setLiveGames(live)
      setTodayGames(todayPre)
      setFinalGames(todayFinal)
      setUpcomingByDate(byDate)
      setActiveSports(sportSet)
      setError(null)
      return live.length
    } catch (err) {
      if (!isRefresh) setError(err.message)
      return 0
    } finally {
      if (!isRefresh) setLoading(false)
    }
  }

  useEffect(() => {
    let timeoutId

    async function run(isRefresh) {
      const liveCount = await fetchAll(isRefresh)
      const delay = liveCount > 0 ? 5_000 : 60_000
      timeoutId = setTimeout(() => run(true), delay)
    }

    run(false)
    return () => clearTimeout(timeoutId)
  }, [])

  return { liveGames, todayGames, finalGames, upcomingByDate, activeSports, loading, error,
           refresh: () => fetchAll(true) }
}
