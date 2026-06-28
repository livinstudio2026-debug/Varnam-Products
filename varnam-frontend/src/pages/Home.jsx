import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { useHomeStore } from '../store/homeStore'
import ProductCard from '../components/ui/ProductCard'

gsap.registerPlugin(ScrollTrigger)

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   ICONS â€” all SVG, no emojis
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const ChevronRight = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)
const ChevronLeft = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

// Trust bar icons
// stroke is cream (#FDF6EC) so icons are visible on the dark trust bar background
const IconLeaf = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FDF6EC" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
  </svg>
)

const IconDroplet = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FDF6EC" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
  </svg>
)

const IconTruck = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FDF6EC" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="1"/>
    <path d="M16 8h4l3 3v5h-7V8z"/>
    <circle cx="5.5" cy="18.5" r="2.5"/>
    <circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
)

const IconShield = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FDF6EC" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
)

// Why Varnam icons
const IconSprout = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#52B788" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 20h10"/>
    <path d="M10 20c5.5-2.5.8-6.4 3-9"/>
    <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-2-3.1.3-1.3 1.6-2 2.7-2.1 1-.1 1.8.1 2.4.6C9.9 8 9.5 9 9.5 9.4z"/>
    <path d="M14.1 6c-.7 1.5-.5 3.3.1 4.7 1.7-.5 3-.7 4.2-.1 1.1.6 2 1.9 1.6 3.2-.4 1.2-1.8 1.8-2.9 1.8-1 0-1.8-.4-2.4-1-.7-.7-1.4-1.7-1.6-2.8"/>
  </svg>
)

const IconFlask = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#52B788" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3h6v7l3.5 7A2 2 0 0 1 16.7 20H7.3a2 2 0 0 1-1.8-3L9 10V3z"/>
    <line x1="9" y1="3" x2="15" y2="3"/>
    <path d="M6.5 15h11"/>
  </svg>
)

const IconSnowflake = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#52B788" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="2" x2="12" y2="22"/>
    <path d="M17 7l-5-5-5 5"/>
    <path d="M17 17l-5 5-5-5"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M7 7l-5 5 5 5"/>
    <path d="M17 7l5 5-5 5"/>
  </svg>
)

const IconPackage = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#52B788" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16.5 9.4l-9-5.19"/>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
)

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   1. HERO BANNER
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   1. HERO BANNER
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function FloatingBubbles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let bubbles = [];

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // INCREASED AMOUNT: Bumped from 18 to 50 for a richer floating ecosystem
    const bubbleCount = 50;
    for (let i = 0; i < bubbleCount; i++) {
      bubbles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height + canvas.height,
        radius: Math.random() * 10 + 3, // Slightly tighter radii bounds for elegance at scale
        speed: Math.random() * 0.55 + 0.15, // Subtle variation so they don't rush the content
        opacity: Math.random() * 0.10 + 0.03, // Soft transparency thresholds to preserve readability
        wobble: Math.random() * 2,
        wobbleSpeed: Math.random() * 0.015 + 0.005
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < bubbles.length; i++) {
        const b = bubbles[i];
        b.y -= b.speed;
        b.wobble += b.wobbleSpeed;
        
        // Horizontal floating variation
        const currentX = b.x + Math.sin(b.wobble) * 12;

        ctx.beginPath();
        ctx.arc(currentX, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(253, 246, 236, ${b.opacity})`;
        ctx.fill();

        // Recycle bubble to bottom when it exits frame cleanly
        if (b.y + b.radius < 0) {
          b.y = canvas.height + b.radius;
          b.x = Math.random() * canvas.width;
          b.radius = Math.random() * 10 + 3;
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ position: 'absolute', inset: 0, zIndex: 15, pointerEvents: 'none' }} 
    />
  );
}

function HeroBanner({ banners, loading }) {
  const safeList = Array.isArray(banners) ? banners : []
  const [idx, setIdx]       = useState(0)
  const [locked, setLocked] = useState(false)
  const slidesRef = useRef([])
  const textsRef  = useRef([])
  const dotsRef   = useRef([])
  const touchStartX = useRef(null)

  const go = useCallback((next) => {
    if (locked || safeList.length < 2) return
    setLocked(true)
    const prev = idx
    const to   = ((next % safeList.length) + safeList.length) % safeList.length
    gsap.to(textsRef.current[prev], { y: -20, opacity: 0, duration: 0.25, ease: 'power2.in' })
    gsap.set(slidesRef.current[to], { zIndex: 10, opacity: 0 })
    gsap.to(slidesRef.current[to], { opacity: 1, duration: 0.7, ease: 'sine.inOut' })
    gsap.to(slidesRef.current[prev], {
      opacity: 0, duration: 0.7, ease: 'sine.inOut',
      onComplete: () => { gsap.set(slidesRef.current[prev], { zIndex: 1 }); setLocked(false) }
    })
    setTimeout(() => {
      gsap.fromTo(textsRef.current[to], { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out', delay: 0.15 })
    }, 0)
    dotsRef.current.forEach((d, i) => {
      if (!d) return
      gsap.to(d, { width: i === to ? 28 : 8, backgroundColor: i === to ? '#FDF6EC' : 'rgba(253,246,236,0.35)', duration: 0.3 })
    })
    setIdx(to)
  }, [idx, locked, safeList.length])

  useEffect(() => {
    if (safeList.length < 2) return
    const timer = setInterval(() => go(idx + 1), 5000)
    return () => clearInterval(timer)
  }, [idx, safeList.length, go])

  const heroStyle = { position: 'relative', width: '100%', height: 'min(90vh,760px)', minHeight: 400, overflow: 'hidden' }

  if (loading) return <div className="skeleton w-full" style={heroStyle} />

  if (!safeList.length) return (
    <div style={{ ...heroStyle, display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg,#1B4332 0%,#2D6A4F 55%,#40916C 100%)' }}>
      <FloatingBubbles />
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: -160, right: -160, width: 600, height: 600, borderRadius: '50%', background: '#52B788', opacity: 0.07, filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 320, height: 320, borderRadius: '50%', background: '#C8893A', opacity: 0.06, filter: 'blur(60px)' }} />
      </div>
      <div className="container-main" style={{ position: 'relative', zIndex: 20, width: '100%' }}>
        <div style={{ maxWidth: 560 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 20, background: 'rgba(255,255,255,0.08)', borderRadius: 99, padding: '6px 16px', border: '1px solid rgba(255,255,255,0.12)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E9B87A', display: 'inline-block' }} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#E9B87A', letterSpacing: '0.2em', textTransform: 'uppercase' }}>100% Certified Organic</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', color: '#fff', fontSize: 'clamp(2rem,7vw,4.5rem)', lineHeight: 1.08, marginBottom: 20 }}>
            Pure Nature.<br />
            <em style={{ fontStyle: 'normal', color: '#E9B87A' }}>Pure Life.</em>
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.6)', fontSize: 'clamp(0.95rem,2vw,1.1rem)', lineHeight: 1.7, maxWidth: 440, marginBottom: 32 }}>
            Farm-to-doorstep organic products. Cold-pressed, chemical-free, crafted with care for your family.
          </p>
          <div className="hero-buttons" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/shop" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#C8893A', color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, padding: '13px 28px', borderRadius: 14, textDecoration: 'none', boxShadow: '0 8px 28px rgba(0,0,0,0.25)' }}>
              Shop Now <ChevronRight size={14} />
            </Link>
            <Link to="/track-order" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 14, padding: '13px 24px', borderRadius: 14, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
              Track Order
            </Link>
          </div>
        </div>
      </div>
    </div>
  )

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) {
      go(diff > 0 ? idx + 1 : idx - 1)
    }
    touchStartX.current = null
  }

  return (
    <div
      style={heroStyle}
      className="group select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <FloatingBubbles />
      {safeList.map((b, i) => (
        <div key={b._id} ref={el => slidesRef.current[i] = el}
          style={{ position: 'absolute', inset: 0, zIndex: i === 0 ? 10 : 1, opacity: i === 0 ? 1 : 0 }}>
          <img src={b.image} alt={b.title || 'Banner'} draggable={false}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'linear-gradient(90deg,rgba(0,0,0,0.72) 0%,rgba(0,0,0,0.32) 55%,transparent 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, zIndex: 11, background: 'linear-gradient(to top,rgba(0,0,0,0.35) 0%,transparent 60%)' }} />
          <div ref={el => textsRef.current[i] = el}
            style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', alignItems: 'center' }}>
            <div className="container-main" style={{ width: '100%' }}>
              <div style={{ maxWidth: 560 }}>
                {b.subtitle && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                    <span style={{ width: 24, height: 1, background: '#E9B87A', display: 'block', opacity: 0.8 }} />
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#E9B87A', letterSpacing: '0.22em', textTransform: 'uppercase' }}>{b.subtitle}</span>
                  </div>
                )}
                <h1 style={{ fontFamily: 'var(--font-heading)', color: '#fff', fontSize: 'clamp(1.8rem,5.5vw,3.8rem)', lineHeight: 1.1, marginBottom: 24, textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
                  {b.title}
                </h1>
                {b.buttonText && b.buttonLink && (
                  <div className="hero-buttons" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <Link to={b.buttonLink} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#C8893A', color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, padding: '12px 24px', borderRadius: 13, textDecoration: 'none', boxShadow: '0 6px 20px rgba(0,0,0,0.25)' }}>
                      {b.buttonText} <ChevronRight size={13} />
                    </Link>
                    <Link to="/shop" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.12)', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 14, padding: '12px 22px', borderRadius: 13, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)' }}>
                      Browse All
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {safeList.length > 1 && (
        <>
          {[
            { label: 'prev', pos: { left: 16 },  icon: <ChevronLeft size={17} />,  fn: () => go(idx - 1) },
            { label: 'next', pos: { right: 16 }, icon: <ChevronRight size={17} />, fn: () => go(idx + 1) },
          ].map(({ label, pos, icon, fn }) => (
            <button key={label} onClick={fn} aria-label={`${label} slide`}
              className="hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', zIndex: 30, ...pos, width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', color: '#fff', cursor: 'pointer', alignItems: 'center', justifyContent: 'center' }}>
              {icon}
            </button>
          ))}
        </>
      )}
      {safeList.length > 1 && (
        <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 30, display: 'flex', gap: 8, alignItems: 'center' }}>
          {safeList.map((_, i) => (
            <button key={i} ref={el => dotsRef.current[i] = el}
              onClick={() => go(i)} aria-label={`Slide ${i + 1}`}
              style={{ height: 7, width: i === 0 ? 28 : 8, borderRadius: 99, border: 'none', cursor: 'pointer', padding: 0, background: i === 0 ? '#FDF6EC' : 'rgba(253,246,236,0.35)' }} />
          ))}
        </div>
      )}
      {safeList.length > 1 && (
        <div style={{ position: 'absolute', bottom: 28, right: 20, zIndex: 30, fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
          {String(idx + 1).padStart(2, '0')} / {String(safeList.length).padStart(2, '0')}
        </div>
      )}
    </div>
  )
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   2. TRUST BAR â€” SVG icons
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const TRUST = [
  {
    Icon: IconLeaf,
    title: '100% Natural',
    sub: 'Zero synthetic additives',
    stat: 'Pure',
    glow: 'rgba(82,183,136,0.18)',
  },
  {
    Icon: IconDroplet,
    title: 'Cold Pressed',
    sub: 'Nutrients fully preserved',
    stat: 'Raw',
    glow: 'rgba(82,183,136,0.14)',
  },
  {
    Icon: IconTruck,
    title: 'Free Shipping',
    sub: 'On orders above â‚¹499',
    stat: 'â‚¹499+',
    glow: 'rgba(200,137,58,0.15)',
  },
  {
    Icon: IconShield,
    title: 'Certified Organic',
    sub: 'Third-party verified',
    stat: 'Verified',
    glow: 'rgba(82,183,136,0.18)',
  },
]

function TrustBar() {
  const ref = useRef(null)

  useGSAP(() => {
    gsap.fromTo(
      ref.current?.querySelectorAll('.trust-item'),
      { y: 18, opacity: 0 },
      {
        y: 0, opacity: 1, stagger: 0.09, duration: 0.55, ease: 'power3.out',
        scrollTrigger: { trigger: ref.current, start: 'top 93%' },
      }
    )
  }, { scope: ref })

  return (
    <div
      ref={ref}
      style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(160deg, #0D2B1E 0%, #1B4332 50%, #163829 100%)',
        borderBottom: '1px solid rgba(82,183,136,0.12)',
      }}
    >
      {/* subtle radial glow top-right */}
      <div style={{
        position: 'absolute', top: '-60%', right: '-5%',
        width: '40%', height: '250%',
        background: 'radial-gradient(ellipse, rgba(200,137,58,0.10) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* particle-like dots â€” static SVG, no JS needed here */}
      <svg aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.06 }}
        viewBox="0 0 1200 100" preserveAspectRatio="xMidYMid slice">
        {[40,120,220,340,460,560,660,760,860,960,1060,1140].map((x, i) => (
          <circle key={i} cx={x} cy={i % 2 === 0 ? 28 : 68} r={i % 3 === 0 ? 3 : 2} fill="#52B788" />
        ))}
      </svg>

      <div className="container-main" style={{ position: 'relative', zIndex: 2 }}>
        <div className="trust-grid">
          {TRUST.map(({ Icon, title, sub, stat, glow }, i) => (
            <div
              key={i}
              className="trust-item"
              style={{
                position: 'relative', overflow: 'hidden',
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '22px 20px',
                borderRight: i < 3 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                transition: 'background 0.3s',
                cursor: 'default',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              {/* per-item corner glow */}
              <div style={{
                position: 'absolute', top: -20, right: -20,
                width: 70, height: 70, borderRadius: '50%',
                background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`,
                pointerEvents: 'none',
              }} />

              {/* icon box */}
              <div style={{
                flexShrink: 0,
                width: 44, height: 44, borderRadius: 13,
                background: 'linear-gradient(135deg, rgba(82,183,136,0.18) 0%, rgba(45,106,79,0.22) 100%)',
                border: '1px solid rgba(82,183,136,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 3px 12px rgba(0,0,0,0.2)',
              }}>
                <Icon />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <p style={{
                    fontFamily: 'var(--font-body)', fontWeight: 600,
                    color: '#FDF6EC', fontSize: 13, lineHeight: 1.3, margin: 0,
                  }}>
                    {title}
                  </p>
                  {/* stat pill */}
                  <span style={{
                    fontFamily: 'var(--font-body)', fontSize: 9, fontWeight: 700,
                    color: '#E9B87A', letterSpacing: '0.08em',
                    background: 'rgba(200,137,58,0.18)',
                    border: '1px solid rgba(200,137,58,0.25)',
                    borderRadius: 99, padding: '2px 7px',
                    whiteSpace: 'nowrap',
                  }}>
                    {stat}
                  </span>
                </div>
                <p style={{
                  fontFamily: 'var(--font-body)', color: 'rgba(253,246,236,0.45)',
                  fontSize: 11, margin: 0, lineHeight: 1.4,
                }}>
                  {sub}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   SECTION HEADER
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function SectionHeader({ eyebrow, title, sub, to, toLabel = 'View all' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
      <div>
        {eyebrow && (
          <p style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)', fontSize: 11, color: '#C8893A', letterSpacing: '0.22em', textTransform: 'uppercase', margin: '0 0 8px' }}>
            <span style={{ width: 14, height: 1, background: '#C8893A', display: 'block', flexShrink: 0 }} />
            {eyebrow}
          </p>
        )}
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.4rem,3vw,2rem)', color: '#26221C', lineHeight: 1.2, margin: 0 }}>
          {title}
        </h2>
        {sub && <p style={{ fontFamily: 'var(--font-body)', color: '#A89F8C', fontSize: 13, margin: '4px 0 0' }}>{sub}</p>}
      </div>
      {to && (
        <Link to={to} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: '#2D6A4F', textDecoration: 'none', whiteSpace: 'nowrap', marginTop: 4 }}>
          {toLabel} <ChevronRight size={13} />
        </Link>
      )}
    </div>
  )
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   PRODUCT SLIDER
   FIX: wrapper uses overflow:hidden to
   prevent arrows from causing x-scroll
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function ProductSlider({ products = [], loading, skeletonCount = 5 }) {
  const trackRef = useRef(null)
  const wrapRef  = useRef(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)
  const isDragging  = useRef(false)
  const startX      = useRef(0)
  const scrollStart = useRef(0)

  const syncArrows = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 4)
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    el.addEventListener('scroll', syncArrows, { passive: true })
    const ro = new ResizeObserver(syncArrows)
    ro.observe(el)
    syncArrows()
    return () => { el.removeEventListener('scroll', syncArrows); ro.disconnect() }
  }, [loading, products.length, syncArrows])

  const scrollBy = (dir) => {
    const el = trackRef.current
    if (!el) return
    const card = el.querySelector('.slider-card')
    const step = card ? (card.offsetWidth + 16) * 2 : el.clientWidth * 0.8
    gsap.to(el, {
      scrollLeft: el.scrollLeft + (dir === 'next' ? step : -step),
      duration: 0.5, ease: 'power3.inOut',
    })
  }

  const onMouseDown = (e) => {
    isDragging.current  = true
    startX.current      = e.pageX - trackRef.current.offsetLeft
    scrollStart.current = trackRef.current.scrollLeft
    trackRef.current.style.cursor = 'grabbing'
  }
  const onMouseMove = (e) => {
    if (!isDragging.current) return
    e.preventDefault()
    trackRef.current.scrollLeft =
      scrollStart.current - (e.pageX - trackRef.current.offsetLeft - startX.current) * 1.5
  }
  const endDrag = () => {
    isDragging.current = false
    if (trackRef.current) trackRef.current.style.cursor = 'grab'
  }

  if (loading) return (
    <div style={{ display: 'flex', gap: 12, overflow: 'hidden' }}>
      {Array.from({ length: skeletonCount }).map((_, i) => (
        <div key={i} className="slider-card"
          style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #F5F0E8', flexShrink: 0 }}>
          <div className="skeleton" style={{ aspectRatio: '1/1' }} />
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="skeleton" style={{ height: 12, borderRadius: 8, width: '80%' }} />
            <div className="skeleton" style={{ height: 12, borderRadius: 8, width: '55%' }} />
            <div className="skeleton" style={{ height: 32, borderRadius: 10, marginTop: 4 }} />
          </div>
        </div>
      ))}
    </div>
  )

  if (!products.length) return null

  return (
    /* No extra padding on this wrapper â€” cards use full container width.
       overflow:hidden still clips GSAP scroll animation cleanly. */
    <div ref={wrapRef} style={{ position: 'relative' }}>

      {/* Prev arrow â€” shown only on wider screens where it fits */}
      {canPrev && (
        <button
          onClick={() => scrollBy('prev')}
          aria-label="Previous products"
          style={{
            position: 'absolute', top: '38%', transform: 'translateY(-50%)',
            left: -18, zIndex: 10,
            width: 36, height: 36, borderRadius: '50%',
            background: '#fff', border: '1px solid #E8E0D0',
            boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#5C5548',
          }}
        >
          <ChevronLeft size={16} />
        </button>
      )}

      {/* Next arrow */}
      {canNext && (
        <button
          onClick={() => scrollBy('next')}
          aria-label="Next products"
          style={{
            position: 'absolute', top: '38%', transform: 'translateY(-50%)',
            right: -18, zIndex: 10,
            width: 36, height: 36, borderRadius: '50%',
            background: '#fff', border: '1px solid #E8E0D0',
            boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#5C5548',
          }}
        >
          <ChevronRight size={16} />
        </button>
      )}

      {/* Track â€” full width, arrows don't steal space */}
      <div
        ref={trackRef}
        className="slider-track"
        style={{ display: 'flex', gap: 16, padding: '4px 0 16px', cursor: 'grab' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
      >
        {products.map(p => (
          <div key={p._id} className="slider-card">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </div>
  )
}
/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   3. FEATURED PRODUCTS
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function FeaturedProducts({ products, loading }) {
  const ref = useRef(null)
  useGSAP(() => {
    gsap.fromTo(ref.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out',
        scrollTrigger: { trigger: ref.current, start: 'top 88%' } })
  }, { scope: ref })

  const list = Array.isArray(products) ? products : []
  if (!loading && !list.length) return null

  return (
    <section ref={ref} className="home-section" style={{ background: '#FAFAF7' }}>
      <div className="container-main">
        <SectionHeader eyebrow="Handpicked for you" title="Featured Products" sub="Our finest selection â€” curated for quality and purity" to="/shop" toLabel="All products" />
        <ProductSlider products={list} loading={loading} />
      </div>
    </section>
  )
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   4. CATEGORY GRID
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function CategoryCard({ cat, tall = false }) {
  const imgRef     = useRef(null)
  const overlayRef = useRef(null)
  const hintRef    = useRef(null)

  return (
    <Link to={`/shop?page=1&category=${cat.slug}`}
      onMouseEnter={() => {
        gsap.to(imgRef.current,     { scale: 1.07, duration: 0.5, ease: 'power2.out' })
        gsap.to(overlayRef.current, { opacity: 0.72, duration: 0.3 })
        gsap.to(hintRef.current,    { y: 0, opacity: 1, duration: 0.25 })
      }}
      onMouseLeave={() => {
        gsap.to(imgRef.current,     { scale: 1, duration: 0.45, ease: 'power2.out' })
        gsap.to(overlayRef.current, { opacity: 0.42, duration: 0.3 })
        gsap.to(hintRef.current,    { y: 8, opacity: 0, duration: 0.2 })
      }}
      className={tall ? 'cat-card-tall' : 'cat-card-normal'}
      style={{ position: 'relative', overflow: 'hidden', borderRadius: 18, display: 'block', textDecoration: 'none' }}>
      <img ref={imgRef} src={cat.image || '/placeholder-category.jpg'} alt={cat.name} loading="lazy"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', willChange: 'transform' }} />
      <div ref={overlayRef}
        style={{ position: 'absolute', inset: 0, opacity: 0.42, background: 'linear-gradient(to top,rgba(0,0,0,0.92) 0%,rgba(0,0,0,0.18) 65%,transparent 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '18px 20px' }}>
        <p style={{ fontFamily: 'var(--font-heading)', color: '#fff', fontSize: tall ? 19 : 15, lineHeight: 1.3, margin: 0 }}>{cat.name}</p>
        <p ref={hintRef}
          style={{ fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.65)', fontSize: 12, margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 3, transform: 'translateY(8px)', opacity: 0 }}>
          Shop now <ChevronRight size={11} />
        </p>
      </div>
    </Link>
  )
}

function CategoryGrid({ categories, loading }) {
  const cats = Array.isArray(categories) ? categories : []
  const ref  = useRef(null)

  useGSAP(() => {
    if (!cats.length) return
    gsap.fromTo(ref.current?.querySelectorAll('.cg-item'),
      { y: 18, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.07, duration: 0.5, ease: 'power3.out',
        scrollTrigger: { trigger: ref.current, start: 'top 88%' } })
  }, { dependencies: [loading], scope: ref })

  if (!loading && !cats.length) return null

  return (
    <section className="home-section" style={{ background: '#fff' }} ref={ref}>
      <div className="container-main">
        <SectionHeader eyebrow="Browse by type" title="Shop by Category" sub="Everything pure, everything organic" to="/shop" toLabel="All products" />
        {loading ? (
          <div className="cat-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ borderRadius: 18, height: 220 }} />
            ))}
          </div>
        ) : (
          <div className="cat-grid">
            <div className="cg-item cat-tall">
              <CategoryCard cat={cats[0]} tall />
            </div>
            {cats.slice(1).map(cat => (
              <div key={cat._id} className="cg-item">
                <CategoryCard cat={cat} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   5. BEST SELLERS
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function BestSellers({ products, loading }) {
  const ref = useRef(null)
  useGSAP(() => {
    gsap.fromTo(ref.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out',
        scrollTrigger: { trigger: ref.current, start: 'top 88%' } })
  }, { scope: ref })

  const list = Array.isArray(products) ? products : []
  if (!loading && !list.length) return null

  return (
    <section ref={ref} className="home-section" style={{ background: 'rgba(200,137,58,0.04)' }}>
      <div className="container-main">
        <SectionHeader eyebrow="Customer favourites" title="Best Sellers" sub="Tried, trusted and loved by thousands" to="/shop?sort=best-seller" toLabel="See all" />
        <ProductSlider products={list} loading={loading} />
      </div>
    </section>
  )
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   6. WHY VARNAM â€” SVG icons, no emojis
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const WHY = [
  {
    Icon: IconSprout,
    title: 'Farm Direct',
    body: 'We work directly with certified organic farmers across Tamil Nadu. No middlemen â€” fresh from field to your door.',
    stat: '12+ farms',
  },
  {
    Icon: IconFlask,
    title: 'Zero Chemicals',
    body: 'Every product is tested. No parabens, no sulphates, no artificial fragrances â€” ever.',
    stat: '0 additives',
  },
  {
    Icon: IconSnowflake,
    title: 'Cold Pressed',
    body: 'Our oils are cold-pressed within hours of harvest to lock in every nutrient and natural aroma.',
    stat: '<4 hrs',
  },
  {
    Icon: IconPackage,
    title: 'Eco Packaging',
    body: 'Recyclable bottles, minimal plastic, FSC-certified labels. Good for you and the planet.',
    stat: '100% recyclable',
  },
]

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   ANIMATED PARTICLE CANVAS
   Pure canvas, no extra packages.
   Particles are tiny leaf/dot shapes that
   drift upward with gentle horizontal sway.
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function WhyParticles() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf

    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    // Particle pool â€” mix of dots and tiny leaf shapes
    const COUNT = 55
    const particles = Array.from({ length: COUNT }, () => ({
      x:       Math.random() * canvas.width,
      y:       Math.random() * canvas.height,         // start anywhere
      r:       Math.random() * 2.2 + 0.6,             // radius
      speed:   Math.random() * 0.38 + 0.10,
      drift:   Math.random() * 0.6 - 0.3,             // horizontal drift
      phase:   Math.random() * Math.PI * 2,           // wobble phase offset
      wobble:  Math.random() * 0.018 + 0.006,
      alpha:   Math.random() * 0.18 + 0.04,
      isLeaf:  Math.random() > 0.62,                  // ~38% are leaf shapes
      rotation:Math.random() * Math.PI * 2,
      rotSpeed:Math.random() * 0.008 - 0.004,
    }))

    const drawLeaf = (p) => {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      ctx.beginPath()
      // simple oval-leaf path
      ctx.ellipse(0, 0, p.r * 2.2, p.r * 1.0, 0, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(82,183,136,${p.alpha})`
      ctx.fill()
      ctx.restore()
    }

    const drawDot = (p) => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(253,246,236,${p.alpha})`
      ctx.fill()
    }

    let t = 0
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      t += 0.016

      for (const p of particles) {
        p.y        -= p.speed
        p.x        += Math.sin(t * p.wobble * 60 + p.phase) * 0.35 + p.drift * 0.04
        p.rotation += p.rotSpeed

        if (p.y + p.r * 3 < 0) {
          p.y = canvas.height + p.r * 3
          p.x = Math.random() * canvas.width
        }

        p.isLeaf ? drawLeaf(p) : drawDot(p)
      }

      raf = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 1,
      }}
    />
  )
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   6. WHY VARNAM
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function WhyVarnam() {
  const sectionRef = useRef(null)
  const headRef    = useRef(null)
  const cardsRef   = useRef(null)

  useGSAP(() => {
    // heading
    gsap.fromTo(headRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: headRef.current, start: 'top 88%' } })

    // cards stagger
    gsap.fromTo(cardsRef.current?.querySelectorAll('.why-card'),
      { y: 36, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.12, duration: 0.6, ease: 'power3.out',
        scrollTrigger: { trigger: cardsRef.current, start: 'top 85%' } })
  }, { scope: sectionRef })

  return (
    <section
      ref={sectionRef}
      className="why-section"
      style={{ position: 'relative', overflow: 'hidden', background: 'none' }}
    >
      {/* â”€â”€ Multi-layer background â”€â”€ */}
      {/* Layer 1: deep forest gradient */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        background: 'linear-gradient(160deg, #0D2B1E 0%, #1B4332 40%, #2D6A4F 75%, #1A3D2B 100%)',
      }} />

      {/* Layer 2: large radial glow â€” amber top-right */}
      <div style={{
        position: 'absolute', zIndex: 0,
        top: '-20%', right: '-10%',
        width: '55%', height: '120%',
        background: 'radial-gradient(ellipse at center, rgba(200,137,58,0.13) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* Layer 3: large radial glow â€” teal bottom-left */}
      <div style={{
        position: 'absolute', zIndex: 0,
        bottom: '-30%', left: '-15%',
        width: '60%', height: '120%',
        background: 'radial-gradient(ellipse at center, rgba(82,183,136,0.12) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* Layer 4: subtle SVG leaf texture overlay */}
      <svg
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0, opacity: 0.035, pointerEvents: 'none' }}
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 800 600"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* repeating leaf motifs as background texture */}
        {[
          [60,  80],  [200, 30],  [380, 110], [560, 50],  [720, 90],
          [100, 220], [300, 180], [500, 250], [680, 210], [780, 160],
          [40,  370], [180, 330], [350, 400], [530, 360], [700, 420],
          [90,  520], [260, 490], [430, 540], [610, 510], [760, 560],
        ].map(([cx, cy], i) => (
          <g key={i} transform={`translate(${cx},${cy}) rotate(${i * 37 % 180 - 90})`}>
            <ellipse rx="18" ry="8" fill="#52B788" />
            <line x1="0" y1="-8" x2="0" y2="8" stroke="#52B788" strokeWidth="0.8" />
          </g>
        ))}
      </svg>

      {/* Layer 5: particle canvas */}
      <WhyParticles />

      {/* Layer 6: bottom fade-to-next-section */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, zIndex: 2,
        background: 'linear-gradient(to top, rgba(253,246,236,0.06) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      {/* â”€â”€ Content â”€â”€ */}
      <div className="container-main" style={{ position: 'relative', zIndex: 10 }}>

        {/* Header */}
        <div ref={headRef} style={{ textAlign: 'center', marginBottom: 52 }}>
          {/* decorative line + eyebrow */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ display: 'block', width: 32, height: 1, background: 'rgba(233,184,122,0.5)' }} />
            <span style={{
              fontFamily: 'var(--font-body)', fontSize: 10, color: '#E9B87A',
              letterSpacing: '0.28em', textTransform: 'uppercase',
            }}>
              Our Promise
            </span>
            <span style={{ display: 'block', width: 32, height: 1, background: 'rgba(233,184,122,0.5)' }} />
          </div>

          <h2 style={{
            fontFamily: 'var(--font-heading)',
            color: '#FDF6EC',
            fontSize: 'clamp(1.7rem,4.5vw,2.8rem)',
            lineHeight: 1.15,
            maxWidth: 580,
            margin: '0 auto 16px',
          }}>
            Why Thousands Trust{' '}
            <span style={{
              color: '#E9B87A',
              position: 'relative',
              display: 'inline-block',
            }}>
              Varnam Naturals
              {/* underline accent */}
              <svg viewBox="0 0 200 8" style={{ position: 'absolute', bottom: -4, left: 0, width: '100%', height: 8 }}>
                <path d="M0 6 Q50 0 100 5 Q150 10 200 4" stroke="#C8893A" strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>
            </span>
          </h2>

          <p style={{
            fontFamily: 'var(--font-body)',
            color: 'rgba(253,246,236,0.5)',
            fontSize: 14, lineHeight: 1.7,
            maxWidth: 440, margin: '0 auto',
          }}>
            Every bottle, every bar, every supplement â€” made with integrity you can taste, see, and feel.
          </p>
        </div>

        {/* Cards */}
        <div ref={cardsRef} className="why-grid">
          {WHY.map(({ Icon, title, body, stat }) => (
            <div
              key={title}
              className="why-card"
              style={{
                position: 'relative', overflow: 'hidden',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 22,
                padding: '32px 26px 28px',
                transition: 'background 0.3s, border-color 0.3s, transform 0.3s',
                cursor: 'default',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background    = 'rgba(255,255,255,0.08)'
                e.currentTarget.style.borderColor   = 'rgba(255,255,255,0.18)'
                e.currentTarget.style.transform     = 'translateY(-4px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background    = 'rgba(255,255,255,0.04)'
                e.currentTarget.style.borderColor   = 'rgba(255,255,255,0.09)'
                e.currentTarget.style.transform     = 'translateY(0)'
              }}
            >
              {/* corner glow */}
              <div style={{
                position: 'absolute', top: -30, right: -30,
                width: 90, height: 90, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(82,183,136,0.18) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />

              {/* icon badge */}
              <div style={{
                marginBottom: 20,
                width: 52, height: 52, borderRadius: 16,
                background: 'linear-gradient(135deg, rgba(82,183,136,0.2) 0%, rgba(45,106,79,0.25) 100%)',
                border: '1px solid rgba(82,183,136,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
              }}>
                <Icon />
              </div>

              {/* stat pill */}
              <div style={{
                display: 'inline-flex', alignItems: 'center',
                background: 'rgba(200,137,58,0.15)',
                border: '1px solid rgba(200,137,58,0.25)',
                borderRadius: 99, padding: '3px 10px',
                marginBottom: 12,
              }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, color: '#E9B87A', letterSpacing: '0.08em' }}>
                  {stat}
                </span>
              </div>

              <p style={{ fontFamily: 'var(--font-heading)', color: '#FDF6EC', fontSize: 17, margin: '0 0 10px', lineHeight: 1.3 }}>
                {title}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(253,246,236,0.5)', fontSize: 13, lineHeight: 1.75, margin: 0 }}>
                {body}
              </p>

              {/* bottom separator line accent */}
              <div style={{
                position: 'absolute', bottom: 0, left: 24, right: 24, height: 2,
                background: 'linear-gradient(90deg, transparent, rgba(82,183,136,0.3), transparent)',
                borderRadius: 99,
              }} />
            </div>
          ))}
        </div>

        {/* CTA row */}
        <div style={{ marginTop: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 14 }}>
          <Link to="/shop" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg, #C8893A, #E9B87A)',
            color: '#1B2F24',
            fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14,
            padding: '14px 32px', borderRadius: 14, textDecoration: 'none',
            boxShadow: '0 8px 28px rgba(200,137,58,0.35)',
            letterSpacing: '0.02em',
          }}>
            Shop All Products <ChevronRight size={14} />
          </Link>
          <Link to="/track-order" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.07)',
            color: '#FDF6EC',
            fontFamily: 'var(--font-body)', fontSize: 14,
            padding: '14px 28px', borderRadius: 14, textDecoration: 'none',
            border: '1px solid rgba(255,255,255,0.14)',
            backdropFilter: 'blur(8px)',
          }}>
            Track My Order
          </Link>
        </div>
      </div>
    </section>
  )
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   7. STATS STRIP
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function StatsStrip() {
  const ref = useRef(null)
  useGSAP(() => {
    gsap.fromTo(ref.current?.querySelectorAll('.stat-item'),
      { scale: 0.9, opacity: 0 },
      { scale: 1, opacity: 1, stagger: 0.09, duration: 0.5, ease: 'back.out(1.4)',
        scrollTrigger: { trigger: ref.current, start: 'top 90%' } })
  }, { scope: ref })

  return (
    <div ref={ref} style={{ background: '#FDF6EC', borderTop: '1px solid rgba(45,106,79,0.08)' }}>
      <div className="container-main">
        <div className="stats-grid">
          {[
            { n: '500+', l: 'Happy Customers' },
            { n: '100%', l: 'Organic Certified' },
            { n: '0',    l: 'Harmful Chemicals' },
            { n: '2',  l: 'Days Delivery' },
          ].map(({ n, l }, i) => (
            <div key={i} className="stat-item"
              style={{ padding: '30px 16px', borderRight: i < 3 ? '1px solid rgba(45,106,79,0.08)' : 'none' }}>
              <p style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.6rem,4vw,2.6rem)', color: '#2D6A4F', lineHeight: 1, margin: 0 }}>{n}</p>
              <p style={{ fontFamily: 'var(--font-body)', color: '#A89F8C', fontSize: 12, margin: '6px 0 0', letterSpacing: '0.04em' }}>{l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   PAGE â€” reads from homeStore, fetches once
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function Home() {
  const { banners, featured, bestSellers, categories, fetched, loading, fetch } = useHomeStore()

  useEffect(() => {
    // fetch() is a no-op if already fetched â€” safe to call on every mount
    fetch()
  }, [fetch])

  return (
    <>
      <HeroBanner    banners={banners}         loading={loading && !fetched} />
      <TrustBar />
      <FeaturedProducts products={featured}    loading={loading && !fetched} />
      <CategoryGrid     categories={categories} loading={loading && !fetched} />
      <BestSellers      products={bestSellers}  loading={loading && !fetched} />
      <WhyVarnam />
      <StatsStrip />
    </>
  )
}
