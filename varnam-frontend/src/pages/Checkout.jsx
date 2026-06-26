import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import toast from 'react-hot-toast'

import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import { orderAPI, paymentAPI } from '../services/api'

/* ── Icons ───────────────────────────────────────────────────────────────── */
const IconUser = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)
const IconMapPin = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
)
const IconTruck = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 4v4h-7V8z"/>
    <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
)
const IconShield = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
  </svg>
)
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
)
const IconLoader = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
)
const IconCash = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/>
    <path d="M6 12h.01M18 12h.01"/>
  </svg>
)
const IconCard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
)
const IconChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)
const IconLock = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
function effectivePrice(p) { return p.discountPrice > 0 ? p.discountPrice : p.price }

/* ── Load Razorpay SDK dynamically ──────────────────────────────────────── */
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload  = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

/* ── Field component ─────────────────────────────────────────────────────── */
function Field({ label, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: error ? '#DC2626' : '#5C5548', letterSpacing: '0.04em' }}>
        {label}
      </label>
      {children}
      {error && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#DC2626', margin: 0 }}>{error}</p>
      )}
    </div>
  )
}

const inputStyle = (err) => ({
  width: '100%', padding: '11px 14px', borderRadius: 11,
  border: `1.5px solid ${err ? '#FCA5A5' : '#E8E0D0'}`,
  background: err ? '#FEF2F2' : '#FAFAF7',
  fontFamily: 'var(--font-body)', fontSize: 14, color: '#26221C',
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s, background 0.15s',
})

/* ── Section card ────────────────────────────────────────────────────────── */
function SectionCard({ icon, title, children, index }) {
  return (
    <div className="checkout-section" style={{ background: '#fff', borderRadius: 18, border: '1px solid #F0EBE1', overflow: 'hidden', boxShadow: '0 2px 16px rgba(45,106,79,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '18px 22px', borderBottom: '1px solid #F5F0E8' }}>
        <span style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(45,106,79,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2D6A4F', flexShrink: 0 }}>
          {icon}
        </span>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 16, color: '#26221C', margin: 0 }}>{title}</h3>
        <span style={{ marginLeft: 'auto', width: 22, height: 22, borderRadius: '50%', background: '#2D6A4F', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
          {index}
        </span>
      </div>
      <div style={{ padding: '20px 22px' }}>
        {children}
      </div>
    </div>
  )
}

/* ── Payment method tile ─────────────────────────────────────────────────── */
function PaymentTile({ id, selected, onSelect, icon, title, subtitle, badge, disabled }) {
  const isSelected = selected === id
  return (
    <button
      onClick={() => !disabled && onSelect(id)}
      disabled={disabled}
      style={{
        width: '100%', display: 'flex', alignItems: 'flex-start', gap: 14,
        padding: '16px', borderRadius: 13, textAlign: 'left',
        border: `2px solid ${isSelected ? '#2D6A4F' : '#E8E0D0'}`,
        background: isSelected ? 'rgba(45,106,79,0.04)' : '#FAFAF7',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s',
      }}
    >
      {/* Radio circle */}
      <div style={{
        width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 2,
        border: `2px solid ${isSelected ? '#2D6A4F' : '#D0C8B5'}`,
        background: isSelected ? '#2D6A4F' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s',
      }}>
        {isSelected && <IconCheck />}
      </div>
      {/* Icon */}
      <span style={{ color: isSelected ? '#2D6A4F' : '#A89F8C', marginTop: 1, flexShrink: 0, transition: 'color 0.2s' }}>
        {icon}
      </span>
      {/* Text */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: '#26221C', margin: 0 }}>{title}</p>
          {badge && (
            <span style={{ padding: '2px 8px', borderRadius: 99, background: 'rgba(200,137,58,0.1)', color: '#C8893A', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700 }}>
              {badge}
            </span>
          )}
        </div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#A89F8C', margin: '3px 0 0', lineHeight: 1.5 }}>
          {subtitle}
        </p>
      </div>
    </button>
  )
}

/* ── Confirming payment overlay ─────────────────────────────────────────── */
function ConfirmingOverlay({ phase }) {
  // phase: 'waiting' | 'confirming' | 'success'
  const overlayRef = useRef(null)
  const spinnerRef = useRef(null)
  const textRef    = useRef(null)

  useGSAP(() => {
    if (!overlayRef.current) return
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' })
  }, { scope: overlayRef })

  useEffect(() => {
    if (spinnerRef.current) {
      gsap.to(spinnerRef.current, { rotation: 360, duration: 1, repeat: -1, ease: 'none' })
    }
  }, [])

  useEffect(() => {
    if (textRef.current) {
      gsap.fromTo(textRef.current, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out' })
    }
  }, [phase])

  const messages = {
    waiting:    { emoji: '💳', text: 'Waiting for payment…',      sub: 'Complete the payment in the Razorpay window.' },
    confirming: { emoji: '⏳', text: 'Confirming your payment…',  sub: "This usually takes a few seconds. Please don't close this tab." },
    success:    { emoji: '✅', text: 'Payment confirmed!',         sub: 'Saving your order…' },
  }
  const { emoji, text, sub } = messages[phase] || messages.waiting

  return (
    <div ref={overlayRef} style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(15,12,8,0.75)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: '#fff', borderRadius: 24, padding: '40px 40px 36px',
        textAlign: 'center', maxWidth: 380, width: '100%',
        boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
      }}>
        {/* Spinner + emoji */}
        <div style={{ position: 'relative', width: 72, height: 72, margin: '0 auto 24px' }}>
          <svg ref={spinnerRef} width="72" height="72" viewBox="0 0 72 72" style={{ position: 'absolute', inset: 0 }}>
            <circle cx="36" cy="36" r="32" fill="none" stroke="#E8E0D0" strokeWidth="4"/>
            <circle cx="36" cy="36" r="32" fill="none" stroke="#2D6A4F" strokeWidth="4"
              strokeDasharray="60 141" strokeLinecap="round"/>
          </svg>
          <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
            {emoji}
          </span>
        </div>

        <div ref={textRef}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, color: '#26221C', margin: '0 0 8px' }}>
            {text}
          </h3>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#7A7265', margin: 0, lineHeight: 1.65 }}>
            {sub}
          </p>
        </div>

        {/* Trust strip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24, padding: '12px 0 0', borderTop: '1px solid #F5F0E8' }}>
          <span style={{ color: '#2D6A4F' }}><IconLock /></span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C' }}>Secured by Razorpay</span>
        </div>
      </div>
    </div>
  )
}

/* ── Order success overlay ───────────────────────────────────────────────── */
function OrderSuccessOverlay({ onDone }) {
  const overlayRef  = useRef(null)
  const cardRef     = useRef(null)
  const circleRef   = useRef(null)
  const checkRef    = useRef(null)
  const confettiRef = useRef(null)
  const textRef     = useRef(null)
  const timerRef    = useRef(null)

  const particles = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    color: ['#2D6A4F','#52B788','#C8893A','#E9B87A','#95D5B2','#40916C'][i % 6],
    size:  [6, 8, 5, 7, 6, 9][i % 6],
    x:     (Math.sin(i * 1.7) * 160),
    y:     -(80 + Math.abs(Math.cos(i * 1.3)) * 140),
    rot:   i * 47,
  }))

  useGSAP(() => {
    const tl = gsap.timeline()

    tl.fromTo(overlayRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.35, ease: 'power2.out' }
    )
    tl.fromTo(cardRef.current,
      { scale: 0.72, opacity: 0, y: 40 },
      { scale: 1, opacity: 1, y: 0, duration: 0.55, ease: 'back.out(1.7)' },
      '-=0.15'
    )
    tl.fromTo(circleRef.current,
      { strokeDashoffset: 220 },
      { strokeDashoffset: 0, duration: 0.55, ease: 'power3.out' },
      '-=0.2'
    )
    tl.fromTo(checkRef.current,
      { strokeDashoffset: 60 },
      { strokeDashoffset: 0, duration: 0.4, ease: 'power3.out' },
      '-=0.15'
    )
    if (confettiRef.current) {
      const dots = confettiRef.current.querySelectorAll('.confetti-dot')
      tl.fromTo(dots,
        { x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 },
        {
          x: (i) => particles[i].x,
          y: (i) => particles[i].y,
          opacity: 0, scale: 1,
          rotate: (i) => particles[i].rot,
          duration: 0.9, stagger: 0.018, ease: 'power2.out',
        },
        '-=0.3'
      )
    }
    tl.fromTo(textRef.current?.querySelectorAll('.success-line'),
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, stagger: 0.08, duration: 0.35, ease: 'power3.out' },
      '-=0.8'
    )

    timerRef.current = setTimeout(onDone, 5000)
  }, { scope: overlayRef })

  useEffect(() => () => clearTimeout(timerRef.current), [])

  return (
    <div ref={overlayRef} style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(10,20,14,0.82)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div ref={cardRef} style={{
        background: '#fff', borderRadius: 28,
        padding: 'clamp(32px,6vw,52px) clamp(24px,6vw,52px)',
        maxWidth: 420, width: '100%',
        boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>

        {/* Top colour bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg,#2D6A4F,#52B788,#C8893A)' }} />

        {/* Confetti burst origin */}
        <div ref={confettiRef} style={{ position: 'absolute', top: '36%', left: '50%', pointerEvents: 'none', zIndex: 10 }}>
          {particles.map((p) => (
            <div key={p.id} className="confetti-dot" style={{
              position: 'absolute', width: p.size, height: p.size,
              borderRadius: p.id % 3 === 0 ? '50%' : 3,
              background: p.color,
              transform: 'translate(-50%,-50%)',
            }} />
          ))}
        </div>

        {/* Animated circle + check */}
        <div style={{ position: 'relative', width: 90, height: 90, margin: '0 auto 24px', zIndex: 5 }}>
          <svg width="90" height="90" viewBox="0 0 90 90" style={{ position: 'absolute', inset: 0 }}>
            <circle cx="45" cy="45" r="35" fill="none" stroke="#F0EBE1" strokeWidth="5" />
          </svg>
          <svg width="90" height="90" viewBox="0 0 90 90" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
            <circle ref={circleRef} cx="45" cy="45" r="35"
              fill="none" stroke="#2D6A4F" strokeWidth="5" strokeLinecap="round"
              strokeDasharray="220" strokeDashoffset="220" />
          </svg>
          <div style={{
            position: 'absolute', inset: 10, borderRadius: '50%',
            background: 'rgba(45,106,79,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <polyline ref={checkRef}
                points="7,19 15,27 29,11"
                stroke="#2D6A4F" strokeWidth="3.5"
                strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray="60" strokeDashoffset="60" />
            </svg>
          </div>
        </div>

        {/* Text */}
        <div ref={textRef}>
          <p className="success-line" style={{
            fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700,
            letterSpacing: '0.18em', color: '#52B788', textTransform: 'uppercase', margin: '0 0 8px',
          }}>Order Confirmed</p>
          <h2 className="success-line" style={{
            fontFamily: 'var(--font-heading)', fontSize: 'clamp(22px,5vw,28px)',
            color: '#26221C', margin: '0 0 10px', lineHeight: 1.2,
          }}>Thank you! 🎉</h2>
          <p className="success-line" style={{
            fontFamily: 'var(--font-body)', fontSize: 14, color: '#7A7265',
            margin: '0 0 26px', lineHeight: 1.65,
          }}>
            Your order is on its way.<br />We'll send updates to your email.
          </p>

          {/* 3s drain bar */}
          <div style={{ height: 3, borderRadius: 99, background: '#F0EBE1', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              background: 'linear-gradient(90deg,#2D6A4F,#52B788)',
              animation: 'drain 5s linear forwards',
            }} />
          </div>
        </div>
      </div>
      <style>{`@keyframes drain { from { width:100% } to { width:0% } }`}</style>
    </div>
  )
}

/* ── Order summary sidebar ───────────────────────────────────────────────── */
function OrderSummary({ items, subtotal, shippingFee, grandTotal, codEnabled, codLimit }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #F0EBE1', overflow: 'hidden', boxShadow: '0 4px 24px rgba(45,106,79,0.08)', position: 'sticky', top: 90 }}>
      {/* header */}
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', background: 'none', border: 'none', borderBottom: collapsed ? 'none' : '1px solid #F5F0E8', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 16, color: '#26221C', margin: 0 }}>Order Summary</h3>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#A89F8C' }}>({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
        </div>
        <span style={{ color: '#A89F8C', transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}><IconChevronDown /></span>
      </button>

      {!collapsed && (
        <>
          <div style={{ padding: '12px 22px 0', maxHeight: 240, overflowY: 'auto' }}>
            {items.map(({ product, quantity }) => {
              const price = effectivePrice(product)
              return (
                <div key={product._id} style={{ display: 'flex', gap: 12, alignItems: 'center', paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid #F5F0E8' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', background: '#FAFAF7', flexShrink: 0 }}>
                    <img src={product.images?.[0] ?? '/placeholder-product.jpg'} alt={product.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: '#26221C', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C', margin: '2px 0 0' }}>Qty: {quantity}</p>
                  </div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: '#26221C', margin: 0, flexShrink: 0 }}>{fmt(price * quantity)}</p>
                </div>
              )
            })}
          </div>

          <div style={{ padding: '12px 22px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#A89F8C' }}>Subtotal</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#26221C', fontWeight: 500 }}>{fmt(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#A89F8C', display: 'flex', alignItems: 'center', gap: 5 }}>
                <IconTruck /> Shipping
              </span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: shippingFee === 0 ? '#52B788' : '#26221C' }}>
                {shippingFee === 0 ? 'FREE' : fmt(shippingFee)}
              </span>
            </div>
            <div style={{ height: 1, background: '#F5F0E8', margin: '0 0 14px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: 15, color: '#26221C' }}>Total</span>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: 22, color: '#26221C', fontWeight: 700 }}>{fmt(grandTotal)}</span>
            </div>
            {codEnabled && grandTotal > codLimit && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#D97706', margin: '10px 0 0', lineHeight: 1.5, display: 'flex', gap: 5 }}>
                ⚠ COD not available for orders above {fmt(codLimit)}. Please use online payment.
              </p>
            )}
          </div>

          <div style={{ borderTop: '1px solid #F5F0E8', padding: '14px 22px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ color: '#2D6A4F' }}><IconShield /></span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C' }}>SSL-secured • Razorpay PCI-DSS compliant</span>
          </div>
        </>
      )}
    </div>
  )
}

/* ── Validation ──────────────────────────────────────────────────────────── */
function validate(form) {
  const e = {}
  if (!form.customerName.trim())  e.customerName  = 'Full name is required'
  if (!form.customerEmail.trim()) e.customerEmail = 'Email is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail)) e.customerEmail = 'Enter a valid email'
  if (!form.customerPhone.trim()) e.customerPhone = 'Phone number is required'
  if (!form.street.trim())    e.street    = 'Street address is required'
  if (!form.city.trim())      e.city      = 'City is required'
  if (!form.state.trim())     e.state     = 'State is required'
  if (!form.postalCode.trim()) e.postalCode = 'Postal code is required'
  return e
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function Checkout() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { items, clearCart, fetchSettings, freeShippingThreshold, flatShippingFee, codLimit, codEnabled, totals } = useCartStore()

  const [submitting, setSubmitting]     = useState(false)
  const [errors, setErrors]             = useState({})
  const [paymentMethod, setPaymentMethod] = useState('RAZORPAY')  // 'RAZORPAY' | 'COD'
  // overlayPhase: null | 'waiting' | 'confirming' | 'success'
  const [overlayPhase, setOverlayPhase] = useState(null)
  const [showSuccess, setShowSuccess]   = useState(false)

  const [form, setForm] = useState({
    customerName:  user?.name  || '',
    customerEmail: user?.email || '',
    customerPhone: user?.phone || '',
    street:    '',
    city:      '',
    state:     '',
    postalCode: '',
  })

  const formRef     = useRef(null)
  const headerRef   = useRef(null)
  // Prevents the empty-cart redirect from firing right after a successful
  // order when clearCart() is called just before navigate('/orders/:id').
  const orderPlaced = useRef(false)

  useEffect(() => { fetchSettings() }, [fetchSettings])

  // Redirect to cart if cart is empty (but not after a successful order)
  useEffect(() => {
    if (items.length === 0 && !orderPlaced.current) navigate('/cart', { replace: true })
  }, [items.length, navigate])

  // Auto-switch away from COD when total exceeds codLimit.
  // FIX 5: original dep array was [codLimit] only — never reacted to cart changes.
  // grandTotal is derived each render so we snapshot it here for the dep.
  const grandTotal = totals().grandTotal
  useEffect(() => {
    if (paymentMethod === 'COD' && grandTotal > codLimit) {
      setPaymentMethod('RAZORPAY')
    }
  }, [grandTotal, codLimit, paymentMethod])

  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => { const n = { ...e }; delete n[field]; return n })
  }

  const handleOrderSuccess = useCallback(() => {
    toast('Keep shopping 🌿', { icon: '🛍️', duration: 3000 })
    navigate('/shop', { replace: true })
  }, [navigate])

  const t = totals()

  // Entrance animation
  useGSAP(() => {
    if (!formRef.current) return
    gsap.fromTo(formRef.current.querySelectorAll('.checkout-section'),
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, stagger: 0.1, duration: 0.55, ease: 'power3.out', delay: 0.1 }
    )
  }, { scope: formRef })

  useGSAP(() => {
    if (headerRef.current)
      gsap.fromTo(headerRef.current, { y: -12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out' })
  }, { scope: headerRef })

  /* ── COD order flow ──────────────────────────────────────────────────── */
  const handleCOD = async () => {
    setSubmitting(true)
    try {
      const payload = {
        paymentMethod: 'COD',
        customerName:  form.customerName.trim(),
        customerEmail: form.customerEmail.trim(),
        customerPhone: form.customerPhone.trim(),
        shippingAddress: {
          street:     form.street.trim(),
          city:       form.city.trim(),
          state:      form.state.trim(),
          postalCode: form.postalCode.trim(),
          country:    'India',
        },
        orderItems: items.map(({ product, quantity }) => ({ product: product._id, quantity })),
        shippingFee: t.shippingFee,
      }

      const { data } = await orderAPI.create(payload)
      if (data.success) {
        orderPlaced.current = true
        clearCart()
        setShowSuccess(true)
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to place order. Please try again.'
      toast.error(msg)
      gsap.fromTo('.place-order-btn', { scale: 1 }, { scale: 0.97, duration: 0.1, yoyo: true, repeat: 1 })
    } finally {
      setSubmitting(false)
    }
  }

  /* ── Razorpay payment flow ───────────────────────────────────────────── */
  const handleRazorpay = useCallback(async () => {
    // FIX 1: Guard missing / placeholder env key before touching SDK.
    // Without this the Razorpay modal opens with an empty key and shows a
    // cryptic SDK error instead of a clear message.
    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID
    if (!razorpayKey || !razorpayKey.trim() || razorpayKey.startsWith('rzp_test_XXX')) {
      toast.error('Payment configuration error. Please contact support.')
      return
    }

    setSubmitting(true)

    // Step 1: Load Razorpay SDK
    const loaded = await loadRazorpayScript()
    if (!loaded) {
      toast.error('Failed to load Razorpay. Check your connection and try again.')
      setSubmitting(false)
      return
    }

    // Step 2: POST full order payload to /api/payment/create-order
    // Server validates stock, calculates trusted total, creates Razorpay order
    // AND saves a pending Order doc — all in one call.
    let rzpOrder
    try {
      const { data } = await paymentAPI.createRazorpayOrder({
        customerName:  form.customerName.trim(),
        customerEmail: form.customerEmail.trim(),
        customerPhone: form.customerPhone.trim(),
        shippingAddress: {
          street:     form.street.trim(),
          city:       form.city.trim(),
          state:      form.state.trim(),
          postalCode: form.postalCode.trim(),
          country:    'India',
        },
        orderItems: items.map(({ product, quantity }) => ({ product: product._id, quantity })),
        shippingFee: t.shippingFee,
      })
      rzpOrder = data.data  // { id, amount, currency, ... }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not initiate payment. Please try again.')
      setSubmitting(false)
      return
    }

    setOverlayPhase('waiting')

    // FIX 2: handlerFired prevents ondismiss from showing a false "cancelled" toast
    // when the modal closes AFTER a successful payment. Some Razorpay SDK versions
    // fire ondismiss even after handler() completes.
    let handlerFired = false

    // Step 3: Open Razorpay checkout
    const options = {
      key:         razorpayKey,
      amount:      rzpOrder.amount,
      currency:    rzpOrder.currency || 'INR',
      name:        'Varnam Naturals',
      description: `Order — ${items.length} item${items.length !== 1 ? 's' : ''}`,
      order_id:    rzpOrder.id,
      prefill: {
        name:    form.customerName.trim(),
        email:   form.customerEmail.trim(),
        contact: form.customerPhone.trim(),
      },
      theme: { color: '#2D6A4F' },
      modal: {
        backdropclose: false,
        ondismiss: () => {
          // FIX 3: Only fire "cancelled" if handler never ran.
          if (handlerFired) return
          setOverlayPhase(null)
          setSubmitting(false)
          toast('Payment cancelled. Your cart is safe.', { icon: '↩' })
        },
      },
      handler: async () => {
        handlerFired = true
        // Step 4: Payment succeeded in Razorpay SDK.
        // Webhook confirms on the server. Poll until paymentStatus = Paid.
        setOverlayPhase('confirming')
        try {
          let orderId = null
          let confirmed = false

          // Poll up to 10 × 1.5 s = 15 s total
          for (let i = 0; i < 10; i++) {
            await new Promise(r => setTimeout(r, 1500))
            try {
              const { data } = await orderAPI.create({
                paymentMethod:   'RAZORPAY',
                razorpayOrderId: rzpOrder.id,
              })

              if (data.success && data.data) {
                orderId   = data.data._id
                confirmed = true
                break
              }
              // 202 = webhook not yet processed — keep polling (no action needed)
            } catch (pollErr) {
              // FIX 4: The server returns HTTP 400 when payment.failed webhook has
              // been processed. Axios throws on 4xx, so data.message is NEVER
              // reachable — it's only on pollErr.response.data.message.
              // Previously this was checked as `data.message === 'Payment failed'`
              // which could never match, so failed payments kept polling all 15 s.
              const serverMsg = pollErr?.response?.data?.message || ''
              const serverStatus = pollErr?.response?.data?.orderStatus || ''
              if (
                pollErr?.response?.status === 400 &&
                (serverMsg === 'Payment failed' || serverStatus === 'Cancelled')
              ) {
                throw new Error('Payment was declined. Please try again or use a different payment method.')
              }
              // Any other error (network blip, 5xx) — keep polling
            }
          }

          if (!confirmed || !orderId) {
            throw new Error('Payment confirmation timed out. Please check your orders page or contact support.')
          }

          setOverlayPhase('success')
          await new Promise(r => setTimeout(r, 900))

          orderPlaced.current = true
          clearCart()
          setOverlayPhase(null)
          setShowSuccess(true)

        } catch (err) {
          setOverlayPhase(null)
          setSubmitting(false)
          toast.error(err?.message || 'Payment received but confirmation timed out. Check your orders page.')
        }
      },
    }

    const rzp = new window.Razorpay(options)
    rzp.on('payment.failed', (response) => {
      setOverlayPhase(null)
      setSubmitting(false)
      toast.error(`Payment failed: ${response.error?.description || 'Unknown error'}`)
    })
    rzp.open()

  }, [form, items, t, clearCart, navigate])

  /* ── Master submit handler ───────────────────────────────────────────── */
  const handlePlaceOrder = async () => {
    const e = validate(form)
    if (Object.keys(e).length) {
      setErrors(e)
      const firstErr = formRef.current?.querySelector('[data-err="true"]')
      if (firstErr) gsap.fromTo(firstErr, { x: -6 }, { x: 0, duration: 0.4, ease: 'elastic.out(1,0.4)' })
      toast.error('Please fix the errors above')
      return
    }

    if (paymentMethod === 'COD') {
      if (!codEnabled) { toast.error('Cash on Delivery is currently unavailable'); return }
      if (t.grandTotal > codLimit) { toast.error(`COD is not available for orders above ${fmt(codLimit)}`); return }
      await handleCOD()
    } else {
      await handleRazorpay()
    }
  }

  if (!items.length && !showSuccess) return null

  const codExceedsLimit = t.grandTotal > codLimit

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF7', paddingBottom: 64 }}>

      {/* Confirming payment overlay */}
      {overlayPhase && <ConfirmingOverlay phase={overlayPhase} />}
      {showSuccess  && <OrderSuccessOverlay onDone={handleOrderSuccess} />}

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div ref={headerRef} style={{ background: '#fff', borderBottom: '1px solid #F0EBE1', padding: '20px 0' }}>
        <div className="container-main">
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 12, color: '#A89F8C', marginBottom: 6 }}>
            <Link to="/"     style={{ color: '#A89F8C', textDecoration: 'none' }}>Home</Link><span>/</span>
            <Link to="/cart" style={{ color: '#A89F8C', textDecoration: 'none' }}>Cart</Link><span>/</span>
            <span style={{ color: '#26221C' }}>Checkout</span>
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.3rem,2.5vw,1.8rem)', color: '#26221C', margin: 0 }}>
              Checkout
            </h1>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, background: 'rgba(45,106,79,0.08)', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, color: '#2D6A4F' }}>
              <IconLock /> Secure checkout
            </span>
          </div>
        </div>
      </div>

      <div className="container-main" style={{ paddingTop: 32 }}>
        <div className="checkout-layout" ref={formRef}>

          {/* ── Left: form ──────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Contact info */}
            <SectionCard icon={<IconUser />} title="Contact Information" index={1}>
              <div className="form-grid-2">
                <Field label="Full Name *" error={errors.customerName}>
                  <input data-err={!!errors.customerName} value={form.customerName}
                    onChange={e => set('customerName', e.target.value)}
                    placeholder="Priya Rajan"
                    style={inputStyle(errors.customerName)}
                    onFocus={e => { e.target.style.borderColor = '#2D6A4F'; e.target.style.background = '#fff' }}
                    onBlur={e  => { e.target.style.borderColor = errors.customerName ? '#FCA5A5' : '#E8E0D0'; e.target.style.background = errors.customerName ? '#FEF2F2' : '#FAFAF7' }} />
                </Field>
                <Field label="Phone *" error={errors.customerPhone}>
                  <input data-err={!!errors.customerPhone} value={form.customerPhone}
                    onChange={e => set('customerPhone', e.target.value)}
                    placeholder="+91 98765 43210" type="tel"
                    style={inputStyle(errors.customerPhone)}
                    onFocus={e => { e.target.style.borderColor = '#2D6A4F'; e.target.style.background = '#fff' }}
                    onBlur={e  => { e.target.style.borderColor = errors.customerPhone ? '#FCA5A5' : '#E8E0D0'; e.target.style.background = errors.customerPhone ? '#FEF2F2' : '#FAFAF7' }} />
                </Field>
              </div>
              <div style={{ marginTop: 14 }}>
                <Field label="Email Address *" error={errors.customerEmail}>
                  <input data-err={!!errors.customerEmail} value={form.customerEmail}
                    onChange={e => set('customerEmail', e.target.value)}
                    placeholder="priya@example.com" type="email"
                    style={inputStyle(errors.customerEmail)}
                    onFocus={e => { e.target.style.borderColor = '#2D6A4F'; e.target.style.background = '#fff' }}
                    onBlur={e  => { e.target.style.borderColor = errors.customerEmail ? '#FCA5A5' : '#E8E0D0'; e.target.style.background = errors.customerEmail ? '#FEF2F2' : '#FAFAF7' }} />
                </Field>
              </div>
            </SectionCard>

            {/* Shipping address */}
            <SectionCard icon={<IconMapPin />} title="Shipping Address" index={2}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Field label="Street Address *" error={errors.street}>
                  <input data-err={!!errors.street} value={form.street}
                    onChange={e => set('street', e.target.value)}
                    placeholder="12, Anna Nagar, 2nd Street"
                    style={inputStyle(errors.street)}
                    onFocus={e => { e.target.style.borderColor = '#2D6A4F'; e.target.style.background = '#fff' }}
                    onBlur={e  => { e.target.style.borderColor = errors.street ? '#FCA5A5' : '#E8E0D0'; e.target.style.background = errors.street ? '#FEF2F2' : '#FAFAF7' }} />
                </Field>
                <div className="form-grid-2">
                  <Field label="City *" error={errors.city}>
                    <input data-err={!!errors.city} value={form.city}
                      onChange={e => set('city', e.target.value)}
                      placeholder="Coimbatore"
                      style={inputStyle(errors.city)}
                      onFocus={e => { e.target.style.borderColor = '#2D6A4F'; e.target.style.background = '#fff' }}
                      onBlur={e  => { e.target.style.borderColor = errors.city ? '#FCA5A5' : '#E8E0D0'; e.target.style.background = errors.city ? '#FEF2F2' : '#FAFAF7' }} />
                  </Field>
                  <Field label="State *" error={errors.state}>
                    <input data-err={!!errors.state} value={form.state}
                      onChange={e => set('state', e.target.value)}
                      placeholder="Tamil Nadu"
                      style={inputStyle(errors.state)}
                      onFocus={e => { e.target.style.borderColor = '#2D6A4F'; e.target.style.background = '#fff' }}
                      onBlur={e  => { e.target.style.borderColor = errors.state ? '#FCA5A5' : '#E8E0D0'; e.target.style.background = errors.state ? '#FEF2F2' : '#FAFAF7' }} />
                  </Field>
                </div>
                <div className="form-grid-2">
                  <Field label="Postal Code *" error={errors.postalCode}>
                    <input data-err={!!errors.postalCode} value={form.postalCode}
                      onChange={e => set('postalCode', e.target.value)}
                      placeholder="641001" type="text" inputMode="numeric"
                      style={inputStyle(errors.postalCode)}
                      onFocus={e => { e.target.style.borderColor = '#2D6A4F'; e.target.style.background = '#fff' }}
                      onBlur={e  => { e.target.style.borderColor = errors.postalCode ? '#FCA5A5' : '#E8E0D0'; e.target.style.background = errors.postalCode ? '#FEF2F2' : '#FAFAF7' }} />
                  </Field>
                  <Field label="Country">
                    <input value="India" readOnly
                      style={{ ...inputStyle(false), color: '#A89F8C', cursor: 'default' }} />
                  </Field>
                </div>
              </div>
            </SectionCard>

            {/* ── Payment method ── */}
            <SectionCard icon={<IconCard />} title="Payment Method" index={3}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                {/* Razorpay tile */}
                <PaymentTile
                  id="RAZORPAY"
                  selected={paymentMethod}
                  onSelect={setPaymentMethod}
                  icon={<IconCard />}
                  title="Pay Online"
                  badge="Recommended"
                  subtitle="UPI, Credit/Debit Card, Net Banking, Wallets — secured by Razorpay."
                />

                {/* COD tile */}
                <PaymentTile
                  id="COD"
                  selected={paymentMethod}
                  onSelect={setPaymentMethod}
                  icon={<IconCash />}
                  title="Cash on Delivery"
                  subtitle={
                    !codEnabled
                      ? 'Currently unavailable.'
                      : codExceedsLimit
                        ? `Not available for orders above ${fmt(codLimit)}.`
                        : `Pay in cash when your order arrives. Available up to ${fmt(codLimit)}.`
                  }
                  disabled={!codEnabled || codExceedsLimit}
                />
              </div>

              {/* Delivery notice */}
              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderRadius: 10, background: 'rgba(45,106,79,0.05)', border: '1px solid rgba(45,106,79,0.10)' }}>
                <span style={{ color: '#2D6A4F', flexShrink: 0 }}><IconTruck /></span>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#5C5548', margin: 0, lineHeight: 1.5 }}>
                  Estimated delivery: <strong>2–5 business days</strong> after dispatch confirmation.
                </p>
              </div>

              {/* Razorpay trust strip */}
              {paymentMethod === 'RAZORPAY' && (
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: '#FAFAF7', border: '1px dashed #E8E0D0' }}>
                  <IconLock />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C' }}>
                    256-bit SSL encryption • PCI-DSS compliant • Your payment data never touches our servers
                  </span>
                </div>
              )}
            </SectionCard>

            {/* Place order button */}
            <button
              className="place-order-btn"
              onClick={handlePlaceOrder}
              disabled={submitting}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                background: submitting ? '#52B788' : 'linear-gradient(135deg,#2D6A4F,#1B4332)',
                color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16,
                padding: '16px 20px', borderRadius: 16, border: 'none',
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 6px 28px rgba(45,106,79,0.32)', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (!submitting) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 36px rgba(45,106,79,0.4)' }}}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(45,106,79,0.32)' }}>
              {submitting ? (
                <>
                  <span style={{ animation: 'spin 0.8s linear infinite', display: 'flex' }}><IconLoader /></span>
                  {paymentMethod === 'RAZORPAY' ? 'Opening payment…' : 'Placing your order…'}
                </>
              ) : (
                <>
                  {paymentMethod === 'RAZORPAY' ? <IconCard /> : <IconCash />}
                  {paymentMethod === 'RAZORPAY' ? `Pay ${fmt(t.grandTotal)} Securely` : `Place Order — ${fmt(t.grandTotal)}`}
                  <IconArrowRight />
                </>
              )}
            </button>

            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#A89F8C', textAlign: 'center', margin: '4px 0 0', lineHeight: 1.6 }}>
              By placing your order you agree to our terms of service.
              {' '}<Link to="/cart" style={{ color: '#2D6A4F', textDecoration: 'underline', textUnderlineOffset: 2 }}>Edit cart</Link>
            </p>
          </div>

          {/* ── Right: order summary ─────────────────────────────────────── */}
          <OrderSummary
            items={items}
            subtotal={t.subtotal}
            shippingFee={t.shippingFee}
            grandTotal={t.grandTotal}
            codEnabled={codEnabled}
            codLimit={codLimit}
          />
        </div>
      </div>

      <style>{`
        .checkout-layout {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 1023px) {
          .checkout-layout { grid-template-columns: 1fr; }
          .checkout-layout > div:last-child { order: -1; }
        }
        .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 499px) { .form-grid-2 { grid-template-columns: 1fr; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
