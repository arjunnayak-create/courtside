function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Header() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingLeft: 'max(18px, env(safe-area-inset-left))',
      paddingRight: 'max(18px, env(safe-area-inset-right))',
      paddingTop: 'max(14px, calc(env(safe-area-inset-top) + 10px))',
      paddingBottom: '11px',
      minHeight: '44px',
    }}>
      <span style={{
        fontFamily: 'var(--font-display)',
        fontSize: '22px',
        fontWeight: 700,
        letterSpacing: '-0.05em',
        color: 'var(--color-text-primary)',
        lineHeight: 1,
      }}>
        COURTSIDE
      </span>
      <span style={{
        fontSize: '13px',
        fontWeight: 400,
        color: 'var(--color-text-primary)',
        opacity: 0.35,
        letterSpacing: '-0.01em',
      }}>
        {getGreeting()}, Arjun
      </span>
    </div>
  )
}
