const SPORTS = ['All', 'NBA', 'NFL', 'MLB', 'NHL', 'Soccer', 'CFB', 'CBB', 'Tennis', 'Golf']

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
        display: 'flex',
        gap: '7px',
        width: 'max-content',
        paddingLeft: 'max(18px, env(safe-area-inset-left))',
        paddingRight: 'max(18px, env(safe-area-inset-right))',
      }}>
        {visible.map(sport => {
          const active = activeSport === sport
          return (
            <button
              key={sport}
              onClick={() => onSelect(sport)}
              style={{
                height: '32px',
                minWidth: '44px',
                padding: '0 14px',
                borderRadius: '99px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '14px',
                fontWeight: active ? 600 : 400,
                background: active ? '#ffffff' : 'transparent',
                color: active ? '#000000' : 'rgba(255,255,255,0.4)',
                border: active ? 'none' : '1px solid rgba(255,255,255,0.1)',
                transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                whiteSpace: 'nowrap',
                outline: 'none',
                letterSpacing: active ? '-0.01em' : '0',
              }}
            >
              {sport}
            </button>
          )
        })}
      </div>
    </div>
  )
}
