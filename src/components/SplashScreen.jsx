import { useState, useEffect, useRef } from 'react'

const SPLASH_CSS = `
@keyframes wordmark-spring {
  from { transform: scale(1.15); }
  to   { transform: scale(1.0);  }
}
@keyframes line-sweep {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
@keyframes tagline-in {
  from { opacity: 0;   }
  to   { opacity: 0.4; }
}
@keyframes splash-exit {
  from { opacity: 1; transform: scale(1);    }
  to   { opacity: 0; transform: scale(1.06); }
}
`

function getAtmosphere() {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) {
    // Morning — cool pre-dawn blue
    return {
      top:    'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(30,60,114,0.4) 0%, transparent 100%)',
      bottom: null,
    }
  }
  if (h >= 12 && h < 17) {
    // Afternoon — warm amber
    return {
      top:    'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(180,83,9,0.25) 0%, transparent 100%)',
      bottom: null,
    }
  }
  if (h >= 17 && h < 21) {
    // Evening — golden sunset: red bloom top, amber warmth bottom
    return {
      top:    'radial-gradient(ellipse 90% 55% at 50% 0%, rgba(180,40,20,0.35) 0%, transparent 100%)',
      bottom: 'radial-gradient(ellipse 70% 40% at 50% 100%, rgba(251,120,20,0.2) 0%, transparent 100%)',
    }
  }
  // Night — deep navy
  return {
    top:    'radial-gradient(ellipse 100% 70% at 50% 0%, rgba(10,10,40,0.5) 0%, transparent 100%)',
    bottom: null,
  }
}

export default function SplashScreen({ onComplete }) {
  const atmosphere = getAtmosphere()
  const [showWordmark, setShowWordmark] = useState(false)
  const [showLine,     setShowLine]     = useState(false)
  const [showTagline,  setShowTagline]  = useState(false)
  const [exiting,      setExiting]      = useState(false)

  // Keep onComplete stable across re-renders so the effect runs only once
  const onCompleteRef = useRef(onComplete)
  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])

  useEffect(() => {
    const t1 = setTimeout(() => setShowWordmark(true),  100)
    const t2 = setTimeout(() => setShowLine(true),      200)
    const t3 = setTimeout(() => setShowTagline(true),   900)
    const t4 = setTimeout(() => setExiting(true),      1800)
    const t5 = setTimeout(() => onCompleteRef.current(), 2150)
    return () => [t1, t2, t3, t4, t5].forEach(clearTimeout)
  }, [])

  return (
    <>
      <style>{SPLASH_CSS}</style>
      <div
        style={{
          position:        'fixed',
          inset:           0,
          zIndex:          9999,
          backgroundColor: '#080808',
          display:         'flex',
          flexDirection:   'column',
          alignItems:      'center',
          justifyContent:  'center',
          animation:       exiting
            ? 'splash-exit 350ms ease-in forwards'
            : 'none',
        }}
      >
        {/* Time-of-day atmosphere */}
        <div style={{
          position:      'absolute',
          inset:         0,
          pointerEvents: 'none',
          background:    [atmosphere.top, atmosphere.bottom].filter(Boolean).join(', '),
        }} />

        {/* Film-grain overlay */}
        <div style={{
          position:      'absolute',
          inset:         0,
          opacity:       0.03,
          pointerEvents: 'none',
          overflow:      'hidden',
        }}>
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <filter id="splash-grain">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.65"
                numOctaves="3"
                stitchTiles="stitch"
              />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#splash-grain)" />
          </svg>
        </div>

        {/* Centre stack */}
        <div style={{
          position:       'relative',
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
        }}>
          {/* Wordmark */}
          <div style={{
            fontFamily:    "'Inter', sans-serif",
            fontSize:      '3.5rem',
            fontWeight:    800,
            letterSpacing: '-0.05em',
            color:         '#ffffff',
            lineHeight:    1,
            textShadow:    '0 0 80px rgba(255,255,255,0.15)',
            visibility:    showWordmark ? 'visible' : 'hidden',
            animation:     showWordmark
              ? 'wordmark-spring 600ms cubic-bezier(0.16, 1, 0.3, 1) forwards'
              : 'none',
          }}>
            COURTSIDE
          </div>

          {/* Sweep line */}
          <div style={{
            width:           '120px',
            height:          '1px',
            backgroundColor: '#ffffff',
            marginTop:       '14px',
            transformOrigin: 'left',
            transform:       showLine ? undefined : 'scaleX(0)',
            animation:       showLine
              ? 'line-sweep 500ms ease-out forwards'
              : 'none',
          }} />

          {/* Tagline */}
          <div style={{
            fontFamily:    "'Inter', sans-serif",
            fontSize:      '0.75rem',
            fontWeight:    300,
            letterSpacing: '0.15em',
            color:         '#ffffff',
            marginTop:     '18px',
            opacity:       0,
            animation:     showTagline
              ? 'tagline-in 400ms ease forwards'
              : 'none',
          }}>
            Your Game. Your Way.
          </div>
        </div>
      </div>
    </>
  )
}
