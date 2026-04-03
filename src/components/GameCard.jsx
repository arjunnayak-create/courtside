import { useState } from 'react'

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

// ─── Network logo config ──────────────────────────────────────────────────────

const NETWORK_CONFIG = {
  'ESPN':         { label: 'ESPN',   bg: '#CC0000' },
  'ESPN+':        { label: 'ESPN+',  bg: '#1961CC' },
  'ESPNU':        { label: 'ESPNU',  bg: '#CC0000' },
  'ABC':          { label: 'ABC',    bg: '#1a1a1a' },
  'NBC':          { label: 'NBC',    bg: '#1e1e1e' },
  'Peacock':      { label: 'NBC',    bg: '#1e1e1e' },
  'CBS':          { label: 'CBS',    bg: '#1E3D8F' },
  'Paramount+':   { label: 'P+',     bg: '#1E3D8F' },
  'TNT':          { label: 'TNT',    bg: '#006FAD' },
  'TBS':          { label: 'TBS',    bg: '#006FAD' },
  'truTV':        { label: 'tru',    bg: '#006FAD' },
  'Max':          { label: 'MAX',    bg: '#002BE7' },
  'Apple TV+':    { label: 'TV+',    bg: '#1c1c1e' },
  'Prime':        { label: 'PRIME',  bg: '#007BA7' },
  'Prime Video':  { label: 'PRIME',  bg: '#007BA7' },
  'MLB.TV':       { label: 'MLB',    bg: '#041E42' },
  'NBA TV':       { label: 'NBA',    bg: '#C9082A' },
  'FOX':          { label: 'FOX',    bg: '#CE1020' },
  'FS1':          { label: 'FS1',    bg: '#CE1020' },
  'NFL Network':  { label: 'NFLN',   bg: '#013369' },
  'Tennis Ch.':   { label: 'TC',     bg: '#883333' },
  'Golf Channel': { label: 'GOLF',   bg: '#1B5E20' },
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

function NetworkLogo({ network }) {
  if (!network) return null
  const cfg = NETWORK_CONFIG[network] ?? {
    label: network.slice(0, 5).toUpperCase(),
    bg: '#2a2a2a',
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 5px',
        height: '17px',
        minWidth: '22px',
        borderRadius: '3px',
        background: cfg.bg,
        fontSize: '7px',
        fontWeight: 900,
        color: '#fff',
        letterSpacing: '0.04em',
        lineHeight: 1,
        flexShrink: 0,
        fontFamily: 'inherit',
      }}>
        {cfg.label}
      </span>
      <span style={{
        fontSize: '12px',
        fontWeight: 400,
        color: 'var(--color-text-secondary)',
        letterSpacing: 0,
      }}>
        {network}
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
        {period}{clock ? ` · ${clock}` : ''}
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
  const showScore = (isLive || isFinal) && team.score !== null
  const dimmed    = isFinal && !isWinner

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
            width: '9px',
            fontSize: '7px',
            lineHeight: 1,
            color: 'var(--color-text-secondary)',
            opacity: isWinner ? 0.8 : 0,
            textAlign: 'center',
            flexShrink: 0,
          }}>▲</span>
          <span style={{
            fontSize: '26px',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.03em',
            lineHeight: 1,
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
                    {s !== null ? s : '—'}
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
        <NetworkLogo network={game.network} />
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

// ─── Card ─────────────────────────────────────────────────────────────────────

export default function GameCard({ game, isLive, isFinal = false }) {
  const [expanded, setExpanded] = useState(false)

  const homeWon = isFinal && game.homeTeam.score > game.awayTeam.score
  const awayWon = isFinal && game.awayTeam.score > game.homeTeam.score

  const baseBg  = 'linear-gradient(160deg, #1a1a1a 0%, #111111 100%)'
  const cardBg  = game.isFavorite
    ? `linear-gradient(160deg, ${hexToRgba(game.favoriteColor, 0.07)} 0%, transparent 50%), ${baseBg}`
    : baseBg

  const borderL = game.isFavorite
    ? `3px solid ${game.favoriteColor}`
    : '1px solid rgba(255,255,255,0.07)'

  const shadow  = game.isFavorite
    ? `0 0 36px ${hexToRgba(game.favoriteColor, 0.13)}, 0 1px 0 rgba(255,255,255,0.05) inset, 0 6px 20px rgba(0,0,0,0.5)`
    : '0 1px 0 rgba(255,255,255,0.04) inset, 0 4px 16px rgba(0,0,0,0.45)'

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setExpanded(e => !e)}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setExpanded(v => !v)}
      className="card-hoverable"
      style={{
        background: cardBg,
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.07)',
        borderLeft: borderL,
        boxShadow: shadow,
        overflow: 'hidden',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        outline: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
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
          <NetworkLogo network={game.network} />
          <span style={{
            fontSize: '13px',
            color: 'var(--color-text-muted)',
            display: 'inline-block',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            lineHeight: 1,
            opacity: 0.45,
          }}>
            ⌄
          </span>
        </div>
      </div>

      {expanded && <ExpandedDetail game={game} isLive={isLive} />}
    </div>
  )
}
