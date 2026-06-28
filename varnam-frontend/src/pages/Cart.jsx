import { useRef, useEffect, useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import toast from 'react-hot-toast'

import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import PageTransition from '../components/layout/PageTransition'
import { authAPI, getErrorMessage } from '../services/api'

/* ── Icons ───────────────────────────────────────────────────────────────── */
const IconTrash = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)
const IconMinus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const IconShoppingBag = () => (
  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
)
const IconTruck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 4v4h-7V8z"/>
    <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
)
const IconShield = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
  </svg>
)
const IconArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
)
const IconTag = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
)
const IconLeaf = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
  </svg>
)

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

function effectivePrice(product) {
  return product.discountPrice > 0 ? product.discountPrice : product.price
}

/* ── Empty cart ──────────────────────────────────────────────────────────── */
function EmptyCart() {
  const ref = useRef(null)
  useGSAP(() => {
    gsap.fromTo(ref.current.querySelectorAll('.ec-item'),
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.1, duration: 0.55, ease: 'power3.out', delay: 0.1 }
    )
  }, { scope: ref })

  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px 60px', textAlign: 'center' }}>
      <div className="ec-item" style={{ width: 96, height: 96, borderRadius: '50%', background: 'rgba(45,106,79,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B8AFA0', marginBottom: 24 }}>
        <IconShoppingBag />
      </div>
      <h2 className="ec-item" style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.3rem,3vw,1.8rem)', color: '#26221C', margin: '0 0 10px' }}>
        Your cart is empty
      </h2>
      <p className="ec-item" style={{ fontFamily: 'var(--font-body)', color: '#A89F8C', fontSize: 14, maxWidth: 320, margin: '0 0 32px', lineHeight: 1.7 }}>
        Looks like you haven't added anything yet. Explore our pure, cold-pressed range.
      </p>
      <Link to="/shop" className="ec-item" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#2D6A4F', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, padding: '13px 28px', borderRadius: 14, textDecoration: 'none', boxShadow: '0 6px 24px rgba(45,106,79,0.28)' }}>
        Browse Products <IconArrowRight />
      </Link>
    </div>
  )
}

/* ── Free shipping progress bar ─────────────────────────────────────────── */
function FreeShippingBar({ progress, amountLeft, threshold }) {
  const barRef = useRef(null)
  useEffect(() => {
    if (!barRef.current) return
    gsap.to(barRef.current, { width: `${progress}%`, duration: 0.6, ease: 'power3.out' })
  }, [progress])

  const unlocked = progress >= 100
  return (
    <div style={{ background: unlocked ? 'rgba(45,106,79,0.07)' : 'rgba(200,137,58,0.06)', border: `1px solid ${unlocked ? 'rgba(45,106,79,0.15)' : 'rgba(200,137,58,0.15)'}`, borderRadius: 14, padding: '14px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ color: unlocked ? '#2D6A4F' : '#C8893A' }}><IconTruck /></span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: unlocked ? '#2D6A4F' : '#C8893A' }}>
            {unlocked ? '🎉 Free shipping unlocked!' : `Add ${fmt(amountLeft)} more for free shipping`}
          </span>
        </div>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C' }}>{fmt(threshold)} threshold</span>
      </div>
      <div style={{ height: 6, background: '#E8E0D0', borderRadius: 99, overflow: 'hidden' }}>
        <div ref={barRef} style={{ height: '100%', width: '0%', borderRadius: 99, background: unlocked ? 'linear-gradient(90deg,#52B788,#2D6A4F)' : 'linear-gradient(90deg,#E9B87A,#C8893A)' }} />
      </div>
    </div>
  )
}

/* ── Cart item row ───────────────────────────────────────────────────────── */
function CartItem({ item, onRemove, onQtyChange }) {
  const { product, quantity } = item
  const rowRef = useRef(null)
  const imgRef = useRef(null)

  const price     = effectivePrice(product)
  const hasDisc   = product.discountPrice > 0
  const lineTotal = price * quantity

  const onImgEnter = () => gsap.to(imgRef.current, { scale: 1.06, duration: 0.35, ease: 'power2.out' })
  const onImgLeave = () => gsap.to(imgRef.current, { scale: 1,    duration: 0.35, ease: 'power2.out' })

  const handleRemove = () => {
    gsap.to(rowRef.current, {
      height: 0, opacity: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0,
      duration: 0.38, ease: 'power3.in',
      onComplete: () => onRemove(product._id),
    })
  }

  const handleQty = (delta) => {
    const next = quantity + delta
    if (next < 1)              { handleRemove(); return }
    if (next > product.stock)  return
    onQtyChange(product._id, next)
  }

  return (
    <div ref={rowRef} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '20px 0', borderBottom: '1px solid #F5F0E8', overflow: 'hidden' }}>
      <Link to={`/shop/${product.slug}`}
        style={{ flexShrink: 0, width: 90, height: 90, borderRadius: 14, overflow: 'hidden', background: '#FAFAF7', display: 'block', textDecoration: 'none' }}
        onMouseEnter={onImgEnter} onMouseLeave={onImgLeave}>
        <img ref={imgRef} src={product.images?.[0] ?? '/placeholder-product.jpg'} alt={product.name} loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', willChange: 'transform', display: 'block' }} />
      </Link>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {product.category?.name && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: '#A89F8C', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 4px' }}>
                {product.category.name}
              </p>
            )}
            <Link to={`/shop/${product.slug}`}
              style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14, color: '#26221C', textDecoration: 'none', lineHeight: 1.4, display: 'block' }}
              onMouseEnter={e => e.currentTarget.style.color = '#2D6A4F'}
              onMouseLeave={e => e.currentTarget.style.color = '#26221C'}>
              {product.name}
            </Link>
          </div>
          <button onClick={handleRemove} title="Remove item"
            style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 8, border: '1px solid #F0EBE1', background: '#fff', color: '#A89F8C', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.borderColor = '#FECACA' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff';    e.currentTarget.style.color = '#A89F8C'; e.currentTarget.style.borderColor = '#F0EBE1' }}>
            <IconTrash />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#F5F0E8', borderRadius: 10, overflow: 'hidden' }}>
            <button onClick={() => handleQty(-1)} disabled={quantity <= 1}
              style={{ width: 34, height: 34, border: 'none', background: 'transparent', color: quantity <= 1 ? '#C4B9A8' : '#5C5548', cursor: quantity <= 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
              onMouseEnter={e => { if(quantity > 1) e.currentTarget.style.background = '#E8E0D0' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
              <IconMinus />
            </button>
            <span style={{ width: 32, textAlign: 'center', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: '#26221C' }}>
              {quantity}
            </span>
            <button onClick={() => handleQty(1)} disabled={quantity >= product.stock}
              style={{ width: 34, height: 34, border: 'none', background: 'transparent', color: quantity >= product.stock ? '#C4B9A8' : '#5C5548', cursor: quantity >= product.stock ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
              onMouseEnter={e => { if(quantity < product.stock) e.currentTarget.style.background = '#E8E0D0' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
              <IconPlus />
            </button>
          </div>

          <div style={{ textAlign: 'right' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: '#26221C', margin: 0 }}>{fmt(lineTotal)}</p>
            {hasDisc && quantity > 1 && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C', margin: 0 }}>{fmt(price)} × {quantity}</p>
            )}
            {hasDisc && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#52B788', margin: 0 }}>was {fmt(product.price * quantity)}</p>
            )}
          </div>
        </div>

        {product.stock <= 5 && product.stock > 0 && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#D97706', margin: '8px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Only {product.stock} left in stock
          </p>
        )}
      </div>
    </div>
  )
}

/* ── Guest Email OTP Modal ────────────────────────────────────────────────── */
function GuestOtpModal({ onVerified, onClose }) {
  const [email, setEmail]           = useState('')
  const [otp, setOtp]               = useState('')
  const [step, setStep]             = useState('email') // 'email' | 'otp'
  const [loading, setLoading]       = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const overlayRef = useRef(null)
  const cardRef    = useRef(null)

  // Animate in on mount
  useEffect(() => {
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'power2.out' })
    gsap.fromTo(cardRef.current, { y: 28, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.32, ease: 'power3.out' })
  }, [])

  // Resend countdown
  useEffect(() => {
    if (!resendCooldown) return
    const t = setTimeout(() => setResendCooldown(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  const animateClose = (cb) => {
    gsap.to(cardRef.current,    { y: 16, opacity: 0, scale: 0.97, duration: 0.2, ease: 'power2.in' })
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.22, ease: 'power2.in', onComplete: cb })
  }

  const handleSendOtp = async () => {
    const trimmed = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error('Please enter a valid email address'); return
    }
    setLoading(true)
    try {
      await authAPI.sendGuestCheckoutOtp(trimmed)
      setStep('otp')
      setResendCooldown(60)
      toast.success('OTP sent! Check your inbox.')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (otp.trim().length !== 6) { toast.error('Enter the 6-digit OTP'); return }
    setLoading(true)
    try {
      await authAPI.verifyGuestCheckoutOtp(email.trim().toLowerCase(), otp.trim())
      toast.success('Email verified!')
      animateClose(() => onVerified(email.trim().toLowerCase()))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown) return
    setLoading(true)
    try {
      await authAPI.sendGuestCheckoutOtp(email.trim().toLowerCase())
      setResendCooldown(60)
      toast.success('OTP resent!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    fontFamily: 'var(--font-body)', fontSize: 14, color: '#26221C',
    background: '#fff', border: '1.5px solid #D4E8DC', borderRadius: 10,
    padding: '11px 14px', outline: 'none', transition: 'border-color 0.18s',
  }
  const btnPrimary = {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    background: loading ? '#52B788' : 'linear-gradient(135deg, #2D6A4F, #1B4332)',
    color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14,
    padding: '12px 20px', borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
    boxShadow: '0 4px 14px rgba(45,106,79,0.28)', transition: 'all 0.2s',
  }

  return (
    <div ref={overlayRef} style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(18,38,28,0.55)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={e => { if (e.target === overlayRef.current) animateClose(onClose) }}>

      <div ref={cardRef} style={{
        width: '100%', maxWidth: 400, borderRadius: 20, overflow: 'hidden',
        background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
      }}>
        {/* Header stripe */}
        <div style={{ height: 4, background: 'linear-gradient(90deg, #2D6A4F, #52B788, #C8893A)' }} />

        {/* Header */}
        <div style={{ padding: '22px 24px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #2D6A4F, #52B788)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(45,106,79,0.22)',
            }}>
              {step === 'email' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              )}
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 17, color: '#1B4332', margin: 0 }}>
                {step === 'email' ? 'Verify your email' : 'Enter OTP'}
              </h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#8A9E92', margin: '2px 0 0' }}>
                {step === 'email' ? 'We\'ll send a one-time code to confirm' : `Sent to ${email}`}
              </p>
            </div>
          </div>
          <button onClick={() => animateClose(onClose)} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            color: '#A89F8C', borderRadius: 8, display: 'flex', alignItems: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px 24px' }}>
          {step === 'email' ? (
            <>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#6B7D73', margin: '0 0 14px', lineHeight: 1.6 }}>
                Enter the email address where we should send your order confirmation.
              </p>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !loading && handleSendOtp()}
                onFocus={e => { e.target.style.borderColor = '#2D6A4F' }}
                onBlur={e =>  { e.target.style.borderColor = '#D4E8DC' }}
                style={{ ...inputStyle, marginBottom: 14 }}
                autoFocus
              />
              <button onClick={handleSendOtp} disabled={loading} style={btnPrimary}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}>
                {loading ? (
                  <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg> Sending…</>
                ) : (
                  <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Send OTP</>
                )}
              </button>
            </>
          ) : (
            <>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#6B7D73', margin: '0 0 6px', lineHeight: 1.6 }}>
                Enter the 6-digit code we sent to your inbox. Valid for 10 minutes.
              </p>
              {/* OTP digit-style input */}
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="· · · · · ·"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && !loading && handleVerifyOtp()}
                onFocus={e => { e.target.style.borderColor = '#2D6A4F' }}
                onBlur={e =>  { e.target.style.borderColor = '#D4E8DC' }}
                style={{
                  ...inputStyle,
                  fontSize: 24, fontWeight: 700, letterSpacing: '0.35em',
                  textAlign: 'center', marginBottom: 14,
                  fontFamily: "'Courier New', monospace",
                  color: '#2D6A4F',
                }}
                autoFocus
              />
              <button onClick={handleVerifyOtp} disabled={loading} style={{ ...btnPrimary, marginBottom: 12 }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}>
                {loading ? (
                  <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg> Verifying…</>
                ) : (
                  <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> Verify &amp; Continue</>
                )}
              </button>

              {/* Resend + back */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button onClick={() => { setStep('email'); setOtp('') }} style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  fontFamily: 'var(--font-body)', fontSize: 12, color: '#A89F8C',
                }}>
                  ← Change email
                </button>
                <button onClick={handleResend} disabled={!!resendCooldown || loading} style={{
                  background: 'none', border: 'none', padding: 0,
                  fontFamily: 'var(--font-body)', fontSize: 12,
                  color: resendCooldown ? '#B5C9BE' : '#2D6A4F',
                  cursor: resendCooldown ? 'default' : 'pointer', fontWeight: 500,
                }}>
                  {resendCooldown ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer note */}
        <div style={{ borderTop: '1px solid #F0EBE1', padding: '12px 24px', background: '#FAFAF7' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#B0A89E', textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
            🔒 This verifies you own this email. No account is created.
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

/* ── Order summary panel ─────────────────────────────────────────────────── */
function OrderSummary({ items, totals, settings, onCheckout, isAuthenticated }) {
  const { subtotal, shippingFee, grandTotal, amountForFreeShipping, freeShippingProgress } = totals
  const panelRef  = useRef(null)
  const totalRef  = useRef(null)
  const prevTotal = useRef(grandTotal)

  useEffect(() => {
    if (grandTotal !== prevTotal.current && totalRef.current) {
      gsap.fromTo(totalRef.current,
        { scale: 1.08, color: '#2D6A4F' },
        { scale: 1,    color: '#26221C', duration: 0.5, ease: 'elastic.out(1, 0.5)' }
      )
    }
    prevTotal.current = grandTotal
  }, [grandTotal])

  useGSAP(() => {
    gsap.fromTo(panelRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out', delay: 0.15 }
    )
  }, { scope: panelRef })

  const totalSavings = items.reduce((acc, { product, quantity }) => {
    if (product.discountPrice > 0) acc += (product.price - product.discountPrice) * quantity
    return acc
  }, 0)

  return (
    <div ref={panelRef} style={{ position: 'sticky', top: 90 }}>
      <div style={{ marginBottom: 16 }}>
        <FreeShippingBar progress={freeShippingProgress} amountLeft={amountForFreeShipping} threshold={settings.freeShippingThreshold} />
      </div>

      <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #F0EBE1', overflow: 'hidden', boxShadow: '0 4px 24px rgba(45,106,79,0.08)' }}>
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #F5F0E8' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 17, color: '#26221C', margin: 0 }}>Order Summary</h3>
        </div>

        <div style={{ padding: '16px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#A89F8C' }}>Items ({items.reduce((s, i) => s + i.quantity, 0)})</span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#26221C', fontWeight: 500 }}>{fmt(subtotal)}</span>
          </div>

          {totalSavings > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#52B788', display: 'flex', alignItems: 'center', gap: 5 }}>
                <IconTag /> Discount savings
              </span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#52B788', fontWeight: 500 }}>− {fmt(totalSavings)}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#A89F8C', display: 'flex', alignItems: 'center', gap: 5 }}>
              <IconTruck /> Shipping
            </span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: shippingFee === 0 ? '#52B788' : '#26221C' }}>
              {shippingFee === 0 ? 'FREE' : fmt(shippingFee)}
            </span>
          </div>

          <div style={{ height: 1, background: '#F5F0E8', margin: '0 0 16px' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 15, color: '#26221C' }}>Total</span>
            <span ref={totalRef} style={{ fontFamily: 'var(--font-heading)', fontSize: 22, color: '#26221C', fontWeight: 700, willChange: 'transform' }}>
              {fmt(grandTotal)}
            </span>
          </div>

          <button onClick={onCheckout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg, #2D6A4F, #1B4332)', color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, padding: '14px 20px', borderRadius: 14, border: 'none', cursor: 'pointer', boxShadow: '0 6px 24px rgba(45,106,79,0.3)', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 32px rgba(45,106,79,0.38)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.boxShadow = '0 6px 24px rgba(45,106,79,0.3)' }}
            onMouseDown={e  => { e.currentTarget.style.transform = 'translateY(0) scale(0.98)' }}
            onMouseUp={e    => { e.currentTarget.style.transform = 'translateY(-2px)' }}>
            Proceed to Checkout <IconArrowRight />
          </button>

          {/* guest login card — attractive nudge, never blocks checkout */}
          {!isAuthenticated && (
            <div style={{
              marginTop: 16,
              borderRadius: 16,
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #F0F7F4 0%, #FDF6EC 100%)',
              border: '1px solid #D4E8DC',
              boxShadow: '0 2px 12px rgba(45,106,79,0.08)',
            }}>
              {/* top accent stripe */}
              <div style={{ height: 3, background: 'linear-gradient(90deg, #2D6A4F, #52B788, #C8893A)' }} />

              <div style={{ padding: '14px 18px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                {/* leaf icon badge */}
                <div style={{
                  flexShrink: 0,
                  width: 42, height: 42,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2D6A4F, #52B788)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(45,106,79,0.25)',
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </div>

                {/* text block */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700, color: '#1B4332', margin: '0 0 2px', letterSpacing: 0.1 }}>
                    Save your order history
                  </p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 11.5, color: '#6B8F78', margin: 0, lineHeight: 1.5 }}>
                    Members get order tracking, wishlists &amp; faster checkout.
                  </p>
                </div>
              </div>

              {/* CTA row */}
              <div style={{ padding: '0 18px 14px', display: 'flex', gap: 8 }}>
                <Link to="/login"
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    background: 'linear-gradient(135deg, #2D6A4F, #1B4332)',
                    color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12.5,
                    padding: '8px 12px', borderRadius: 10, textDecoration: 'none',
                    boxShadow: '0 3px 10px rgba(45,106,79,0.28)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(45,106,79,0.36)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.boxShadow = '0 3px 10px rgba(45,106,79,0.28)' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                  Sign in
                </Link>
                <Link to="/register"
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'transparent', border: '1.5px solid #52B788',
                    color: '#2D6A4F', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12.5,
                    padding: '8px 12px', borderRadius: 10, textDecoration: 'none',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#EAF4EE'; e.currentTarget.style.borderColor = '#2D6A4F' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#52B788' }}>
                  Create account
                </Link>
              </div>
            </div>
          )}

          <Link to="/shop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 10, fontFamily: 'var(--font-body)', fontSize: 13, color: '#A89F8C', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#2D6A4F'}
            onMouseLeave={e => e.currentTarget.style.color = '#A89F8C'}>
            ← Continue shopping
          </Link>
        </div>

        <div style={{ borderTop: '1px solid #F5F0E8', padding: '14px 22px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
          {[{ icon: <IconShield />, label: 'Secure checkout' }, { icon: <IconLeaf />, label: '100% organic' }].map(({ icon, label }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C' }}>
              <span style={{ color: '#2D6A4F' }}>{icon}</span> {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function Cart() {
  const navigate = useNavigate()

  // loading flag from authStore — wait for init() to resolve before acting
  const { isAuthenticated, loading: authLoading } = useAuthStore()

  const { items, removeItem, updateQty, clearCart, fetchSettings, freeShippingThreshold, flatShippingFee, totals } = useCartStore()

  const listRef   = useRef(null)
  const headerRef = useRef(null)

  // Guest OTP modal state
  const [showOtpModal, setShowOtpModal] = useState(false)

  useEffect(() => { fetchSettings() }, [fetchSettings])

  useGSAP(() => {
    if (!listRef.current || !items.length) return
    gsap.fromTo(listRef.current.querySelectorAll('.cart-row'),
      { x: -16, opacity: 0 },
      { x: 0, opacity: 1, stagger: 0.07, duration: 0.45, ease: 'power3.out', delay: 0.05 }
    )
  }, { scope: listRef, dependencies: [] })

  useGSAP(() => {
    gsap.fromTo(headerRef.current,
      { y: -12, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out' }
    )
  }, { scope: headerRef })

  const handleCheckout = useCallback(() => {
    // Wait for session restore — authLoading means init() hasn't resolved yet
    if (authLoading) return

    // Logged-in users go straight through
    if (isAuthenticated) {
      navigate('/checkout')
      return
    }

    // Guests must verify their email first
    setShowOtpModal(true)
  }, [authLoading, isAuthenticated, navigate])

  // Called after guest successfully verifies OTP — pass email via location state
  const handleGuestVerified = useCallback((verifiedEmail) => {
    setShowOtpModal(false)
    navigate('/checkout', { state: { guestEmail: verifiedEmail } })
  }, [navigate])

  const handleClearCart = () => {
    if (!items.length) return
    if (!window.confirm('Remove all items from your cart?')) return
    const rows = listRef.current?.querySelectorAll('.cart-row')
    if (rows?.length) {
      gsap.to(rows, { opacity: 0, x: -20, stagger: 0.04, duration: 0.3, ease: 'power2.in', onComplete: clearCart })
    } else {
      clearCart()
    }
  }

  const t = totals()

  return (
    <PageTransition>
      <div style={{ minHeight: '80vh', background: '#FAFAF7', paddingBottom: 64 }}>

        <div ref={headerRef} style={{ background: '#fff', borderBottom: '1px solid #F0EBE1', padding: '24px 0 20px' }}>
          <div className="container-main">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 12, color: '#A89F8C', marginBottom: 6 }}>
                  <Link to="/" style={{ color: '#A89F8C', textDecoration: 'none' }}>Home</Link>
                  <span>/</span>
                  <span style={{ color: '#26221C' }}>Cart</span>
                </nav>
                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.3rem,2.5vw,1.8rem)', color: '#26221C', margin: 0 }}>
                  My Cart
                  {items.length > 0 && (
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 400, color: '#A89F8C', marginLeft: 10 }}>
                      ({items.reduce((s, i) => s + i.quantity, 0)} item{items.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''})
                    </span>
                  )}
                </h1>
              </div>

              {items.length > 0 && (
                <button onClick={handleClearCart}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, border: '1px solid #F0EBE1', background: '#fff', fontFamily: 'var(--font-body)', fontSize: 12, color: '#A89F8C', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#FECACA'; e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = '#FEF2F2' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#F0EBE1'; e.currentTarget.style.color = '#A89F8C'; e.currentTarget.style.background = '#fff' }}>
                  <IconTrash /> Clear cart
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="container-main" style={{ paddingTop: 28 }}>
          {items.length === 0 ? (
            <EmptyCart />
          ) : (
            <div className="cart-layout">
              <div>
                <div ref={listRef} style={{ background: '#fff', borderRadius: 20, border: '1px solid #F0EBE1', padding: '0 24px', boxShadow: '0 2px 16px rgba(45,106,79,0.06)' }}>
                  {items.map(item => (
                    <div key={item.product._id} className="cart-row">
                      <CartItem item={item} onRemove={removeItem} onQtyChange={updateQty} />
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 16, display: 'grid', gap: 12 }} className="assurance-grid">
                  {[
                    { emoji: '🌿', title: 'Farm to Door',  sub: 'Direct from certified farms' },
                    { emoji: '❄️', title: 'Cold Pressed',  sub: 'Nutrients fully preserved' },
                    { emoji: '🔒', title: 'Safe Checkout', sub: 'SSL encrypted payment' },
                  ].map(({ emoji, title, sub }) => (
                    <div key={title} style={{ background: '#fff', borderRadius: 14, border: '1px solid #F0EBE1', padding: '14px 16px', textAlign: 'center' }}>
                      <p style={{ fontSize: 20, margin: '0 0 6px' }}>{emoji}</p>
                      <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: '#26221C', margin: '0 0 2px' }}>{title}</p>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C', margin: 0 }}>{sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              <OrderSummary
                items={items}
                totals={t}
                settings={{ freeShippingThreshold, flatShippingFee }}
                onCheckout={handleCheckout}
                isAuthenticated={isAuthenticated}
              />
            </div>
          )}
        </div>
      </div>

      <style>{`
        .cart-layout { display: grid; grid-template-columns: 1fr 360px; gap: 24px; align-items: start; }
        @media (max-width: 1023px) { .cart-layout { grid-template-columns: 1fr; } }
        .assurance-grid { grid-template-columns: repeat(3, 1fr); }
        @media (max-width: 599px)  { .assurance-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      {showOtpModal && (
        <GuestOtpModal
          onVerified={handleGuestVerified}
          onClose={() => setShowOtpModal(false)}
        />
      )}
    </PageTransition>
  )
}