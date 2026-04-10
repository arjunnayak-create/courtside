import { useState, useEffect } from 'react'
import GolfTournamentSheet from './GolfTournamentSheet'

// ─── Constants ────────────────────────────────────────────────────────────────

const GOLF_GREEN  = '#1B6B3A'
const GOLF_GREEN2 = 'rgba(27,107,58,0.18)'
const GOLF_BORDER = 'rgba(27,107,58,0.35)'

const GOLF_SERVICES = {
  CBS:           { label: 'P+',     name: 'Paramount+', bg: '#1641A3' },
  'Paramount+':  { label: 'P+',     name: 'Paramount+', bg: '#1641A3' },
  ESPN:          { label: 'ESPN',   name: 'ESPN',        bg: '#CC0000' },
  ABC:           { label: 'ESPN',   name: 'ESPN',        bg: '#CC0000' },
  ESPNU:         { label: 'ESPN',   name: 'ESPN',        bg: '#CC0000' },
  'ESPN+':       { label: 'ESPN+',  name: 'ESPN+',       bg: '#1961CC' },
  NBC:           { label: 'PEACOCK',name: 'Peacock',     bg: 'linear-gradient(135deg,#6B2FA0 0%,#0AA5A8 100%)' },
  Peacock:       { label: 'PEACOCK',name: 'Peacock',     bg: 'linear-gradient(135deg,#6B2FA0 0%,#0AA5A8 100%)' },
  'Golf Channel':{ label: 'GOLF',   name: 'Golf Channel',bg: '#006747' },
  'NBC Sports':  { label: 'PEACOCK',name: 'Peacock',     bg: 'linear-gradient(135deg,#6B2FA0 0%,#0AA5A8 100%)' },
}

function resolveGolfNetwork(network) {
  if (!network) return null
  return GOLF_SERVICES[network] ?? null
}

function scoreColor(val) {
  if (!val || val === 'E' || val === '0') return 'rgba(255,255,255,0.85)'
  if (val.startsWith('-')) return '#E05C52'
  return 'rgba(255,255,255,0.38)'
}

// ─── Leaderboard parsing (from /scoreboard endpoint) ──────────────────────────

function parseLeaderboard(data) {
  try {
    const competitors = data?.events?.[0]?.competitions?.[0]?.competitors ?? []
    const parsed = competitors
      .filter(c => c.athlete?.displayName)
      .sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999))
      .map(c => {
        const ls = c.linescores ?? []
        const lastRound = ls[ls.length - 1]
        const roundDisplay = lastRound?.displayValue ?? '-'

        // Thru: linescore stats index 5 = holes completed
        let thru = '-'
        if (roundDisplay !== '-') {
          const holesDone = lastRound?.statistics?.categories?.[0]?.stats?.[5]?.value ?? 0
          thru = holesDone >= 18 ? 'F' : holesDone > 0 ? String(Math.round(holesDone)) : '-'
        }

        // Score to par — API returns string like "-5", "+2", or "E"
        const rawScore = c.score
        const scoreToPar = rawScore === '0' ? 'E' : rawScore ?? 'E'

        return {
          position:    String(c.order ?? '-'),
          name:        c.athlete.displayName,
          flagUrl:     c.athlete.flag?.href ?? null,
          flagAlt:     c.athlete.flag?.alt ?? '',
          scoreToPar,
          roundScore:  roundDisplay,
          thru,
          roundsPlayed: ls.length,
          madeCut:     true,
        }
      })

    // Detect cut: if any player has 3+ rounds, players with fewer missed
    const maxRounds = parsed.reduce((m, p) => Math.max(m, p.roundsPlayed), 0)
    if (maxRounds >= 3) {
      for (const p of parsed) p.madeCut = p.roundsPlayed >= maxRounds
    }

    return parsed
  } catch {
    return []
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function GolfLiveDot() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{
        width: '7px', height: '7px', borderRadius: '50%',
        backgroundColor: 'var(--color-live)', display: 'inline-block', flexShrink: 0,
        animation: 'pulse-dot 1.5s ease-in-out infinite',
        boxShadow: '0 0 7px 2px rgba(255,59,48,0.55)',
      }} />
      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-live)', letterSpacing: '0.06em' }}>
        LIVE
      </span>
    </div>
  )
}

function LeaderboardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '14px' }}>
      {[0,1,2,3,4].map(i => (
        <div key={i} style={{
          height: '18px', borderRadius: '4px',
          background: 'rgba(255,255,255,0.06)',
          animation: 'skeleton-pulse 1.6s ease-in-out infinite',
          animationDelay: `${i * 90}ms`,
          width: `${82 - i * 6}%`,
        }} />
      ))}
    </div>
  )
}

function LeaderRow({ player, index, isLast }) {
  const pos = player.position
  const isLeader = pos === '1' || pos === 'T1'
  const isTop3 = parseInt(pos) <= 3

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '30px 1fr 44px 40px',
      alignItems: 'center',
      minHeight: '30px',
      borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)',
      animation: 'card-enter 300ms ease-out both',
      animationDelay: `${index * 40}ms`,
    }}>
      <span style={{
        fontSize: isLeader ? '12px' : '11px',
        fontWeight: isTop3 ? 700 : 500,
        color: isTop3 ? GOLF_GREEN : 'rgba(255,255,255,0.28)',
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.01em',
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
      }}>
        {isLeader && <span style={{ fontSize: '11px', lineHeight: 1 }}>🏆</span>}
        {!isLeader && pos}
      </span>
      <span style={{
        fontSize: '14px',
        fontWeight: isTop3 ? 600 : 400,
        color: isTop3 ? 'var(--color-text-primary)' : 'rgba(255,255,255,0.75)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        paddingRight: '10px',
      }}>
        {player.name}
      </span>
      <span style={{
        fontSize: '14px',
        fontWeight: 700,
        color: scoreColor(player.scoreToPar),
        fontVariantNumeric: 'tabular-nums',
        textAlign: 'right',
        letterSpacing: '-0.02em',
      }}>
        {player.scoreToPar}
      </span>
      <span style={{
        fontSize: '12px',
        fontWeight: 400,
        color: 'rgba(255,255,255,0.3)',
        fontVariantNumeric: 'tabular-nums',
        textAlign: 'right',
      }}>
        {player.roundScore}
      </span>
    </div>
  )
}

// ─── GolfCard ─────────────────────────────────────────────────────────────────

export default function GolfCard({ game, isLive, isFinal = false, index = 0 }) {
  const [sheetOpen,   setSheetOpen]   = useState(false)
  const [leaderboard, setLeaderboard] = useState([])
  const [lbLoading,   setLbLoading]   = useState(true)
  const [lbError,     setLbError]     = useState(false)

  const isActive = isLive || isFinal

  useEffect(() => {
    if (!isActive) { setLbLoading(false); return }

    let cancelled = false
    setLbLoading(true)
    setLbError(false)

    fetch('https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard')
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json() })
      .then(data => {
        if (!cancelled) {
          setLeaderboard(parseLeaderboard(data))
          setLbLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) { setLbError(true); setLbLoading(false) }
      })

    return () => { cancelled = true }
  }, [game.id, isActive])

  const svc = resolveGolfNetwork(game.network)
  const top5 = leaderboard.slice(0, 5)
  const roundLabel = game.period ?? (isFinal ? 'Final' : isLive ? 'In Progress' : game.startTime ?? '')

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => isActive && leaderboard.length > 0 && setSheetOpen(true)}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && isActive && leaderboard.length > 0 && setSheetOpen(true)}
        className="card-hoverable"
        style={{
          background:             'rgba(255,255,255,0.04)',
          backdropFilter:         'blur(20px)',
          WebkitBackdropFilter:   'blur(20px)',
          borderRadius:           '16px',
          border:                 '1px solid rgba(255,255,255,0.08)',
          borderLeft:             `3px solid ${GOLF_GREEN}`,
          boxShadow:              `inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 24px rgba(0,0,0,0.35), 0 0 48px rgba(27,107,58,0.07)`,
          cursor:                 isActive && leaderboard.length > 0 ? 'pointer' : 'default',
          animation:              'card-enter 400ms ease-out both',
          animationDelay:         `${index * 60}ms`,
          WebkitTapHighlightColor: 'transparent',
          touchAction:            'manipulation',
          outline:                'none',
          userSelect:             'none',
          WebkitUserSelect:       'none',
        }}
      >
        <div style={{ padding: '13px 15px' }}>

          {/* Top row: badge + status */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '11px' }}>
            <span style={{
              fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: GOLF_GREEN,
              background: GOLF_GREEN2, border: `1px solid ${GOLF_BORDER}`,
              padding: '3px 9px', borderRadius: '99px',
            }}>
              Golf · PGA
            </span>
            {isLive ? (
              <GolfLiveDot />
            ) : isFinal ? (
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Final
              </span>
            ) : (
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>
                {game.startTime}
              </span>
            )}
          </div>

          {/* Tournament name + round */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '4px' }}>
              {game.homeTeam.name}
            </div>
            {roundLabel ? (
              <div style={{ fontSize: '12px', fontWeight: 500, color: GOLF_GREEN, letterSpacing: '0.02em' }}>
                {roundLabel}
              </div>
            ) : null}
          </div>

          {/* Mini leaderboard */}
          {!isActive ? (
            <div style={{
              padding: '16px 0 18px', textAlign: 'center',
              borderTop: '1px solid rgba(255,255,255,0.04)',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              marginBottom: '10px',
            }}>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', fontWeight: 400, lineHeight: 1.4 }}>
                Leaderboard available when<br />tournament begins
              </div>
            </div>
          ) : lbLoading ? (
            <LeaderboardSkeleton />
          ) : lbError || leaderboard.length === 0 ? (
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '10px 0 14px' }}>
              Leaderboard unavailable
            </div>
          ) : (
            <div style={{ marginBottom: '10px' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '30px 1fr 44px 40px',
                marginBottom: '6px', paddingBottom: '6px',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
              }}>
                {['', 'Player', 'TOT', 'RND'].map((h, i) => (
                  <span key={i} style={{
                    fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em',
                    color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase',
                    textAlign: i >= 2 ? 'right' : 'left',
                  }}>
                    {h}
                  </span>
                ))}
              </div>

              {top5.map((player, i) => (
                <LeaderRow key={i} player={player} index={i} isLast={i === top5.length - 1} />
              ))}

              {leaderboard.length > 5 && (
                <div style={{
                  marginTop: '9px', fontSize: '11px', fontWeight: 600,
                  color: 'rgba(255,255,255,0.25)', letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                }}>
                  Full leaderboard
                  <span style={{
                    display: 'inline-block', width: '6px', height: '6px',
                    borderRight: '1.5px solid rgba(255,255,255,0.25)',
                    borderBottom: '1.5px solid rgba(255,255,255,0.25)',
                    transform: 'rotate(45deg)',
                  }} />
                </div>
              )}
            </div>
          )}

          {/* Bottom row: broadcast */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {svc ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  height: '22px', padding: '0 9px', borderRadius: '5px',
                  background: svc.bg, fontSize: '9px', fontWeight: 800,
                  color: '#ffffff', letterSpacing: '0.08em', lineHeight: 1, flexShrink: 0,
                }}>
                  {svc.label}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--color-text-secondary)' }}>
                  {svc.name}
                </span>
              </div>
            ) : (
              <div />
            )}
            {isActive && leaderboard.length > 0 && (
              <span style={{
                display: 'inline-block', width: '7px', height: '7px',
                borderRight: '1.5px solid rgba(255,255,255,0.35)',
                borderBottom: '1.5px solid rgba(255,255,255,0.35)',
                transform: 'rotate(45deg)', flexShrink: 0,
              }} />
            )}
          </div>

        </div>
      </div>

      {/* Tournament detail sheet */}
      {sheetOpen && (
        <GolfTournamentSheet
          game={game}
          leaderboard={leaderboard}
          isLive={isLive}
          isFinal={isFinal}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </>
  )
}
