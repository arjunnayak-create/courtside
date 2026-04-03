const SPORTS = ['All', 'NBA', 'NFL', 'MLB', 'NHL', 'Soccer', 'CFB', 'CBB', 'Tennis', 'Golf', 'MMA']

const SPORT_LOGOS = {
  NBA: 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png',
  NFL: 'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png',
  MLB: 'https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png',
  NHL: 'https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png',
}

// Sports that get a small dot accent instead of a logo
const DOT_SPORTS = new Set(['Soccer'])

export default function SportFilter({ activeSport, onSelect, activeSports }) {
  const visible = SPORTS.filter(s => s === 'All' || !activeSports || activeSports.has(s))

  return (
    <div
      className="scroll-no-bar"
      style={{
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: '13px',
      }}
    >
      <div style={{
        display:      'flex',
        gap:          '7px',
        width:        'max-content',
        paddingLeft:  'max(18px, env(safe-area-inset-left))',
        paddingRight: 'max(18px, env(safe-area-inset-right))',
      }}>
        {visible.map(sport => {
          const active  = activeSport === sport
          const hasLogo = !!SPORT_LOGOS[sport]
          const hasDot  = DOT_SPORTS.has(sport)

          return (
            <button
              key={sport}
              onClick={() => onSelect(sport)}
              style={{
                height:                   '32px',
                minWidth:                 '44px',
                padding:                  hasLogo || hasDot ? '0 12px 0 8px' : '0 14px',
                borderRadius:             '99px',
                cursor:                   'pointer',
                fontFamily:               'inherit',
                fontSize:                 '14px',
                fontWeight:               active ? 600 : 400,
                background:               active ? '#ffffff' : 'transparent',
                color:                    active ? '#000000' : 'rgba(255,255,255,0.4)',
                border:                   active ? 'none' : '1px solid rgba(255,255,255,0.1)',
                transition:               'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
                WebkitTapHighlightColor:  'transparent',
                touchAction:              'manipulation',
                whiteSpace:               'nowrap',
                outline:                  'none',
                letterSpacing:            active ? '-0.01em' : '0',
                display:                  'flex',
                alignItems:               'center',
                gap:                      '6px',
              }}
            >
              {hasLogo && (
                <img
                  src={SPORT_LOGOS[sport]}
                  alt=""
                  width={14}
                  height={14}
                  style={{
                    objectFit:  'contain',
                    flexShrink: 0,
                    opacity:    active ? 1 : 0.55,
                    filter:     active ? 'none' : 'grayscale(0.3)',
                  }}
                />
              )}
              {hasDot && (
                <span style={{
                  width:           '5px',
                  height:          '5px',
                  borderRadius:    '50%',
                  backgroundColor: active ? '#000' : 'rgba(255,255,255,0.35)',
                  flexShrink:      0,
                }} />
              )}
              {sport}
            </button>
          )
        })}
      </div>
    </div>
  )
}
