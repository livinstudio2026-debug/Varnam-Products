// src/pages/ForgotPassword.jsx
// 3-step flow: Email → OTP → New Password
// Endpoints:
//   POST /api/auth/forgot-password   { email }
//   POST /api/auth/reset-password    { email, otp, newPassword }

import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate }           from 'react-router-dom'
import { gsap }                        from 'gsap'
import { useGSAP }                     from '@gsap/react'
import toast                           from 'react-hot-toast'
import { authAPI }                     from '../services/api'

/* ─────────────────────────────────────────────────────────────────────────────
   ICONS
───────────────────────────────────────────────────────────────────────────── */
const IconMail   = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)
const IconLock   = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)
const IconEye    = ({ off }) => off ? (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
) : (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)
const IconLeaf   = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
  </svg>
)
const IconCheck  = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconArrow  = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
)

/* ─────────────────────────────────────────────────────────────────────────────
   LEFT PANEL (same as Login)
───────────────────────────────────────────────────────────────────────────── */
function PanelBg() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(145deg,#1B4332 0%,#2D6A4F 50%,#40916C 100%)' }} />
      <svg viewBox="0 0 300 300" fill="none" style={{ position: 'absolute', bottom: -60, left: -60, width: 320, height: 320, opacity: 0.12 }}>
        <path d="M30 270 C30 120 150 15 285 7 C270 150 165 248 30 270Z" fill="#95D5B2"/>
      </svg>
      <svg viewBox="0 0 200 200" fill="none" style={{ position: 'absolute', top: -30, right: -30, width: 200, height: 200, opacity: 0.08, transform: 'rotate(160deg)' }}>
        <path d="M20 180 C20 80 100 10 190 5 C180 100 110 165 20 180Z" fill="#D8F3DC"/>
      </svg>
      <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', width: '80%', height: '50%', background: 'radial-gradient(ellipse,rgba(82,183,136,0.18) 0%,transparent 70%)' }} />
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.06 }}>
        <defs>
          <pattern id="fp-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="#FDF6EC"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#fp-dots)"/>
      </svg>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   STEP INDICATOR
───────────────────────────────────────────────────────────────────────────── */
function StepDots({ current }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 32 }}>
      {['Email', 'Verify', 'Reset'].map((label, i) => {
        const done   = i < current
        const active = i === current
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: active ? 28 : 8, height: 8, borderRadius: 99,
              background: active ? '#2D6A4F' : done ? '#52B788' : '#E8E0D0',
              transition: 'all 0.3s ease',
            }} />
            {i < 2 && <div style={{ width: 16, height: 1, background: '#E8E0D0' }} />}
          </div>
        )
      })}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   OTP INPUT — 6 individual boxes
───────────────────────────────────────────────────────────────────────────── */
function OtpInput({ value, onChange, disabled }) {
  const inputsRef = useRef([])
  const digits    = value.padEnd(6, ' ').split('').slice(0, 6)

  const handleKey = (e, i) => {
    const key = e.key

    if (key === 'Backspace') {
      e.preventDefault()
      const next = [...digits]
      if (next[i].trim()) {
        next[i] = ' '
        onChange(next.join('').trimEnd())
      } else if (i > 0) {
        next[i - 1] = ' '
        onChange(next.join('').trimEnd())
        inputsRef.current[i - 1]?.focus()
      }
      return
    }

    if (key === 'ArrowLeft'  && i > 0) { inputsRef.current[i - 1]?.focus(); return }
    if (key === 'ArrowRight' && i < 5) { inputsRef.current[i + 1]?.focus(); return }

    if (/^[0-9]$/.test(key)) {
      e.preventDefault()
      const next = [...digits]
      next[i] = key
      onChange(next.join('').trimEnd())
      if (i < 5) inputsRef.current[i + 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(pasted)
    const focusIdx = Math.min(pasted.length, 5)
    inputsRef.current[focusIdx]?.focus()
  }

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '8px 0' }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => inputsRef.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d.trim()}
          disabled={disabled}
          onKeyDown={e => handleKey(e, i)}
          onPaste={handlePaste}
          onChange={() => {}}  // controlled via onKeyDown
          onFocus={e => e.target.select()}
          style={{
            width: 48, height: 56, borderRadius: 12, textAlign: 'center',
            border: `1.5px solid ${d.trim() ? '#2D6A4F' : '#E8E0D0'}`,
            background: d.trim() ? 'rgba(45,106,79,0.05)' : '#fff',
            fontFamily: 'var(--font-body)', fontSize: 22, fontWeight: 700,
            color: '#26221C', outline: 'none',
            transition: 'border-color 0.15s, background 0.15s',
            caretColor: 'transparent',
          }}
          onFocusCapture={e => { e.target.style.borderColor = '#2D6A4F'; e.target.style.boxShadow = '0 0 0 3px rgba(45,106,79,0.1)' }}
          onBlurCapture={e  => { e.target.style.borderColor = d.trim() ? '#2D6A4F' : '#E8E0D0'; e.target.style.boxShadow = 'none' }}
        />
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────────────────── */
export default function ForgotPassword() {
  const navigate  = useNavigate()
  const wrapRef   = useRef(null)
  const panelRef  = useRef(null)
  const formRef   = useRef(null)

  // step: 0 = email, 1 = otp, 2 = new password, 3 = success
  const [step,       setStep]       = useState(0)
  const [email,      setEmail]      = useState('')
  const [emailErr,   setEmailErr]   = useState('')
  const [otp,        setOtp]        = useState('')
  const [otpErr,     setOtpErr]     = useState('')
  const [pw,         setPw]         = useState('')
  const [pwConfirm,  setPwConfirm]  = useState('')
  const [pwErr,      setPwErr]      = useState('')
  const [showPw,     setShowPw]     = useState(false)
  const [showPwC,    setShowPwC]    = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [countdown,  setCountdown]  = useState(0)  // resend cooldown

  // Page entrance
  useGSAP(() => {
    const tl = gsap.timeline()
    tl.fromTo(panelRef.current,
      { x: -40, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.7, ease: 'power3.out' }
    )
    tl.fromTo(formRef.current?.querySelectorAll('.form-row'),
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.08, duration: 0.5, ease: 'power3.out' },
      '-=0.4'
    )
  }, { scope: wrapRef })

  // Animate step transitions
  const animateStep = (newStep) => {
    gsap.fromTo(formRef.current,
      { x: 30, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.4, ease: 'power3.out',
        onStart: () => setStep(newStep) }
    )
  }

  const shakeForm = () => {
    gsap.fromTo(formRef.current,
      { x: -8 },
      { x: 0, duration: 0.45, ease: 'elastic.out(2.5,0.4)' }
    )
  }

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  /* ── STEP 0: Send OTP ── */
  const handleSendOtp = async () => {
    if (!email.trim())                      { setEmailErr('Email is required'); shakeForm(); return }
    if (!/\S+@\S+\.\S+/.test(email.trim())) { setEmailErr('Enter a valid email'); shakeForm(); return }

    setSubmitting(true)
    setEmailErr('')
    try {
      await authAPI.forgotPassword(email.trim().toLowerCase())
      // Always show success (server gives generic response to prevent enumeration)
      toast.success('OTP sent! Check your inbox.')
      setCountdown(60)
      animateStep(1)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send OTP. Try again.')
      shakeForm()
    } finally {
      setSubmitting(false)
    }
  }

  /* ── STEP 1: Resend OTP ── */
  const handleResend = async () => {
    if (countdown > 0) return
    setSubmitting(true)
    setOtpErr('')
    try {
      await authAPI.forgotPassword(email.trim().toLowerCase())
      toast.success('New OTP sent!')
      setCountdown(60)
      setOtp('')
    } catch {
      toast.error('Could not resend OTP. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  /* ── STEP 1: Verify OTP ── */
  const handleVerifyOtp = async () => {
    const clean = otp.replace(/\s/g, '')
    if (clean.length < 6) { setOtpErr('Enter all 6 digits'); shakeForm(); return }

    setSubmitting(true)
    setOtpErr('')
    // We don't have a verify-only endpoint — we verify during reset.
    // Just advance to step 2 and validate OTP on final submit.
    setSubmitting(false)
    animateStep(2)
  }

  /* ── STEP 2: Reset password ── */
  const handleReset = async () => {
    if (pw.length < 6)     { setPwErr('Password must be at least 6 characters'); shakeForm(); return }
    if (pw !== pwConfirm)  { setPwErr('Passwords do not match'); shakeForm(); return }

    setSubmitting(true)
    setPwErr('')
    try {
      await authAPI.resetPassword(email.trim().toLowerCase(), otp.replace(/\s/g, ''), pw)
      animateStep(3)
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to reset password. Try again.'
      setPwErr(msg)
      // If OTP was wrong/expired, send back to OTP step
      if (msg.toLowerCase().includes('otp') || msg.toLowerCase().includes('expired')) {
        toast.error(msg)
        setOtp('')
        setTimeout(() => animateStep(1), 400)
      } else {
        shakeForm()
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key !== 'Enter') return
    if (step === 0) handleSendOtp()
    if (step === 1) handleVerifyOtp()
    if (step === 2) handleReset()
  }

  /* ── Spinner ── */
  const Spinner = () => (
    <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
  )

  return (
    <div ref={wrapRef} style={{ minHeight: '100vh', display: 'flex', background: '#FAFAF7' }}>

      {/* ── Left panel ── */}
      <div ref={panelRef}
        className="hidden lg:flex lg:w-[42%] xl:w-[45%]"
        style={{ position: 'relative', overflow: 'hidden', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <PanelBg />
        <div style={{ position: 'relative', zIndex: 10, maxWidth: 320, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 20, background: 'rgba(253,246,236,0.12)', border: '1px solid rgba(253,246,236,0.18)', marginBottom: 28, color: 'rgba(253,246,236,0.9)' }}>
            <IconLeaf />
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', color: '#FDF6EC', fontSize: 26, lineHeight: 1.25, marginBottom: 16 }}>
            Reset your<br/>
            <span style={{ color: '#E9B87A' }}>Varnam Account</span>
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(253,246,236,0.55)', fontSize: 14, lineHeight: 1.7, marginBottom: 36 }}>
            We'll send a one-time code to your email. It's valid for 10 minutes.
          </p>
          {[
            'Enter your registered email',
            'Get a 6-digit OTP instantly',
            'Set a new password securely',
          ].map((t, i) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, textAlign: 'left' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(82,183,136,0.2)', border: '1px solid rgba(82,183,136,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, color: '#52B788' }}>{i + 1}</span>
              </div>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(253,246,236,0.7)' }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: form ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(32px,5vw,48px) 20px' }}>
        <div ref={formRef} style={{ width: '100%', maxWidth: 420 }} onKeyDown={handleKeyDown}>

          {/* Mobile logo */}
          <div className="lg:hidden" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#2D6A4F', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <IconLeaf />
            </div>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 18, color: '#2D6A4F' }}>Varnam Naturals</span>
          </div>

          {/* Step dots */}
          {step < 3 && <div className="form-row"><StepDots current={step} /></div>}

          {/* ── STEP 0: Email ── */}
          {step === 0 && (
            <>
              <div className="form-row" style={{ marginBottom: 28 }}>
                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, color: '#26221C', margin: '0 0 6px' }}>Forgot Password?</h1>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#7A7265', margin: 0 }}>
                  Enter your registered email and we'll send you a 6-digit OTP.
                </p>
              </div>

              <div className="form-row" style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: '#3D3830', marginBottom: 6 }}>
                  Email address
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#A89F8C', pointerEvents: 'none' }}>
                    <IconMail />
                  </span>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setEmailErr('') }}
                    disabled={submitting}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '13px 14px 13px 42px', borderRadius: 12,
                      border: `1.5px solid ${emailErr ? '#DC2626' : '#E8E0D0'}`,
                      background: '#fff', fontFamily: 'var(--font-body)', fontSize: 14,
                      color: '#26221C', outline: 'none', transition: 'border-color 0.2s',
                    }}
                    onFocus={e => { if (!emailErr) e.target.style.borderColor = '#2D6A4F' }}
                    onBlur={e  => { if (!emailErr) e.target.style.borderColor = '#E8E0D0' }}
                  />
                </div>
                {emailErr && <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#DC2626', marginTop: 4 }}>{emailErr}</p>}
              </div>

              <div className="form-row" style={{ marginBottom: 24 }}>
                <button onClick={handleSendOtp} disabled={submitting}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 24px', borderRadius: 13, border: 'none', background: submitting ? '#52B788' : '#2D6A4F', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', transition: 'background 0.2s', boxShadow: '0 4px 16px rgba(45,106,79,0.25)' }}>
                  {submitting ? <><Spinner /> Sending…</> : 'Send OTP'}
                </button>
              </div>

              <div className="form-row" style={{ textAlign: 'center' }}>
                <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 13, color: '#7A7265', textDecoration: 'none' }}>
                  <IconArrow /> Back to Sign In
                </Link>
              </div>
            </>
          )}

          {/* ── STEP 1: OTP ── */}
          {step === 1 && (
            <>
              <div className="form-row" style={{ marginBottom: 28 }}>
                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, color: '#26221C', margin: '0 0 6px' }}>Enter OTP</h1>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#7A7265', margin: 0, lineHeight: 1.6 }}>
                  We sent a 6-digit code to <strong style={{ color: '#26221C' }}>{email}</strong>.
                  Check your inbox (and spam folder).
                </p>
              </div>

              <div className="form-row" style={{ marginBottom: 8 }}>
                <OtpInput value={otp} onChange={setOtp} disabled={submitting} />
                {otpErr && <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#DC2626', marginTop: 8, textAlign: 'center' }}>{otpErr}</p>}
              </div>

              {/* Resend */}
              <div className="form-row" style={{ textAlign: 'center', marginBottom: 24 }}>
                <button onClick={handleResend} disabled={countdown > 0 || submitting}
                  style={{ background: 'none', border: 'none', cursor: countdown > 0 ? 'default' : 'pointer', fontFamily: 'var(--font-body)', fontSize: 13, color: countdown > 0 ? '#A89F8C' : '#2D6A4F', padding: 0 }}>
                  {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                </button>
              </div>

              <div className="form-row" style={{ marginBottom: 16 }}>
                <button onClick={handleVerifyOtp} disabled={submitting || otp.replace(/\s/g,'').length < 6}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 24px', borderRadius: 13, border: 'none', background: otp.replace(/\s/g,'').length < 6 ? '#C5D9D0' : '#2D6A4F', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600, cursor: otp.replace(/\s/g,'').length < 6 ? 'not-allowed' : 'pointer', transition: 'background 0.2s', boxShadow: otp.replace(/\s/g,'').length >= 6 ? '0 4px 16px rgba(45,106,79,0.25)' : 'none' }}>
                  {submitting ? <><Spinner /> Verifying…</> : 'Verify Code'}
                </button>
              </div>

              <div className="form-row" style={{ textAlign: 'center' }}>
                <button onClick={() => { setStep(0); setOtp('') }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 13, color: '#7A7265' }}>
                  <IconArrow /> Change email
                </button>
              </div>
            </>
          )}

          {/* ── STEP 2: New password ── */}
          {step === 2 && (
            <>
              <div className="form-row" style={{ marginBottom: 28 }}>
                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, color: '#26221C', margin: '0 0 6px' }}>New Password</h1>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#7A7265', margin: 0 }}>
                  Choose a strong password. Minimum 6 characters.
                </p>
              </div>

              {/* New password */}
              <div className="form-row" style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: '#3D3830', marginBottom: 6 }}>
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#A89F8C', pointerEvents: 'none' }}>
                    <IconLock />
                  </span>
                  <input
                    type={showPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={pw}
                    onChange={e => { setPw(e.target.value); setPwErr('') }}
                    disabled={submitting}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '13px 42px 13px 42px', borderRadius: 12, border: `1.5px solid ${pwErr ? '#DC2626' : '#E8E0D0'}`, background: '#fff', fontFamily: 'var(--font-body)', fontSize: 14, color: '#26221C', outline: 'none', transition: 'border-color 0.2s' }}
                    onFocus={e => { if (!pwErr) e.target.style.borderColor = '#2D6A4F' }}
                    onBlur={e  => { if (!pwErr) e.target.style.borderColor = '#E8E0D0' }}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#A89F8C', padding: 4 }}>
                    <IconEye off={showPw} />
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div className="form-row" style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: '#3D3830', marginBottom: 6 }}>
                  Confirm Password
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#A89F8C', pointerEvents: 'none' }}>
                    <IconLock />
                  </span>
                  <input
                    type={showPwC ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={pwConfirm}
                    onChange={e => { setPwConfirm(e.target.value); setPwErr('') }}
                    disabled={submitting}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '13px 42px 13px 42px', borderRadius: 12, border: `1.5px solid ${pwErr ? '#DC2626' : '#E8E0D0'}`, background: '#fff', fontFamily: 'var(--font-body)', fontSize: 14, color: '#26221C', outline: 'none', transition: 'border-color 0.2s' }}
                    onFocus={e => { if (!pwErr) e.target.style.borderColor = '#2D6A4F' }}
                    onBlur={e  => { if (!pwErr) e.target.style.borderColor = '#E8E0D0' }}
                  />
                  <button type="button" onClick={() => setShowPwC(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#A89F8C', padding: 4 }}>
                    <IconEye off={showPwC} />
                  </button>
                </div>
                {pwErr && <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#DC2626', marginTop: 6 }}>{pwErr}</p>}
              </div>

              <div className="form-row" style={{ marginBottom: 16 }}>
                <button onClick={handleReset} disabled={submitting}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 24px', borderRadius: 13, border: 'none', background: submitting ? '#52B788' : '#2D6A4F', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px rgba(45,106,79,0.25)', transition: 'background 0.2s' }}>
                  {submitting ? <><Spinner /> Resetting…</> : 'Reset Password'}
                </button>
              </div>

              <div className="form-row" style={{ textAlign: 'center' }}>
                <button onClick={() => { setStep(1); setPwErr('') }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 13, color: '#7A7265' }}>
                  <IconArrow /> Back
                </button>
              </div>
            </>
          )}

          {/* ── STEP 3: Success ── */}
          {step === 3 && (
            <div className="form-row" style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(45,106,79,0.09)', border: '2px solid rgba(45,106,79,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <IconCheck />
              </div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, color: '#26221C', margin: '0 0 10px' }}>
                Password Reset!
              </h1>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#7A7265', margin: '0 0 32px', lineHeight: 1.7 }}>
                Your password has been changed successfully.<br/>
                You can now sign in with your new password.
              </p>
              <button onClick={() => navigate('/login')}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 32px', borderRadius: 13, border: 'none', background: '#2D6A4F', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 16px rgba(45,106,79,0.25)' }}>
                Go to Sign In
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 1023px) {
          .hidden.lg\\:flex { display: none !important; }
        }
      `}</style>
    </div>
  )
}