import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

// ─── Constants ────────────────────────────────────────────────────────────────

const GOLF_GREEN = '#1B6B3A'
const DISMISS_THRESHOLD = 120

const SERVICES = {
  ESPN:           { label: 'ESPN',    name: 'ESPN',        bg: '#CC0000' },
  ABC:            { label: 'ESPN',    name: 'ESPN',        bg: '#CC0000' },
  ESPNU:          { label: 'ESPN',    name: 'ESPN',        bg: '#CC0000' },
  'ESPN+':        { label: 'ESPN+',   name: 'ESPN+',       bg: '#1961CC' },
  CBS:            { label: 'P+',      name: 'Paramount+',  bg: '#1641A3' },
  'Paramount+':   { label: 'P+',      name: 'Paramount+',  bg: '#1641A3' },
  NBC:            { label: 'PEACOCK', name: 'Peacock',      bg: 'linear-gradient(135deg,#6B2FA0 0%,#0AA5A8 100%)' },
  Peacock:        { label: 'PEACOCK', name: 'Peacock',      bg: 'linear-gradient(135deg,#6B2FA0 0%,#0AA5A8 100%)' },
  'Golf Channel': { label: 'GOLF',    name: 'Golf Channel', bg: '#006747' },
  'Prime Video':  { label: 'PRIME',   name: 'Prime Video',  bg: 'linear-gradient(135deg,#00A8E1 0%,#007BA7 100%)' },
}

function scoreColor(val) {
  if (!val || val === 'E' || val === '0') return 'rgba(255,255,255,0.85)'
  if (val.startsWith('-')) return '#E05C52'
  return 'rgba(255,255,255,0.38)'
}

function uniqueBroadcasts(networks) {
  const seen = new Set()
  const result = []
  for (const n of networks) {
    const svc = SERVICES[n]
    if (!svc || seen.has(svc.name)) continue
    seen.add(svc.name)
    result.push(svc)
  }
  return result
}

// ─── Sheet ────────────────────────────────────────────────────────────────────

export default function GolfTournamentSheet({ game, leaderboard, isLive, isFinal, onClose }) {
  const [closing, setClosing] = useState(false)
  const [dragY, setDragY]     = useState(0)
  const touchRef              = useRef({ startY: 0, dragging: false })
  const sheetRef              = useRef(null)

  // Lock body scroll when sheet is open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  function dismiss() {
    setClosing(true)
    setTimeout(onClose, 280)
  }

  function onTouchStart(e) {
    const el = sheetRef.current
    // Only start drag if scrolled to top
    if (el && el.scrollTop <= 0) {
      touchRef.current = { startY: e.touches[0].clientY, dragging: true }
    }
  }

  function onTouchMove(e) {
    if (!touchRef.current.dragging) return
    const dy = e.touches[0].clientY - touchRef.current.startY
    if (dy > 0) {
      setDragY(dy)
      e.preventDefault()
    } else {
      setDragY(0)
    }
  }

  function onTouchEnd() {
    if (!touchRef.current.dragging) return
    touchRef.current.dragging = false
    if (dragY > DISMISS_THRESHOLD) {
      dismiss()
    } else {
      setDragY(0)
    }
  }

  const broadcasts = uniqueBroadcasts(game.allNetworks ?? [])
  const roundLabel = game.period ?? (isFinal ? 'Final' : isLive ? 'In Progress' : game.startTime ?? '')

  // Build display rows with cut line insertion
  const top15 = leaderboard.slice(0, 15)
  const cutIndex = top15.findIndex(p => !p.madeCut)
  const hasCut = cutIndex > 0

  const sheetTransform = closing
    ? undefined
    : dragY > 0
      ? `translateY(${dragY}px)`
      : undefined

  const sheetAnimation = closing
    ? 'sheet-down 280ms cubic-bezier(0.4, 0, 1, 1) forwards'
    : dragY > 0
      ? 'none'
      : 'sheet-up 420ms cubic-bezier(0.22, 1.0, 0.36, 1.0) both'

  const backdropAnimation = closing
    ? 'backdrop-out 280ms ease forwards'
    : 'backdrop-in 300ms ease both'

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      WebkitTapHighlightColor: 'transparent',
    }}>

      {/* Backdrop */}
      <div
        onClick={dismiss}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          animation: backdropAnimation,
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          '--sheet-y': `${dragY}px`,
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          maxHeight: '92svh',
          background: '#0d0d0d',
          borderRadius: '22px 22px 0 0',
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          animation: sheetAnimation,
          transform: sheetTransform,
          transition: !closing && dragY === 0 ? 'none' : 'none',
          boxShadow: '0 -8px 60px rgba(0,0,0,0.6), 0 -2px 20px rgba(0,0,0,0.4)',
        }}
      >
        {/* Top green edge accent */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '160px',
          background: `radial-gradient(ellipse 500px 120px at 50% -20px, rgba(27,107,58,0.12) 0%, transparent 70%)`,
          pointerEvents: 'none', borderRadius: '22px 22px 0 0',
        }} />

        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 0' }}>
          <div style={{
            width: '36px', height: '4px', borderRadius: '2px',
            background: 'rgba(255,255,255,0.18)',
          }} />
        </div>

        {/* Close button */}
        <button
          onClick={(e) => { e.stopPropagation(); dismiss() }}
          style={{
            position: 'absolute', top: '14px', right: '16px',
            width: '30px', height: '30px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 2,
            color: 'rgba(255,255,255,0.5)', fontSize: '14px', fontWeight: 500,
            WebkitTapHighlightColor: 'transparent',
          }}
          aria-label="Close"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        <div style={{ padding: '16px 20px 0', position: 'relative' }}>

          {/* Tournament name */}
          <div style={{ paddingRight: '36px', marginBottom: '6px' }}>
            <h2 style={{
              fontSize: '22px', fontWeight: 800, color: 'var(--color-text-primary)',
              letterSpacing: '-0.03em', lineHeight: 1.15, margin: 0,
            }}>
              {game.homeTeam.name}
            </h2>
          </div>

          {/* Round + live status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            {roundLabel && (
              <span style={{ fontSize: '13px', fontWeight: 600, color: GOLF_GREEN, letterSpacing: '0.01em' }}>
                {roundLabel}
              </span>
            )}
            {isLive && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  backgroundColor: 'var(--color-live)',
                  animation: 'pulse-dot 1.5s ease-in-out infinite',
                  boxShadow: '0 0 6px 2px rgba(255,59,48,0.5)',
                }} />
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-live)', letterSpacing: '0.06em' }}>
                  LIVE
                </span>
              </div>
            )}
          </div>

          {/* Broadcast badges */}
          {broadcasts.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '18px' }}>
              {broadcasts.map((svc, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    height: '24px', padding: '0 10px', borderRadius: '6px',
                    background: svc.bg, fontSize: '9px', fontWeight: 800,
                    color: '#ffffff', letterSpacing: '0.08em', lineHeight: 1,
                  }}>
                    {svc.label}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--color-text-secondary)' }}>
                    {svc.name}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Separator */}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', marginBottom: '4px' }} />
        </div>

        {/* Leaderboard */}
        <div style={{ padding: '0 20px 32px' }}>

          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '32px 1fr 44px 44px 40px',
            alignItems: 'center',
            padding: '12px 0 8px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            {['POS', '', 'TOT', 'RND', 'THRU'].map((h, i) => (
              <span key={i} style={{
                fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em',
                color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase',
                textAlign: i >= 2 ? 'right' : 'left',
              }}>
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {top15.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', fontSize: '14px', color: 'var(--color-text-muted)' }}>
              Leaderboard unavailable
            </div>
          ) : top15.map((player, idx) => {
            const pos = player.position
            const isLeader = pos === '1' || pos === 'T1'
            const isTop3 = parseInt(pos) <= 3 || ['T1','T2','T3'].includes(pos)
            const missedCut = !player.madeCut

            return (
              <div key={idx}>
                {/* Cut line divider */}
                {hasCut && idx === cutIndex && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 0', margin: '2px 0',
                    animation: 'lb-row-in 300ms ease-out both',
                    animationDelay: `${idx * 30 + 120}ms`,
                  }}>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                    <span style={{
                      fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em',
                      color: 'rgba(255,255,255,0.18)', textTransform: 'uppercase',
                      flexShrink: 0,
                    }}>
                      CUT
                    </span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                  </div>
                )}

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '32px 1fr 44px 44px 40px',
                  alignItems: 'center',
                  minHeight: '42px',
                  borderBottom: idx < top15.length - 1 && !(hasCut && idx + 1 === cutIndex) ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  opacity: missedCut ? 0.4 : 1,
                  animation: 'lb-row-in 300ms ease-out both',
                  animationDelay: `${idx * 30 + (hasCut && idx >= cutIndex ? 160 : 120)}ms`,
                }}>
                  {/* Position */}
                  <span style={{
                    fontSize: '12px',
                    fontWeight: isTop3 ? 800 : 500,
                    color: isTop3 ? GOLF_GREEN : 'rgba(255,255,255,0.28)',
                    fontVariantNumeric: 'tabular-nums',
                    display: 'flex', alignItems: 'center',
                  }}>
                    {isLeader
                      ? <span style={{ fontSize: '14px', lineHeight: 1 }}>🏆</span>
                      : pos
                    }
                  </span>

                  {/* Flag + Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, paddingRight: '10px' }}>
                    {player.flagUrl ? (
                      <img
                        src={player.flagUrl}
                        alt={player.flagAlt}
                        width={16}
                        height={16}
                        style={{ objectFit: 'contain', flexShrink: 0, borderRadius: '2px' }}
                      />
                    ) : (
                      <div style={{ width: 16, height: 16, flexShrink: 0 }} />
                    )}
                    <span style={{
                      fontSize: '14px',
                      fontWeight: isTop3 ? 600 : 400,
                      color: isTop3 ? 'var(--color-text-primary)' : 'rgba(255,255,255,0.72)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {player.name}
                    </span>
                  </div>

                  {/* Score to par */}
                  <span style={{
                    fontSize: '15px', fontWeight: 700,
                    color: scoreColor(player.scoreToPar),
                    fontVariantNumeric: 'tabular-nums',
                    textAlign: 'right', letterSpacing: '-0.02em',
                  }}>
                    {player.scoreToPar}
                  </span>

                  {/* Today's round */}
                  <span style={{
                    fontSize: '13px', fontWeight: 400,
                    color: 'rgba(255,255,255,0.35)',
                    fontVariantNumeric: 'tabular-nums',
                    textAlign: 'right',
                  }}>
                    {player.roundScore}
                  </span>

                  {/* Thru */}
                  <span style={{
                    fontSize: '12px', fontWeight: 400,
                    color: player.thru === 'F' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.22)',
                    fontVariantNumeric: 'tabular-nums',
                    textAlign: 'right',
                  }}>
                    {player.thru}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom safe area spacing */}
        <div style={{ height: 'max(20px, env(safe-area-inset-bottom))' }} />
      </div>
    </div>,
    document.body
  )
}
