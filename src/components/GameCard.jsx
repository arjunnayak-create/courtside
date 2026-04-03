import { useState, useEffect, useRef } from 'react'

// ─── Utility ─────────────────────────────────────────────────────────────────

function hexToRgba(hex, alpha) {
  try {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r},${g},${b},${alpha})`
  } catch {
    return `rgba(0,0,0,${alpha})`
  }
}

// ─── Streaming service definitions ───────────────────────────────────────────

const SERVICES = {
  ESPN: {
    name:  'ESPN',
    label: 'ESPN',
    bg:    '#CC0000',
  },
  'ESPN+': {
    name:  'ESPN+',
    label: 'ESPN+',
    bg:    '#1961CC',
  },
  Peacock: {
    name:  'Peacock',
    label: 'PEACOCK',
    bg:    'linear-gradient(135deg, #6B2FA0 0%, #0AA5A8 100%)',
  },
  'Paramount+': {
    name:  'Paramount+',
    label: 'P+',
    bg:    '#1641A3',
  },
  Max: {
    name:  'Max',
    label: 'MAX',
    bg:    '#002BE7',
  },
  'Prime Video': {
    name:  'Prime Video',
    label: 'PRIME',
    bg:    'linear-gradient(135deg, #00A8E1 0%, #007BA7 100%)',
  },
  'Apple TV+': {
    name:   'Apple TV+',
    label:  'TV+',
    bg:     '#1c1c1e',
    border: '1px solid rgba(255,255,255,0.15)',
  },
  'YouTube TV': {
    name:  'YouTube TV',
    label: 'YT',
    bg:    '#FF0000',
  },
  'NBA League Pass': {
    name:  'NBA League Pass',
    label: 'LEAGUE',
    bg:    '#C9082A',
  },
  'MLB.TV': {
    name:  'MLB.TV',
    label: 'MLB.TV',
    bg:    '#041E42',
  },
}

const RSN_KEYWORDS = ['SN', 'FanDuel', 'YES', 'MSG', 'BSSC', 'CHSN', 'ROOT', 'NESN', 'MASN', 'FSSO']

function resolveStreaming(network, sport) {
  const n = network || ''

  // Streaming-first: exact/known channel → streaming home
  if (n === 'ESPN' || n === 'ABC' || n === 'ESPNU') return SERVICES['ESPN']
  if (n === 'ESPN+')                                 return SERVICES['ESPN+']
  if (n === 'NBC'  || n === 'Peacock')               return SERVICES['Peacock']
  if (n === 'CBS'  || n === 'Paramount+')            return SERVICES['Paramount+']
  if (n === 'TNT'  || n === 'TBS' || n === 'truTV' || n === 'Max') return SERVICES['Max']
  if (n === 'Apple TV+' || n === 'Apple TV')          return SERVICES['Apple TV+']
  if (n === 'Prime' || n === 'Prime Video' || n.toLowerCase().includes('amazon')) return SERVICES['Prime Video']
  if (n === 'NBA TV')                                return SERVICES['NBA League Pass']
  if (n === 'MLB.TV')                                return SERVICES['MLB.TV']

  // Regional sports networks → YouTube TV
  if (n && RSN_KEYWORDS.some(kw => n.includes(kw)))  return SERVICES['YouTube TV']

  // Fallback: sport-specific streaming
  if (sport === 'NBA')    return SERVICES['NBA League Pass']
  if (sport === 'MLB')    return SERVICES['MLB.TV']
  if (sport === 'Soccer') return SERVICES['Apple TV+']

  return null
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SportBadge({ sport }) {
  return (
    <span style={{
      fontSize: '10px',
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--color-text-muted)',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.07)',
      padding: '3px 9px',
      borderRadius: '99px',
    }}>
      {sport}
    </span>
  )
}

function NetworkLogo({ network, sport }) {
  const svc = resolveStreaming(network, sport)
  if (!svc) return null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
      <span style={{
        display:        'inline-flex',
        alignItems:     'center',
        justifyContent: 'center',
        height:         '22px',
        padding:        '0 9px',
        borderRadius:   '5px',
        background:     svc.bg,
        border:         svc.border ?? 'none',
        fontSize:       '9px',
        fontWeight:     800,
        fontFamily:     'inherit',
        color:          '#ffffff',
        letterSpacing:  '0.08em',
        lineHeight:     1,
        flexShrink:     0,
        whiteSpace:     'nowrap',
      }}>
        {svc.label}
      </span>
      <span style={{
        fontSize:   '12px',
        fontWeight: 400,
        color:      'var(--color-text-secondary)',
        letterSpacing: 0,
      }}>
        {svc.name}
      </span>
    </div>
  )
}

function LiveIndicator({ period, clock }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{
        width: '7px',
        height: '7px',
        borderRadius: '50%',
        backgroundColor: 'var(--color-live)',
        display: 'inline-block',
        flexShrink: 0,
        animation: 'pulse-dot 1.5s ease-in-out infinite',
        boxShadow: '0 0 7px 2px rgba(255,59,48,0.55)',
      }} />
      <span style={{
        fontSize: '12px',
        fontWeight: 700,
        color: 'var(--color-live)',
        letterSpacing: '0.06em',
      }}>
        LIVE
      </span>
      <span style={{
        fontSize: '12px',
        color: 'var(--color-text-secondary)',
        fontWeight: 400,
        letterSpacing: 0,
      }}>
        {period}{clock ? ` - ${clock}` : ''}
      </span>
    </div>
  )
}

function FinalBadge({ period }) {
  return (
    <span style={{
      fontSize: '11px',
      fontWeight: 600,
      color: 'var(--color-text-muted)',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    }}>
      {period || 'Final'}
    </span>
  )
}

function TeamRow({ team, isLive, isFinal, isWinner }) {
  const showScore   = (isLive || isFinal) && team.score !== null
  const dimmed      = isFinal && !isWinner
  const prevScore   = useRef(team.score)
  const [pulsing, setPulsing] = useState(false)

  useEffect(() => {
    const prev = prevScore.current
    prevScore.current = team.score
    if (isLive && team.score !== null && prev !== null && team.score !== prev) {
      setPulsing(true)
      const t = setTimeout(() => setPulsing(false), 300)
      return () => clearTimeout(t)
    }
  }, [team.score, isLive])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: '34px',
      opacity: dimmed ? 0.35 : 1,
      transition: 'opacity 0.2s ease',
    }}>
      {/* Left: logo + abbr + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0, flex: 1 }}>
        {team.logo
          ? <img src={team.logo} alt={team.abbr} width={26} height={26} style={{ objectFit: 'contain', flexShrink: 0 }} />
          : <div style={{ width: '26px', flexShrink: 0 }} />
        }
        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--color-text-muted)',
          letterSpacing: '0.04em',
          flexShrink: 0,
          minWidth: '24px',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {team.abbr}
        </span>
        <span style={{
          fontSize: '16px',
          fontWeight: 500,
          color: 'var(--color-text-primary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {team.name}
        </span>
      </div>

      {/* Right: winner indicator + score */}
      {showScore && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, paddingLeft: '14px' }}>
          <span style={{
            display:      'inline-block',
            width:        0,
            height:       0,
            borderLeft:   '3.5px solid transparent',
            borderRight:  '3.5px solid transparent',
            borderBottom: '5px solid var(--color-text-secondary)',
            opacity:      isWinner ? 0.7 : 0,
            flexShrink:   0,
            marginRight:  '1px',
          }} />
          <span style={{
            fontSize:           isLive ? '28px' : '26px',
            fontWeight:         800,
            color:              'var(--color-text-primary)',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing:      '-0.03em',
            lineHeight:         1,
            display:            'inline-block',
            animation:          pulsing ? 'score-pulse 300ms ease-out forwards' : 'none',
          }}>
            {team.score}
          </span>
        </div>
      )}
    </div>
  )
}

function ScoreTable({ game }) {
  const { quarterScores, homeTeam, awayTeam } = game
  if (!quarterScores) return null
  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: '16px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: 'min-content' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '0 8px 6px 0', color: 'var(--color-text-muted)', fontWeight: 500, width: '40px' }} />
            {quarterScores.labels.map(label => (
              <th key={label} style={{ textAlign: 'center', padding: '0 6px 6px', color: 'var(--color-text-muted)', fontWeight: 500, minWidth: '28px' }}>
                {label}
              </th>
            ))}
            <th style={{ textAlign: 'center', padding: '0 0 6px 8px', color: 'var(--color-text-primary)', fontWeight: 700, minWidth: '28px' }}>T</th>
          </tr>
        </thead>
        <tbody>
          {[awayTeam, homeTeam].map((team) => {
            const scores = team === awayTeam ? quarterScores.away : quarterScores.home
            const total  = scores.filter(s => s !== null).reduce((a, b) => a + b, 0)
            return (
              <tr key={team.abbr}>
                <td style={{ padding: '4px 8px 4px 0', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '12px', whiteSpace: 'nowrap' }}>
                  {team.abbr}
                </td>
                {scores.map((s, i) => (
                  <td key={i} style={{ textAlign: 'center', padding: '4px 6px', color: s !== null ? 'var(--color-text-primary)' : 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                    {s !== null ? s : '-'}
                  </td>
                ))}
                <td style={{ textAlign: 'center', padding: '4px 0 4px 8px', color: 'var(--color-text-primary)', fontWeight: 700, fontVariantNumeric: 'tabular-nums', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
                  {total}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function OddsPill({ label, value }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '7px 11px', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '3px' }}>
        {label}
      </div>
      <div style={{ fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
    </div>
  )
}

function ExpandedDetail({ game }) {
  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '14px 16px', animation: 'expand-in 0.18s ease' }}>
      {game.quarterScores && (
        <>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
            Score
          </div>
          <ScoreTable game={game} />
        </>
      )}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
          Broadcast
        </div>
        <NetworkLogo network={game.network} sport={game.sport} />
        {game.network && resolveStreaming(game.network, game.sport)?.name !== game.network && (
          <div style={{ fontSize: '11px', fontWeight: 400, color: 'var(--color-text-muted)', marginTop: '6px' }}>
            Also on: {game.network}
          </div>
        )}
      </div>
      <div>
        <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
          Odds
        </div>
        {game.odds ? (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {game.odds.spread && <OddsPill label="Spread" value={game.odds.spread} />}
            {game.odds.total  && <OddsPill label="Total"  value={game.odds.total} />}
            {game.odds.ml     && <OddsPill label="ML"     value={game.odds.ml} />}
          </div>
        ) : (
          <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>Unavailable</div>
        )}
      </div>
    </div>
  )
}

// ─── Insight bubble ──────────────────────────────────────────────────────────

function InsightSkeleton() {
  return (
    <div style={{
      height:       '22px',
      width:        '60%',
      borderRadius: '99px',
      background:   'rgba(255,255,255,0.04)',
      border:       '1px solid rgba(255,255,255,0.07)',
      animation:    'skeleton-pulse 1.6s ease-in-out infinite',
    }} />
  )
}

function InsightBubble({ text }) {
  return (
    <div style={{
      position:     'relative',
      padding:      '1.5px',
      borderRadius: '99px',
      overflow:     'hidden',
      maxWidth:     '88%',
      flexShrink:   0,
      animation:    'insight-fade-in 500ms ease forwards',
    }}>
      {/* Rotating iridescent border */}
      <div style={{
        position:   'absolute',
        inset:      '-60%',
        background: 'conic-gradient(from 0deg, #7928CA, #2563EB, #0891B2, #059669, #7928CA)',
        animation:  'insight-spin 5s linear infinite',
      }} />
      {/* Glass content layer */}
      <div style={{
        position:      'relative',
        background:    'rgba(10,10,10,0.92)',
        borderRadius:  '98px',
        padding:       '4px 12px 4px 9px',
        display:       'flex',
        alignItems:    'center',
        gap:           '6px',
      }}>
        <span style={{
          fontSize:   '8px',
          lineHeight: 1,
          flexShrink: 0,
          background: 'linear-gradient(135deg, #A78BFA, #38BDF8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>✦</span>
        <span style={{
          fontSize:      '11px',
          fontWeight:    400,
          color:         'rgba(255,255,255,0.7)',
          overflow:      'hidden',
          textOverflow:  'ellipsis',
          whiteSpace:    'nowrap',
          letterSpacing: '0.01em',
          lineHeight:    1.3,
        }}>
          {text}
        </span>
      </div>
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export default function GameCard({ game, isLive, isFinal = false, index = 0, insight }) {
  const [expanded, setExpanded] = useState(false)

  const homeWon = isFinal && game.homeTeam.score > game.awayTeam.score
  const awayWon = isFinal && game.awayTeam.score > game.homeTeam.score

  const cardBg = game.isFavorite
    ? hexToRgba(game.favoriteColor, 0.07)
    : 'rgba(255,255,255,0.04)'

  const borderL = game.isFavorite
    ? `3px solid ${game.favoriteColor}`
    : '1px solid rgba(255,255,255,0.08)'

  const shadow = game.isFavorite
    ? `inset 0 1px 0 rgba(255,255,255,0.1), 0 0 40px ${hexToRgba(game.favoriteColor, 0.12)}, 0 8px 32px rgba(0,0,0,0.5)`
    : 'inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 24px rgba(0,0,0,0.35)'

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setExpanded(e => !e)}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setExpanded(v => !v)}
      className="card-hoverable"
      style={{
        background:             cardBg,
        backdropFilter:         'blur(20px)',
        WebkitBackdropFilter:   'blur(20px)',
        borderRadius:           '16px',
        border:                 '1px solid rgba(255,255,255,0.08)',
        borderLeft:             borderL,
        boxShadow:              shadow,
        overflow:               'hidden',
        cursor:                 'pointer',
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
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '11px' }}>
          <SportBadge sport={game.sport} />
          {isLive
            ? <LiveIndicator period={game.period} clock={game.clock} />
            : isFinal
              ? <FinalBadge period={game.period} />
              : <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>{game.startTime}</span>
          }
        </div>

        {/* Teams */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', marginBottom: '12px' }}>
          {game.awayTeam
            ? <>
                <TeamRow team={game.awayTeam} isLive={isLive} isFinal={isFinal} isWinner={awayWon} />
                <TeamRow team={game.homeTeam} isLive={isLive} isFinal={isFinal} isWinner={homeWon} />
              </>
            : <div style={{ fontSize: '17px', fontWeight: 500, color: 'var(--color-text-primary)', padding: '8px 0' }}>
                {game.homeTeam.name}
              </div>
          }
        </div>

        {/* Bottom row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <NetworkLogo network={game.network} sport={game.sport} />
          <span style={{
            display:      'inline-block',
            width:        '7px',
            height:       '7px',
            borderRight:  '1.5px solid rgba(255,255,255,0.45)',
            borderBottom: '1.5px solid rgba(255,255,255,0.45)',
            transform:    expanded ? 'rotate(225deg) translateY(2px)' : 'rotate(45deg)',
            transition:   'transform 0.2s ease',
            flexShrink:   0,
          }} />
        </div>

        {/* AI insight bubble */}
        {insight && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
            {insight === '__loading__'
              ? <InsightSkeleton />
              : <InsightBubble text={insight} />
            }
          </div>
        )}
      </div>

      {expanded && <ExpandedDetail game={game} isLive={isLive} />}
    </div>
  )
}
