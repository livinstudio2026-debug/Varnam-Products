// src/pages/Register.jsx
// Flow: Fill form → Send OTP → Verify OTP → Account created + logged in

import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { gsap }         from 'gsap'
import { useGSAP }      from '@gsap/react'
import toast            from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { authAPI }      from '../services/api'
import Input            from '../components/ui/Input'

/* ── Icons ── */
const IconEmail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)
const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)
const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)
const IconPhone = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l1.27-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
)
const IconEye = ({ off }) => off ? (
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
const IconLeaf = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
  </svg>
)

function VarnamLogo({ className = '', style = {} }) {
  return (
    <svg
      viewBox="0 0 140 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="Varnam Naturals"
    >
      <path d="M8 32 C8 20 16 10 28 8 C26 20 18 28 8 32Z" fill="#2D6A4F" />
      <path d="M28 8 C28 20 22 30 12 34 C16 26 22 18 28 8Z" fill="#52B788" opacity="0.7" />
      <line x1="14" y1="34" x2="26" y2="10" stroke="#2D6A4F" strokeWidth="0.8" opacity="0.4" />
      <text x="36" y="25" fontFamily="'Playfair Display', Georgia, serif" fontSize="19" fontWeight="700" fill="#2D6A4F" letterSpacing="-0.4">varnam</text>
      <text x="37" y="35" fontFamily="'DM Sans', system-ui, sans-serif" fontSize="7" fontWeight="400" fill="#C8893A" letterSpacing="3.2">NATURALS</text>
    </svg>
  )
}
const IconArrow = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
)

/* ── Password strength meter ── */
function StrengthMeter({ password }) {
  const getStrength = (pw) => {
    if (!pw) return 0
    let s = 0
    if (pw.length >= 8)           s++
    if (/[A-Z]/.test(pw))         s++
    if (/[0-9]/.test(pw))         s++
    if (/[^A-Za-z0-9]/.test(pw))  s++
    return s
  }
  const strength = getStrength(password)
  const labels   = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const colors   = ['#E8E0D0', '#EF4444', '#F59E0B', '#10B981', '#059669']
  if (!password) return null
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= strength ? colors[strength] : '#E8E0D0', transition: 'background 0.3s' }} />
        ))}
      </div>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: colors[strength], margin: 0 }}>{labels[strength]}</p>
    </div>
  )
}

/* ── Decorative panel ── */
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
          <pattern id="rp-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="#FDF6EC"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#rp-dots)"/>
      </svg>
    </div>
  )
}

/* ── Step dots ── */
function StepDots({ current }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 28 }}>
      {['Details', 'Verify', 'Done'].map((label, i) => {
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

/* ── OTP Input — 6 boxes — defined outside to prevent remount ── */
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
    inputsRef.current[Math.min(pasted.length, 5)]?.focus()
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
          onChange={() => {}}
          onFocus={e => e.target.select()}
          style={{
            width: 46, height: 54, borderRadius: 12, textAlign: 'center',
            border: `1.5px solid ${d.trim() ? '#2D6A4F' : '#E8E0D0'}`,
            background: d.trim() ? 'rgba(45,106,79,0.05)' : '#fff',
            fontFamily: 'var(--font-body)', fontSize: 22, fontWeight: 700,
            color: '#26221C', outline: 'none', caretColor: 'transparent',
            transition: 'border-color 0.15s, background 0.15s',
          }}
          onFocusCapture={e => { e.target.style.borderColor = '#2D6A4F'; e.target.style.boxShadow = '0 0 0 3px rgba(45,106,79,0.1)' }}
          onBlurCapture={e  => { e.target.style.borderColor = d.trim() ? '#2D6A4F' : '#E8E0D0'; e.target.style.boxShadow = 'none' }}
        />
      ))}
    </div>
  )
}

/* ── PwField — defined outside Register to prevent remount ── */
function PwField({ fieldName, label, show, toggle, autoComplete, value, onChange, error, disabled, password }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 14, fontFamily: 'var(--font-body)', fontWeight: 500, color: '#3D3830', marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#A89F8C', pointerEvents: 'none' }}>
          <IconLock />
        </span>
        <input
          name={fieldName}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder="••••••••"
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`input pl-10 pr-11 ${error ? 'border-red-400' : ''}`}
          style={{ width: '100%' }}
        />
        <button type="button" onClick={toggle}
          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#A89F8C', padding: 4 }}>
          <IconEye off={show} />
        </button>
      </div>
      {error && <p style={{ fontSize: 12, color: '#DC2626', marginTop: 4, fontFamily: 'var(--font-body)' }}>{error}</p>}
      {fieldName === 'password' && <StrengthMeter password={password} />}
    </div>
  )
}

/* ── Spinner ── */
const Spinner = () => (
  <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
)

/* ────────────────────────────────────────────────────────────────────────────
   MAIN
──────────────────────────────────────────────────────────────────────────── */
export default function Register() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { register: registerUser, isAuthenticated, loading: authLoading } = useAuthStore()

  // step 0 = form details, step 1 = OTP, step 2 = success (briefly shown, then redirect)
  const [step,       setStep]       = useState(0)
  const [form,       setForm]       = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [errors,     setErrors]     = useState({})
  const [otp,        setOtp]        = useState('')
  const [otpErr,     setOtpErr]     = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [countdown,  setCountdown]  = useState(0)
  const [showPw,     setShowPw]     = useState(false)
  const [showCPw,    setShowCPw]    = useState(false)

  const from     = location.state?.from?.pathname || '/'
  const wrapRef  = useRef(null)
  const panelRef = useRef(null)
  const formRef  = useRef(null)

  useEffect(() => {
    if (!authLoading && isAuthenticated) navigate(from, { replace: true })
  }, [isAuthenticated, authLoading, navigate, from])

  // Countdown for resend
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  useGSAP(() => {
    const tl = gsap.timeline()
    tl.fromTo(panelRef.current,
      { x: -40, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.7, ease: 'power3.out' }
    )
    tl.fromTo(formRef.current?.querySelectorAll('.form-row'),
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.06, duration: 0.45, ease: 'power3.out' },
      '-=0.4'
    )
  }, { scope: wrapRef })

  const animateStep = (newStep) => {
    gsap.fromTo(formRef.current,
      { x: 28, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.38, ease: 'power3.out',
        onStart: () => setStep(newStep) }
    )
  }

  const shakeForm = () => {
    gsap.fromTo(formRef.current, { x: -8 }, { x: 0, duration: 0.4, ease: 'elastic.out(2,0.4)' })
  }

  /* ── Validation ── */
  const validate = () => {
    const e = {}
    if (!form.name.trim())                                          e.name     = 'Full name is required'
    else if (form.name.trim().length < 2)                           e.name     = 'Name must be at least 2 characters'
    if (!form.email.trim())                                         e.email    = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email))                     e.email    = 'Enter a valid email'
    if (!form.phone.trim())                                         e.phone    = 'Phone number is required'
    else if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\s/g, ''))) e.phone    = 'Enter a valid 10-digit Indian mobile number'
    if (!form.password)                                             e.password = 'Password is required'
    else if (form.password.length < 6)                             e.password = 'Minimum 6 characters'
    if (!form.confirm)                                              e.confirm  = 'Please confirm your password'
    else if (form.confirm !== form.password)                        e.confirm  = 'Passwords do not match'
    return e
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (errors[name]) setErrors(err => ({ ...err, [name]: '' }))
  }

  /* ── STEP 0: validate form then send OTP ── */
  const handleSendOtp = async (e) => {
    e?.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); shakeForm(); return }

    setSubmitting(true)
    try {
      await authAPI.sendRegisterOtp(form.email.trim().toLowerCase())
      toast.success('OTP sent! Check your inbox.')
      setCountdown(60)
      animateStep(1)
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to send OTP. Try again.'
      // If email already exists, show it on the email field
      if (msg.toLowerCase().includes('already exists')) {
        setErrors(prev => ({ ...prev, email: msg }))
      } else {
        toast.error(msg)
      }
      shakeForm()
    } finally {
      setSubmitting(false)
    }
  }

  /* ── Resend OTP ── */
  const handleResend = async () => {
    if (countdown > 0) return
    setSubmitting(true)
    setOtpErr('')
    try {
      await authAPI.sendRegisterOtp(form.email.trim().toLowerCase())
      toast.success('New OTP sent!')
      setCountdown(60)
      setOtp('')
    } catch {
      toast.error('Could not resend. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  /* ── STEP 1: verify OTP then register ── */
  const handleVerifyAndRegister = async () => {
    const clean = otp.replace(/\s/g, '')
    if (clean.length < 6) { setOtpErr('Enter all 6 digits'); shakeForm(); return }

    setSubmitting(true)
    setOtpErr('')
    try {
      // 1. Verify OTP
      await authAPI.verifyRegisterOtp(form.email.trim().toLowerCase(), clean)

      // 2. Create account
      await registerUser({
        name:     form.name.trim(),
        email:    form.email.trim().toLowerCase(),
        phone:    form.phone.replace(/\s/g, ''),
        password: form.password,
      })

      toast.success('Account created! Welcome to Varnam 🌿')
      navigate(from, { replace: true })
    } catch (err) {
      const msg = err?.response?.data?.message || 'Verification failed. Try again.'
      setOtpErr(msg)
      // If OTP expired, send back to step 0
      if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('no otp')) {
        toast.error(msg)
        setOtp('')
        setTimeout(() => animateStep(0), 400)
      } else {
        shakeForm()
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div ref={wrapRef} style={{ minHeight: '100vh', display: 'flex', background: '#FAFAF7' }}>

      {/* Left panel — FIX: removed display:'flex' from inline style so Tailwind's 'hidden' works on mobile */}
      <div ref={panelRef}
        className="hidden lg:flex lg:w-[38%] xl:w-[40%]"
        style={{ position: 'relative', overflow: 'hidden', flexShrink: 0, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <PanelBg />
        <div style={{ position: 'relative', zIndex: 10, maxWidth: 320, textAlign: 'center' }}>
          <Link to="/" style={{ display: 'inline-block', marginBottom: 28 }}>
            <VarnamLogo style={{ height: 44, width: 'auto', filter: 'brightness(0) invert(1)' }} />
          </Link>
          <h2 style={{ fontFamily: 'var(--font-heading)', color: '#FDF6EC', fontSize: 26, lineHeight: 1.25, marginBottom: 16 }}>
            Join the Varnam<br/>
            <span style={{ color: '#E9B87A' }}>Natural Family</span>
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(253,246,236,0.6)', fontSize: 13, lineHeight: 1.7, marginBottom: 32 }}>
            Create your free account and get access to 100% organic products with fast delivery across India.
          </p>
          {[
            { n: '1', t: 'Fill in your details' },
            { n: '2', t: 'Verify your email with OTP' },
            { n: '3', t: 'Start shopping instantly' },
          ].map(({ n, t }) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, textAlign: 'left' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(82,183,136,0.2)', border: '1px solid rgba(82,183,136,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, color: '#52B788' }}>{n}</span>
              </div>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(253,246,236,0.7)' }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: form */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(32px,5vw,48px) 20px' }}>
        <div ref={formRef} style={{ width: '100%', maxWidth: 440 }}>

          {/* Mobile logo */}
          <div className="lg:hidden" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
            <Link to="/">
              <VarnamLogo style={{ height: 32, width: 'auto' }} />
            </Link>
          </div>

          {/* Step dots */}
          <div className="form-row"><StepDots current={step} /></div>

          {/* ── STEP 0: Form ── */}
          {step === 0 && (
            <form onSubmit={handleSendOtp} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div className="form-row" style={{ marginBottom: 4 }}>
                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, color: '#26221C', margin: '0 0 4px' }}>Create Account</h1>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#7A7265', margin: 0 }}>
                  Already have an account?{' '}
                  <Link to="/login" state={{ from: location.state?.from }} style={{ color: '#2D6A4F', fontWeight: 500, textDecoration: 'none' }}>
                    Sign in
                  </Link>
                </p>
              </div>

              <div className="form-row">
                <Input label="Full name" id="name" name="name" type="text" autoComplete="name"
                  placeholder="Your full name" value={form.name} onChange={handleChange}
                  error={errors.name} icon={<IconUser />} disabled={submitting} />
              </div>

              <div className="form-row">
                <Input label="Email address" id="email" name="email" type="email" autoComplete="email"
                  placeholder="you@example.com" value={form.email} onChange={handleChange}
                  error={errors.email} icon={<IconEmail />} disabled={submitting} />
              </div>

              <div className="form-row">
                <Input label="Mobile number" id="phone" name="phone" type="tel" autoComplete="tel"
                  placeholder="10-digit mobile number" value={form.phone} onChange={handleChange}
                  error={errors.phone} icon={<IconPhone />} disabled={submitting} />
              </div>

              <div className="form-row">
                <PwField fieldName="password" label="Password"
                  show={showPw} toggle={() => setShowPw(v => !v)} autoComplete="new-password"
                  value={form.password} onChange={handleChange}
                  error={errors.password} disabled={submitting} password={form.password} />
              </div>

              <div className="form-row">
                <PwField fieldName="confirm" label="Confirm password"
                  show={showCPw} toggle={() => setShowCPw(v => !v)} autoComplete="new-password"
                  value={form.confirm} onChange={handleChange}
                  error={errors.confirm} disabled={submitting} password={form.password} />
              </div>

              <p className="form-row" style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#A89F8C', lineHeight: 1.6, margin: 0 }}>
                By creating an account you agree to our{' '}
                <span style={{ color: '#2D6A4F' }}>Terms of Service</span> and{' '}
                <span style={{ color: '#2D6A4F' }}>Privacy Policy</span>.
              </p>

              <div className="form-row">
                <button type="submit" disabled={submitting}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 24px', borderRadius: 14, border: 'none', background: submitting ? '#52B788' : '#2D6A4F', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px rgba(45,106,79,0.25)', transition: 'background 0.2s' }}>
                  {submitting ? <><Spinner /> Sending OTP…</> : 'Continue — Verify Email'}
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 1: OTP ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="form-row">
                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, color: '#26221C', margin: '0 0 6px' }}>Verify Your Email</h1>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#7A7265', margin: 0, lineHeight: 1.6 }}>
                  We sent a 6-digit code to{' '}
                  <strong style={{ color: '#26221C' }}>{form.email}</strong>.
                  Check your inbox and spam folder.
                </p>
              </div>

              <div className="form-row">
                <OtpInput value={otp} onChange={setOtp} disabled={submitting} />
                {otpErr && (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#DC2626', marginTop: 8, textAlign: 'center' }}>
                    {otpErr}
                  </p>
                )}
              </div>

              {/* Resend */}
              <div className="form-row" style={{ textAlign: 'center' }}>
                <button onClick={handleResend} disabled={countdown > 0 || submitting}
                  style={{ background: 'none', border: 'none', cursor: countdown > 0 ? 'default' : 'pointer', fontFamily: 'var(--font-body)', fontSize: 13, color: countdown > 0 ? '#A89F8C' : '#2D6A4F', padding: 0 }}>
                  {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                </button>
              </div>

              <div className="form-row">
                <button
                  onClick={handleVerifyAndRegister}
                  disabled={submitting || otp.replace(/\s/g,'').length < 6}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '13px 24px', borderRadius: 14, border: 'none',
                    background: otp.replace(/\s/g,'').length < 6 ? '#C5D9D0' : '#2D6A4F',
                    color: '#fff', fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600,
                    cursor: otp.replace(/\s/g,'').length < 6 ? 'not-allowed' : 'pointer',
                    boxShadow: otp.replace(/\s/g,'').length >= 6 ? '0 4px 16px rgba(45,106,79,0.25)' : 'none',
                    transition: 'all 0.2s',
                  }}>
                  {submitting ? <><Spinner /> Creating account…</> : 'Verify & Create Account'}
                </button>
              </div>

              <div className="form-row" style={{ textAlign: 'center' }}>
                <button onClick={() => { animateStep(0); setOtp(''); setOtpErr('') }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 13, color: '#7A7265' }}>
                  <IconArrow /> Edit details
                </button>
              </div>
            </div>
          )}

          {/* Sign in link (shown on step 0 bottom) */}
          {step === 0 && (
            <div className="form-row" style={{ marginTop: 22, textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1, height: 1, background: '#E8E0D0' }} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#A89F8C' }}>Have an account?</span>
                <div style={{ flex: 1, height: 1, background: '#E8E0D0' }} />
              </div>
              <Link to="/login" state={{ from: location.state?.from }}
                style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, color: '#2D6A4F', padding: '12px 24px', borderRadius: 14, border: '1.5px solid rgba(45,106,79,0.3)', textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(45,106,79,0.05)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                Sign in instead
              </Link>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
