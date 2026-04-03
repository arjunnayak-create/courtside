import { useState, useEffect } from 'react'
import Header from './components/Header'
import SportFilter from './components/SportFilter'
import GameCard from './components/GameCard'
import { useGames } from './hooks/useGames'

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

export default function App() {
  const [activeSport, setActiveSport] = useState('All')
  const { liveGames, todayGames, finalGames, upcomingByDate, activeSports, loading, error } = useGames()

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
    <div style={{
      maxWidth: '480px',
      margin: '0 auto',
      minHeight: '100svh',
      backgroundColor: 'var(--color-bg)',
      position: 'relative',
    }}>
      {/* Sticky header + filter bar */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'rgba(8, 8, 8, 0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <Header />
        <SportFilter
          activeSport={activeSport}
          onSelect={setActiveSport}
          activeSports={activeSports}
        />
      </div>

      <main style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }}>

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

        {/* Error — only shown when there's no data at all */}
        {!loading && error && !hasGames && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '80px 24px',
            gap: '8px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '28px', color: 'var(--color-text-muted)', lineHeight: 1 }}>↯</div>
            <div style={{ fontSize: '16px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
              Couldn't load games
            </div>
            <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', maxWidth: '280px' }}>
              {error}
            </div>
          </div>
        )}

        {/* Live games */}
        {!loading && filteredLive.length > 0 && (
          <section>
            <SectionLabel live />
            <div style={CARD_PADDING}>
              {filteredLive.map(game => (
                <GameCard key={game.id} game={game} isLive />
              ))}
            </div>
          </section>
        )}

        {/* Today's upcoming games */}
        {!loading && filteredToday.length > 0 && (
          <section style={{ marginTop: filteredLive.length > 0 ? '8px' : '0' }}>
            <SectionLabel />
            <div style={CARD_PADDING}>
              {filteredToday.map(game => (
                <GameCard key={game.id} game={game} isLive={false} isFinal={false} />
              ))}
            </div>
          </section>
        )}

        {/* Today's final games */}
        {!loading && filteredFinal.length > 0 && (
          <section style={{ marginTop: (filteredLive.length > 0 || filteredToday.length > 0) ? '8px' : '0' }}>
            <SectionLabel label="Final" />
            <div style={CARD_PADDING}>
              {filteredFinal.map(game => (
                <GameCard key={game.id} game={game} isLive={false} isFinal />
              ))}
            </div>
          </section>
        )}

        {/* Future games grouped by date */}
        {!loading && filteredUpcoming.map(({ date, games }) => (
          <section key={date} style={{ marginTop: '8px' }}>
            <SectionLabel label={formatDateLabel(date)} />
            <div style={CARD_PADDING}>
              {games.map(game => (
                <GameCard key={game.id} game={game} isLive={false} isFinal={false} />
              ))}
            </div>
          </section>
        ))}

        {/* Empty state */}
        {!loading && !error && !hasGames && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 24px',
            gap: '8px',
          }}>
            <div style={{ fontSize: '32px', color: 'var(--color-text-muted)', lineHeight: 1 }}>—</div>
            <div style={{ fontSize: '16px', color: 'var(--color-text-muted)' }}>
              No {activeSport === 'All' ? '' : activeSport + ' '}games this week
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
