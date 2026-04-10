import { useState, useEffect, useRef } from 'react'
import Header from './components/Header'
import SportFilter from './components/SportFilter'
import GameCard from './components/GameCard'
import GolfCard from './components/GolfCard'
import SplashScreen from './components/SplashScreen'
import { useGames } from './hooks/useGames'

const splashAlreadyShown = () =>
  sessionStorage.getItem('courtside_splash_shown') === 'true'

// Must match the order in SportFilter.jsx
const SPORTS_ORDER = ['All', 'NBA', 'NFL', 'MLB', 'NHL', 'Soccer', 'CFB', 'CBB', 'Tennis', 'Golf', 'MMA']

// Format 'YYYY-MM-DD' ET date string into a display label
function formatDateLabel(dateStr) {
  const etFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' })
  const etToday = etFormatter.format(new Date())

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const etTomorrow = etFormatter.format(tomorrow)

  if (dateStr === etTomorrow) return 'Tomorrow'

  // "Saturday, Apr 5" — use noon UTC so the date is unambiguous across timezones
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month:   'short',
    day:     'numeric',
    timeZone: 'America/New_York',
  }).format(new Date(dateStr + 'T12:00:00Z'))
}

function SectionLabel({ live, label }) {
  const text  = label ?? (live ? 'Live Now' : 'Today')
  const color = live ? 'var(--color-live)' : 'rgba(255,255,255,0.28)'
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      paddingTop: '22px',
      paddingBottom: '10px',
      paddingLeft: 'max(18px, env(safe-area-inset-left))',
      paddingRight: 'max(18px, env(safe-area-inset-right))',
    }}>
      {live && (
        <span style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-live)',
          flexShrink: 0,
          animation: 'pulse-dot 1.5s ease-in-out infinite',
          boxShadow: '0 0 8px 2px rgba(255,59,48,0.5)',
        }} />
      )}
      <span style={{
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color,
      }}>
        {text}
      </span>
      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
    </div>
  )
}

function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--color-surface)',
      borderRadius: '16px',
      border: '1px solid var(--color-border)',
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      animation: 'skeleton-pulse 1.6s ease-in-out infinite',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ width: '40px', height: '16px', borderRadius: '4px', background: 'var(--color-surface-raised)' }} />
        <div style={{ width: '80px', height: '16px', borderRadius: '4px', background: 'var(--color-surface-raised)' }} />
      </div>
      <div style={{ width: '60%', height: '18px', borderRadius: '4px', background: 'var(--color-surface-raised)' }} />
      <div style={{ width: '55%', height: '18px', borderRadius: '4px', background: 'var(--color-surface-raised)' }} />
      <div style={{ width: '50px', height: '14px', borderRadius: '4px', background: 'var(--color-surface-raised)' }} />
    </div>
  )
}

const CARD_PADDING = {
  padding: '0 16px',
  paddingLeft: 'max(18px, env(safe-area-inset-left))',
  paddingRight: 'max(18px, env(safe-area-inset-right))',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
}

function renderCard(game, props) {
  if (game.sport === 'Golf') {
    return <GolfCard key={game.id} game={game} {...props} />
  }
  return <GameCard key={game.id} game={game} {...props} />
}

export default function App() {
  const [showSplash, setShowSplash] = useState(!splashAlreadyShown())
  const [appVisible, setAppVisible] = useState(splashAlreadyShown())

  function handleSplashComplete() {
    sessionStorage.setItem('courtside_splash_shown', 'true')
    setShowSplash(false)
    setAppVisible(true)
  }

  const [activeSport, setActiveSport] = useState('All')
  const [slideDir,    setSlideDir]    = useState(null)   // 'left' | 'right' | null
  const [animKey,     setAnimKey]     = useState(0)
  const [refreshing,  setRefreshing]  = useState(false)
  const touchStartRef = useRef({ x: 0, y: 0, atTop: false })
  const refreshingRef = useRef(false)  // guard against double-trigger

  const { liveGames, todayGames, finalGames, upcomingByDate, activeSports, loading, error, refresh } = useGames()

  // Ordered list of sports that have games this week
  const visibleSports = SPORTS_ORDER.filter(s => s === 'All' || activeSports.has(s))

  function navigateSport(delta) {
    const idx    = visibleSports.indexOf(activeSport)
    const newIdx = Math.max(0, Math.min(visibleSports.length - 1, idx + delta))
    if (newIdx === idx) return
    setSlideDir(delta > 0 ? 'left' : 'right')
    setAnimKey(k => k + 1)
    setActiveSport(visibleSports[newIdx])
  }

  function onTouchStart(e) {
    touchStartRef.current = {
      x:     e.touches[0].clientX,
      y:     e.touches[0].clientY,
      atTop: window.scrollY === 0,
    }
  }

  async function triggerRefresh() {
    if (refreshingRef.current) return
    refreshingRef.current = true
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
    refreshingRef.current = false
  }

  function onTouchEnd(e) {
    const { x: startX, y: startY, atTop } = touchStartRef.current
    const dx    = e.changedTouches[0].clientX - startX
    const rawDy = e.changedTouches[0].clientY - startY   // signed: positive = pulled down
    const absDy = Math.abs(rawDy)

    // Pull-to-refresh: downward pull > 60px from the very top, not a horizontal gesture
    if (atTop && rawDy > 60 && Math.abs(dx) < 30) {
      triggerRefresh()
      return
    }

    // Horizontal swipe: sport navigation
    if (Math.abs(dx) > 50 && absDy < 30) {
      navigateSport(dx < 0 ? 1 : -1)
    }
  }

  // Auto-reset filter if the selected sport disappears from the 7-day window
  useEffect(() => {
    if (activeSport !== 'All' && activeSports.size > 1 && !activeSports.has(activeSport)) {
      setActiveSport('All')
    }
  }, [activeSports, activeSport])

  const filter = (games) =>
    activeSport === 'All' ? games : games.filter(g => g.sport === activeSport)

  const filteredLive  = filter(liveGames)
  const filteredToday = filter(todayGames)
  const filteredFinal = filter(finalGames)

  // Future pre-game groups, filtered and sorted by date
  const filteredUpcoming = Object.entries(upcomingByDate)
    .map(([date, games]) => ({ date, games: filter(games) }))
    .filter(({ games }) => games.length > 0)
    .sort((a, b) => (a.date < b.date ? -1 : 1))

  const hasGames = filteredLive.length > 0
    || filteredToday.length > 0
    || filteredFinal.length > 0
    || filteredUpcoming.length > 0

  return (
    <>
    {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
    <div style={{
      maxWidth:   '480px',
      margin:     '0 auto',
      minHeight:  '100svh',
      background: 'radial-gradient(ellipse 600px 300px at 50% -60px, rgba(255,59,48,0.05) 0%, transparent 70%), var(--color-bg)',
      position:   'relative',
      opacity:    appVisible ? 1 : 0,
      transition: 'opacity 300ms ease',
    }}>
      {/* Sticky header + filter bar */}
      <div
        className="header-scrim"
        style={{
          position:             'sticky',
          top:                  0,
          zIndex:               100,
          backgroundColor:      'rgba(8, 8, 8, 0.92)',
          backdropFilter:       'blur(24px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
          borderBottom:         '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Header />
        <SportFilter
          activeSport={activeSport}
          onSelect={setActiveSport}
          activeSports={activeSports}
        />
      </div>

      <main
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }}
      >

        {/* Pull-to-refresh indicator — thin scanning line */}
        <div style={{
          height:     '1.5px',
          overflow:   'hidden',
          position:   'relative',
          background: 'rgba(255,255,255,0.05)',
          opacity:    refreshing ? 1 : 0,
          transition: refreshing ? 'opacity 150ms ease' : 'opacity 500ms ease 300ms',
        }}>
          <div style={{
            position:   'absolute',
            top:        0,
            left:       0,
            height:     '100%',
            width:      '35%',
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.75) 50%, transparent 100%)',
            animation:  refreshing ? 'ptr-scan 1.1s linear infinite' : 'none',
          }} />
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div>
            <SectionLabel live />
            <div style={CARD_PADDING}>
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <SectionLabel />
            <div style={CARD_PADDING}>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        )}

        {/* Swipeable content — keyed so remount resets the slide animation on every navigation */}
        {!loading && (
          <div
            key={animKey}
            style={{
              animation: slideDir === 'left'  ? 'swipe-in-from-right 250ms ease' :
                         slideDir === 'right' ? 'swipe-in-from-left  250ms ease' : 'none',
              overflowX: 'hidden',
            }}
          >
            {/* Error */}
            {error && !hasGames && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '80px 24px',
                gap: '8px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '16px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                  Couldn't load games
                </div>
                <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', maxWidth: '280px' }}>
                  {error}
                </div>
              </div>
            )}

            {/* Live games */}
            {filteredLive.length > 0 && (
              <section style={{ backgroundColor: 'rgba(255,59,48,0.03)', paddingBottom: '14px' }}>
                <SectionLabel live />
                <div style={CARD_PADDING}>
                  {filteredLive.map((game, i) => (
                    renderCard(game, { isLive: true, index: i })
                  ))}
                </div>
              </section>
            )}

            {/* Today's upcoming games */}
            {filteredToday.length > 0 && (
              <section style={{ marginTop: filteredLive.length > 0 ? '8px' : '0' }}>
                <SectionLabel />
                <div style={CARD_PADDING}>
                  {filteredToday.map((game, i) => (
                    renderCard(game, { isLive: false, isFinal: false, index: i })
                  ))}
                </div>
              </section>
            )}

            {/* Today's final games */}
            {filteredFinal.length > 0 && (
              <section style={{ marginTop: (filteredLive.length > 0 || filteredToday.length > 0) ? '8px' : '0' }}>
                <SectionLabel label="Final" />
                <div style={CARD_PADDING}>
                  {filteredFinal.map((game, i) => (
                    renderCard(game, { isLive: false, isFinal: true, index: i })
                  ))}
                </div>
              </section>
            )}

            {/* Future games grouped by date */}
            {filteredUpcoming.map(({ date, games }) => (
              <section key={date} style={{ marginTop: '8px' }}>
                <SectionLabel label={formatDateLabel(date)} />
                <div style={CARD_PADDING}>
                  {games.map((game, i) => (
                    renderCard(game, { isLive: false, isFinal: false, index: i })
                  ))}
                </div>
              </section>
            ))}

            {/* Empty state */}
            {!error && !hasGames && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '80px 24px',
                gap: '8px',
              }}>
                <div style={{ fontSize: '16px', color: 'var(--color-text-muted)' }}>
                  No {activeSport === 'All' ? '' : activeSport + ' '}games this week
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
    </>
  )
}
