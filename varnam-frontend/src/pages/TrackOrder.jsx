// src/pages/TrackOrder.jsx — Step 19
// API: GET /api/orders/track/:orderNumber  (public — no auth required)
// Returns: { orderNumber, orderStatus, paymentMethod, createdAt }

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import toast from 'react-hot-toast'
import { orderAPI } from '../services/api'

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
const fmtTime = (d) =>
  new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

/* ─── status config (matches Orders/OrderDetail exactly) ─────────────────── */
const STATUS_CONFIG = {
  'Pending Payment':       { color: '#6B7280', bg: 'rgba(107,114,128,0.09)', dot: '#9CA3AF', label: 'Pending Payment',  step: 0 },
  'Pending Manual Review': { color: '#D97706', bg: 'rgba(217,119,6,0.09)',   dot: '#F59E0B', label: 'Under Review',     step: 0 },
  'Ordered':               { color: '#2D6A4F', bg: 'rgba(45,106,79,0.09)',   dot: '#52B788', label: 'Ordered',          step: 1 },
  'Packed':                { color: '#1D4ED8', bg: 'rgba(29,78,216,0.09)',   dot: '#3B82F6', label: 'Packed',           step: 2 },
  'Shipped':               { color: '#C8893A', bg: 'rgba(200,137,58,0.09)',  dot: '#C8893A', label: 'Shipped',          step: 3 },
  'Out For Delivery':      { color: '#7C3AED', bg: 'rgba(124,58,237,0.09)', dot: '#8B5CF6', label: 'Out for Delivery', step: 4 },
  'Delivered':             { color: '#065F46', bg: 'rgba(6,95,70,0.09)',     dot: '#10B981', label: 'Delivered',        step: 5 },
  'Cancelled':             { color: '#DC2626', bg: 'rgba(220,38,38,0.09)',   dot: '#EF4444', label: 'Cancelled',        step: -1 },
}

const TIMELINE_STEPS = [
  { key: 'Ordered',          label: 'Ordered',          icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> },
  { key: 'Packed',           label: 'Packed',           icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg> },
  { key: 'Shipped',          label: 'Shipped',          icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 4v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> },
  { key: 'Out For Delivery', label: 'Out for Delivery', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  { key: 'Delivered',        label: 'Delivered',        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> },
]

/* ─── icons ────────────────────────────────────────────────────────────────── */
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IconPackage = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
)
const IconLeaf = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
  </svg>
)

/* ─── StatusBadge ────────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['Ordered']
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 14px', borderRadius: 99,
      background: cfg.bg, color: cfg.color,
      fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)',
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  )
}

/* ─── GSAP animated timeline ─────────────────────────────────────────────── */
function StatusTimeline({ status }) {
  const ref = useRef(null)
  const isCancelled = status === 'Cancelled'
  const currentStep = STATUS_CONFIG[status]?.step ?? 0

  useGSAP(() => {
    if (!ref.current) return
    // Animate connectors filling in left-to-right
    const connectors = ref.current.querySelectorAll('.tl-connector-fill')
    const dots       = ref.current.querySelectorAll('.tl-dot')

    gsap.fromTo(dots,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, stagger: 0.08, duration: 0.4, ease: 'back.out(1.5)', delay: 0.15 }
    )
    gsap.fromTo(connectors,
      { scaleX: 0 },
      { scaleX: 1, stagger: 0.1, duration: 0.45, ease: 'power3.out', delay: 0.3, transformOrigin: 'left center' }
    )
    // Labels
    gsap.fromTo(ref.current.querySelectorAll('.tl-label'),
      { y: 8, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.07, duration: 0.35, ease: 'power2.out', delay: 0.4 }
    )
  }, { scope: ref, dependencies: [status] })

  if (isCancelled) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 0' }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(220,38,38,0.08)', border: '2px solid rgba(220,38,38,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </div>
      <div>
        <p style={{ fontFamily: 'var(--font-heading)', fontSize: 16, color: '#DC2626', margin: '0 0 4px' }}>Order Cancelled</p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#A89F8C', margin: 0 }}>This order has been cancelled and will not be processed further.</p>
      </div>
    </div>
  )

  return (
    <div ref={ref}>
      {/* ── Desktop horizontal timeline ── */}
      <div className="tl-desktop" style={{ display: 'flex', alignItems: 'flex-start' }}>
        {TIMELINE_STEPS.map((step, i) => {
          const done   = currentStep > i
          const active = currentStep === i + 1

          return (
            <div key={step.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              {/* connector */}
              {i > 0 && (
                <div style={{ position: 'absolute', top: 21, right: '50%', left: '-50%', height: 3, background: '#F0EBE1', zIndex: 0, overflow: 'hidden' }}>
                  <div className="tl-connector-fill" style={{ height: '100%', background: done || active ? 'linear-gradient(90deg,#52B788,#2D6A4F)' : '#F0EBE1', transformOrigin: 'left center' }} />
                </div>
              )}

              {/* dot */}
              <div className="tl-dot" style={{
                position: 'relative', zIndex: 1,
                width: 44, height: 44, borderRadius: '50%',
                background: done ? 'linear-gradient(135deg,#52B788,#2D6A4F)' : active ? '#fff' : '#F5F0E8',
                border: active ? '2.5px solid #2D6A4F' : done ? 'none' : '2px solid #E8E0D0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: active ? '0 0 0 6px rgba(45,106,79,0.1), 0 4px 12px rgba(45,106,79,0.2)' : done ? '0 3px 10px rgba(45,106,79,0.22)' : 'none',
                color: done ? '#fff' : active ? '#2D6A4F' : '#D0C8B5',
                transition: 'all 0.3s',
              }}>
                {done ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : step.icon}
              </div>

              {/* label */}
              <p className="tl-label" style={{
                fontFamily: 'var(--font-body)',
                fontSize: 11,
                fontWeight: active ? 700 : done ? 500 : 400,
                color: active ? '#2D6A4F' : done ? '#3D3830' : '#A89F8C',
                textAlign: 'center',
                marginTop: 10,
                lineHeight: 1.3,
                maxWidth: 76,
              }}>
                {step.label}
              </p>
            </div>
          )
        })}
      </div>

      {/* ── Mobile vertical timeline ── */}
      <div className="tl-mobile" style={{ display: 'none', flexDirection: 'column', gap: 0 }}>
        {TIMELINE_STEPS.map((step, i) => {
          const done   = currentStep > i
          const active = currentStep === i + 1
          return (
            <div key={step.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, paddingBottom: i < TIMELINE_STEPS.length - 1 ? 20 : 0, position: 'relative' }}>
              {/* vertical line */}
              {i < TIMELINE_STEPS.length - 1 && (
                <div style={{ position: 'absolute', left: 18, top: 38, bottom: 0, width: 3, background: done ? 'linear-gradient(180deg,#52B788,#2D6A4F)' : '#F0EBE1', zIndex: 0 }} />
              )}
              {/* dot */}
              <div style={{
                width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                background: done ? 'linear-gradient(135deg,#52B788,#2D6A4F)' : active ? '#fff' : '#F5F0E8',
                border: active ? '2.5px solid #2D6A4F' : done ? 'none' : '2px solid #E8E0D0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: active ? '0 0 0 5px rgba(45,106,79,0.1)' : 'none',
                color: done ? '#fff' : active ? '#2D6A4F' : '#D0C8B5',
                zIndex: 1, position: 'relative',
              }}>
                {done ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> : step.icon}
              </div>
              {/* text */}
              <div style={{ paddingTop: 8 }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: active ? 700 : done ? 500 : 400, color: active ? '#2D6A4F' : done ? '#26221C' : '#A89F8C', margin: 0 }}>
                  {step.label}
                </p>
                {active && (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#52B788', margin: '2px 0 0', fontWeight: 500 }}>Current status</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <style>{`
        @media (max-width: 600px) {
          .tl-desktop { display: none !important; }
          .tl-mobile  { display: flex !important; }
        }
      `}</style>
    </div>
  )
}

/* ─── Result card ────────────────────────────────────────────────────────── */
function ResultCard({ order }) {
  const ref = useRef(null)

  useGSAP(() => {
    if (!ref.current) return
    gsap.fromTo(ref.current,
      { y: 24, opacity: 0, scale: 0.98 },
      { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out' }
    )
  }, { scope: ref })

  return (
    <div ref={ref}
      style={{ background: '#fff', borderRadius: 20, border: '1px solid #F0EBE1', overflow: 'hidden', boxShadow: '0 4px 32px rgba(45,106,79,0.1)' }}>

      {/* ── Header strip ── */}
      <div style={{ padding: '16px 24px', background: 'linear-gradient(135deg,rgba(45,106,79,0.04),rgba(82,183,136,0.04))', borderBottom: '1px solid #F0EBE1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Order Number
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 700, color: '#26221C', margin: 0, letterSpacing: '0.04em' }}>
            {order.orderNumber}
          </p>
        </div>
        <StatusBadge status={order.orderStatus} />
      </div>

      {/* ── Meta row ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0, borderBottom: '1px solid #F5F0E8' }}>
        {[
          {
            label: 'Order Date',
            value: fmtDate(order.createdAt),
            sub: fmtTime(order.createdAt),
            icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
          },
          {
            label: 'Payment Method',
            value: order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment',
            sub: order.paymentMethod === 'COD' ? 'Pay on delivery' : 'Paid online',
            icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
          },
        ].map(({ label, value, sub, icon }) => (
          <div key={label} style={{ flex: '1 1 180px', padding: '16px 24px', borderRight: '1px solid #F5F0E8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
              {icon}
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: '#26221C', margin: '0 0 2px' }}>{value}</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C', margin: 0 }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Timeline ── */}
      <div style={{ padding: '24px 24px 20px' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#A89F8C', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 20 }}>
          Order Progress
        </p>
        <StatusTimeline status={order.orderStatus} />
      </div>

      {/* ── Footer note ── */}
      <div style={{ padding: '14px 24px', borderTop: '1px solid #F5F0E8', background: '#FAFAF7', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ color: '#52B788', flexShrink: 0 }}><IconLeaf /></div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#A89F8C', margin: 0, lineHeight: 1.5 }}>
          For delivery issues or queries, contact us at{' '}
          <a href="mailto:hello@varnamnaturals.com" style={{ color: '#2D6A4F', textDecoration: 'none', fontWeight: 500 }}>
            hello@varnamnaturals.com
          </a>
        </p>
      </div>
    </div>
  )
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function TrackOrder() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [input,   setInput]   = useState(searchParams.get('order') || '')
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)
  const [error,   setError]   = useState('')

  const heroRef  = useRef(null)
  const formRef  = useRef(null)
  const inputRef = useRef(null)

  // Entrance animation
  useGSAP(() => {
    const tl = gsap.timeline()
    tl.fromTo(heroRef.current?.querySelectorAll('.hero-line'),
      { y: 22, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.1, duration: 0.6, ease: 'power3.out' }
    )
    tl.fromTo(formRef.current,
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' },
      '-=0.3'
    )
  }, [])

  // Auto-submit if ?order= param present on load
  useEffect(() => {
    const orderParam = searchParams.get('order')
    if (orderParam && orderParam.trim()) {
      setInput(orderParam.trim())
      handleTrack(orderParam.trim())
    }
  }, []) // eslint-disable-line

  const handleTrack = useCallback(async (value) => {
    const orderNumber = (value || input).trim().toUpperCase()
    if (!orderNumber) {
      setError('Please enter an order number')
      inputRef.current?.focus()
      return
    }
    // Basic format check: starts with ORD-
    if (!orderNumber.startsWith('ORD-')) {
      setError('Order number should start with ORD- (e.g. ORD-20260530-A1B2C3)')
      gsap.fromTo(formRef.current, { x: -6 }, { x: 0, duration: 0.4, ease: 'elastic.out(2, 0.4)' })
      return
    }

    setError('')
    setLoading(true)
    setResult(null)

    // Update URL param
    setSearchParams({ order: orderNumber }, { replace: true })

    try {
      const { data } = await orderAPI.trackByOrderNumber(orderNumber)
      if (data.success) {
        setResult(data.data)
      } else {
        setError('Order not found. Please check the order number.')
        setResult(null)
      }
    } catch (err) {
      if (err?.response?.status === 404) {
        setError('No order found with this number. Double-check and try again.')
      } else if (err?.response?.status === 429) {
        setError('Too many requests. Please wait a moment and try again.')
      } else {
        setError(err?.response?.data?.message || 'Something went wrong. Please try again.')
      }
      // Shake form on error
      gsap.fromTo(formRef.current, { x: -8 }, { x: 0, duration: 0.45, ease: 'elastic.out(2, 0.4)' })
    } finally {
      setLoading(false)
    }
  }, [input, setSearchParams])

  const handleClear = () => {
    setInput('')
    setResult(null)
    setError('')
    setSearchParams({}, { replace: true })
    inputRef.current?.focus()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    handleTrack()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF7', paddingBottom: 80 }}>

      {/* ── Hero header ───────────────────────────────────────────────── */}
      <div ref={heroRef} style={{
        background: 'linear-gradient(160deg,#1B4332 0%,#2D6A4F 55%,#40916C 100%)',
        padding: '56px 0 80px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* BG decoration */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(82,183,136,0.1)', filter: 'blur(60px)' }} />
          <div style={{ position: 'absolute', bottom: -40, left: -40, width: 240, height: 240, borderRadius: '50%', background: 'rgba(200,137,58,0.07)', filter: 'blur(50px)' }} />
          <svg style={{ position: 'absolute', right: 0, bottom: 0, height: '100%', opacity: 0.05 }} viewBox="0 0 200 400" fill="none">
            <path d="M200 0 C100 100 200 200 80 300 L200 400 Z" fill="#52B788"/>
          </svg>
        </div>

        <div className="container-main" style={{ position: 'relative', zIndex: 10 }}>
          {/* Breadcrumb */}
          <nav className="hero-line" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontFamily: 'var(--font-body)', marginBottom: 20 }}>
            <a href="/" style={{ color: 'rgba(253,246,236,0.55)', textDecoration: 'none' }}>Home</a>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(253,246,236,0.4)" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            <span style={{ color: 'rgba(253,246,236,0.9)' }}>Track Order</span>
          </nav>

          <div style={{ maxWidth: 520 }}>
            <div className="hero-line" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 99, padding: '5px 14px', marginBottom: 16 }}>
              <IconLeaf />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(253,246,236,0.8)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                Order Tracking
              </span>
            </div>
            <h1 className="hero-line" style={{ fontFamily: 'var(--font-heading)', color: '#FDF6EC', fontSize: 'clamp(1.8rem,5vw,2.8rem)', lineHeight: 1.15, margin: '0 0 12px' }}>
              Where's My Order?
            </h1>
            <p className="hero-line" style={{ fontFamily: 'var(--font-body)', color: 'rgba(253,246,236,0.6)', fontSize: 15, lineHeight: 1.7, margin: 0 }}>
              Enter your order number to see real-time status updates. No login required.
            </p>
          </div>
        </div>
      </div>

      {/* ── Search form — overlaps hero ───────────────────────────────── */}
      <div className="container-main" style={{ marginTop: -36, position: 'relative', zIndex: 20 }}>
        <form ref={formRef} onSubmit={handleSubmit}>
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #F0EBE1', boxShadow: '0 8px 40px rgba(45,106,79,0.12)', padding: '24px 24px 20px' }}>

            <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: '#3D3830', marginBottom: 10 }}>
              Order Number
            </label>

            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#A89F8C', pointerEvents: 'none' }}>
                  <IconSearch />
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => { setInput(e.target.value.toUpperCase()); setError('') }}
                  placeholder="e.g. ORD-20260530-A1B2C3D4"
                  spellCheck={false}
                  autoComplete="off"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '13px 40px 13px 44px',
                    borderRadius: 14,
                    border: `1.5px solid ${error ? '#FECACA' : '#E8E0D0'}`,
                    background: error ? '#FFF8F8' : '#FAFAF7',
                    fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
                    color: '#26221C', letterSpacing: '0.04em',
                    outline: 'none',
                    transition: 'border-color 0.2s, background 0.2s',
                  }}
                  onFocus={e => { if (!error) e.target.style.borderColor = '#2D6A4F' }}
                  onBlur={e  => { if (!error) e.target.style.borderColor = '#E8E0D0' }}
                />
                {input && (
                  <button type="button" onClick={handleClear}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#A89F8C', padding: 4, display: 'flex' }}>
                    <IconX />
                  </button>
                )}
              </div>

              <button type="submit" disabled={loading}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '13px 22px', borderRadius: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  background: loading ? '#A89F8C' : '#2D6A4F',
                  color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14,
                  whiteSpace: 'nowrap', transition: 'background 0.2s', flexShrink: 0,
                  boxShadow: loading ? 'none' : '0 4px 16px rgba(45,106,79,0.28)',
                }}>
                {loading ? (
                  <>
                    <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                    Tracking…
                  </>
                ) : (
                  <><IconSearch /> Track</>
                )}
              </button>
            </div>

            {/* Error message */}
            {error && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#DC2626', marginTop: 10, marginBottom: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </p>
            )}

            {/* Example hint */}
            {!result && !error && !loading && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C', marginTop: 10, marginBottom: 0 }}>
                Your order number was sent in your confirmation email. Format: <span style={{ fontWeight: 600, color: '#7A7265' }}>ORD-YYYYMMDD-XXXXXXXX</span>
              </p>
            )}
          </div>
        </form>
      </div>

      {/* ── Result ─────────────────────────────────────────────────────── */}
      {result && !loading && (
        <div className="container-main" style={{ marginTop: 24 }}>
          <ResultCard order={result} />
        </div>
      )}

      {/* ── Empty state (before any search) ──────────────────────────── */}
      {!result && !loading && !error && (
        <div className="container-main" style={{ marginTop: 40 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 24px', textAlign: 'center', background: '#fff', borderRadius: 20, border: '1px solid #F0EBE1' }}>
            <div style={{ color: '#D0C8B5' }}><IconPackage /></div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, color: '#26221C', margin: 0 }}>
              Track your Varnam order
            </h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#A89F8C', maxWidth: 320, lineHeight: 1.65, margin: 0 }}>
              Enter your order number above to see live delivery status. No account needed.
            </p>

            {/* Trust chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8 }}>
              {['No login required', 'Live status updates', 'Instant results'].map(t => (
                <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-body)', fontSize: 12, color: '#2D6A4F', background: 'rgba(45,106,79,0.06)', border: '1px solid rgba(45,106,79,0.12)', borderRadius: 99, padding: '4px 12px' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#52B788" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}