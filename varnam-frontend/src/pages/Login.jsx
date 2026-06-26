// src/pages/Login.jsx
import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import Input from '../components/ui/Input'

/* ── icons ── */
const IconEmail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
)
const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)
const IconEye = ({ off }) => off ? (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
) : (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)
const IconLeaf = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
)

function VarnamLogo({ className = '' }) {
  return (
    <svg
      viewBox="0 0 140 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
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

/* ── decorative leaf SVG for panel ── */
function PanelBg() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {/* base gradient */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(145deg,#1B4332 0%,#2D6A4F 50%,#40916C 100%)' }} />
      {/* large leaf BL */}
      <svg viewBox="0 0 300 300" fill="none" style={{ position: 'absolute', bottom: -60, left: -60, width: 320, height: 320, opacity: 0.12 }}>
        <path d="M30 270 C30 120 150 15 285 7 C270 150 165 248 30 270Z" fill="#95D5B2" />
      </svg>
      {/* small leaf TR */}
      <svg viewBox="0 0 200 200" fill="none" style={{ position: 'absolute', top: -30, right: -30, width: 200, height: 200, opacity: 0.08, transform: 'rotate(160deg)' }}>
        <path d="M20 180 C20 80 100 10 190 5 C180 100 110 165 20 180Z" fill="#D8F3DC" />
      </svg>
      {/* radial glow */}
      <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', width: '80%', height: '50%', background: 'radial-gradient(ellipse,rgba(82,183,136,0.18) 0%,transparent 70%)' }} />
      {/* dots pattern */}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.06 }}>
        <defs>
          <pattern id="lp-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="#FDF6EC" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#lp-dots)" />
      </svg>
    </div>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated, loading: authLoading } = useAuthStore()

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [showPw, setShowPw] = useState(false)

  // redirect destination after login
  const from = location.state?.from?.pathname || '/'

  // If already logged in, redirect away
  useEffect(() => {
    if (!authLoading && isAuthenticated) navigate(from, { replace: true })
  }, [isAuthenticated, authLoading, navigate, from])

  const wrapRef = useRef(null)
  const panelRef = useRef(null)
  const formRef = useRef(null)

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

  const validate = () => {
    const e = {}
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters'
    return e
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (errors[name]) setErrors(err => ({ ...err, [name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }

    setSubmitting(true)
    try {
      await login({ email: form.email.trim().toLowerCase(), password: form.password })
      toast.success('Welcome back!')
      navigate(from, { replace: true })
    } catch (err) {
      const msg = err?.response?.data?.message || 'Login failed. Please try again.'
      toast.error(msg)
      // Shake the form
      gsap.fromTo(formRef.current,
        { x: -8 },
        { x: 0, duration: 0.4, ease: 'elastic.out(2, 0.4)' }
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div ref={wrapRef}
      className="min-h-screen flex"
      style={{ background: '#FAFAF7' }}>

      {/* ── Left decorative panel (hidden on mobile) ── */}
      <div ref={panelRef}
        className="hidden lg:flex lg:w-[42%] xl:w-[45%] relative flex-col items-center justify-center p-12"
        style={{ position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <PanelBg />
        <div style={{ position: 'relative', zIndex: 10, maxWidth: 340, textAlign: 'center' }}>
          {/* Logo mark */}
          <Link to="/" style={{ display: 'inline-block', marginBottom: 28 }}>
            <VarnamLogo style={{ height: 44, width: 'auto', filter: 'brightness(0) invert(1)' }} />
          </Link>
          <h2 style={{ fontFamily: 'var(--font-heading)', color: '#FDF6EC', fontSize: 28, lineHeight: 1.25, marginBottom: 16 }}>
            Welcome back to<br />
            <span style={{ color: '#E9B87A' }}>Varnam Naturals</span>
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(253,246,236,0.6)', fontSize: 14, lineHeight: 1.7, marginBottom: 36 }}>
            Sign in to track your orders, manage your account, and enjoy a personalised experience.
          </p>
          {/* Trust badges */}
          {['100% Organic Products', 'Secure Checkout', 'Free Shipping ₹499+'].map((t) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, textAlign: 'left' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(82,183,136,0.2)', border: '1px solid rgba(82,183,136,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#52B788" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(253,246,236,0.7)' }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-12 sm:px-10">
        <div ref={formRef} className="w-full" style={{ maxWidth: 420 }}>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Link to="/">
              <VarnamLogo style={{ height: 32, width: 'auto' }} />
            </Link>
          </div>

          {/* Heading */}
          <div className="form-row" style={{ marginBottom: 32 }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 26, color: '#26221C', marginBottom: 6 }}>Sign In</h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#7A7265' }}>
              Don't have an account?{' '}
              <Link to="/register" state={{ from: location.state?.from }}
                style={{ color: '#2D6A4F', fontWeight: 500, textDecoration: 'none' }}>
                Create one free
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

            {/* Email */}
            <div className="form-row" style={{ marginBottom: 18 }}>
              <Input
                label="Email address"
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                error={errors.email}
                icon={<IconEmail />}
                disabled={submitting}
              />
            </div>

            {/* Password */}
            <div className="form-row" style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: 14, fontFamily: 'var(--font-body)', fontWeight: 500, color: '#3D3830', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#A89F8C', pointerEvents: 'none', zIndex: 1 }}>
                  <IconLock />
                </span>
                <input
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  disabled={submitting}
                  style={{ width: '100%' }}
                  className={`input pl-10 pr-11 ${errors.password ? 'border-red-400 focus:border-red-500' : ''}`}
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#A89F8C', padding: 4 }}>
                  <IconEye off={showPw} />
                </button>
              </div>
              {errors.password && <p style={{ fontSize: 12, color: '#DC2626', marginTop: 4, fontFamily: 'var(--font-body)' }}>{errors.password}</p>}
            </div>

            {/* Forgot password link */}
            <div className="form-row" style={{ textAlign: 'right', marginBottom: 28 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#7A7265' }}>
                {/* placeholder — no forgot-password page yet */}
                <Link to="/forgot-password" style={{ color: '#2D6A4F', fontWeight: 500, textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </span>
            </div>

            {/* Submit */}
            <div className="form-row">
              <button type="submit" disabled={submitting}
                className="btn-primary w-full"
                style={{ fontSize: 15, padding: '13px 24px', borderRadius: 14, gap: 8 }}>
                {submitting ? (
                  <>
                    <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                    Signing in…
                  </>
                ) : 'Sign In'}
              </button>
            </div>
          </form>

          {/* Divider + register CTA (mobile friendly) */}
          <div className="form-row" style={{ marginTop: 28, textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: '#E8E0D0' }} />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#A89F8C' }}>New to Varnam?</span>
              <div style={{ flex: 1, height: 1, background: '#E8E0D0' }} />
            </div>
            <Link to="/register" state={{ from: location.state?.from }}
              style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, color: '#2D6A4F', textAlign: 'center', padding: '12px 24px', borderRadius: 14, border: '1.5px solid rgba(45,106,79,0.3)', textDecoration: 'none', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(45,106,79,0.05)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
              Create a free account
            </Link>
          </div>

          {/* Admin login — subtle, not for customers */}
          <div className="form-row" style={{ marginTop: 32, textAlign: 'center' }}>
            <Link to="/admin/login"
              style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#C4B9A8', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#A89F8C'}
              onMouseLeave={e => e.currentTarget.style.color = '#C4B9A8'}>
              Are you an admin?
            </Link>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
