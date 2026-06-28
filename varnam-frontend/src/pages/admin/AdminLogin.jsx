// src/pages/admin/AdminLogin.jsx

import { useState, useRef } from 'react'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { getErrorMessage } from '../../services/api'

const EyeIcon = ({ open }) => open ? (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
) : (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
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

export default function AdminLogin() {
  const navigate  = useNavigate()
  const { adminLogin, isAuthenticated, isAdmin, loading: authLoading } = useAuthStore()

  const [form,    setForm]    = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const cardRef = useRef(null)
  const shakeRef = useRef(null)

  useGSAP(() => {
    gsap.fromTo(cardRef.current,
      { y: 32, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out' }
    )
  }, { scope: cardRef })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    try {
      await adminLogin({ email: form.email.trim(), password: form.password })
      toast.success('Welcome back, Admin')
      navigate('/admin', { replace: true })
    } catch (err) {
      toast.error(getErrorMessage(err))
      // Shake animation on error
      gsap.fromTo(shakeRef.current,
        { x: 0 },
        { x: [-10, 10, -8, 8, -4, 4, 0], duration: 0.5, ease: 'none' }
      )
    } finally {
      setLoading(false)
    }
  }

  // All hooks declared — now safe to redirect
  if (!authLoading && isAuthenticated && isAdmin) {
    return <Navigate to="/admin" replace />
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0F2419 0%, #1B4332 50%, #2D6A4F 100%)',
      padding: '24px',
    }}>
      {/* Background orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -120, right: -120, width: 480, height: 480, borderRadius: '50%', background: 'rgba(82,183,136,0.07)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(200,137,58,0.06)', filter: 'blur(60px)' }} />
      </div>

      <div ref={cardRef} style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 10 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-block', marginBottom: 16 }}>
            <VarnamLogo style={{ height: 40, width: 'auto', filter: 'brightness(0) invert(1)' }} />
          </Link>
          <h1 style={{ fontFamily: 'var(--font-heading)', color: '#FDF6EC', fontSize: 22, margin: '0 0 4px' }}>
            Varnam Admin
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(253,246,236,0.45)', fontSize: 13, margin: 0 }}>
            Sign in to manage your store
          </p>
        </div>

        {/* Card */}
        <div ref={shakeRef} style={{
          background: 'rgba(255,255,255,0.97)',
          borderRadius: 24, padding: '32px 32px 28px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.2)',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Email */}
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: '#3D3830', marginBottom: 7 }}>
                Email address
              </label>
              <input
                type="email" required autoComplete="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="admin@varnamnaturals.com"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #E8E0D0', fontFamily: 'var(--font-body)', fontSize: 14, color: '#26221C', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s', background: '#FAFAF7' }}
                onFocus={e => e.target.style.borderColor = '#2D6A4F'}
                onBlur={e  => e.target.style.borderColor = '#E8E0D0'}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: '#3D3830', marginBottom: 7 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPwd ? 'text' : 'password'} required autoComplete="current-password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Enter your password"
                  style={{ width: '100%', padding: '12px 44px 12px 14px', borderRadius: 12, border: '1.5px solid #E8E0D0', fontFamily: 'var(--font-body)', fontSize: 14, color: '#26221C', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s', background: '#FAFAF7' }}
                  onFocus={e => e.target.style.borderColor = '#2D6A4F'}
                  onBlur={e  => e.target.style.borderColor = '#E8E0D0'}
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#A89F8C', display: 'flex', padding: 4 }}>
                  <EyeIcon open={showPwd} />
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: '13px', borderRadius: 13, border: 'none',
                background: loading ? '#52B788' : 'linear-gradient(135deg,#2D6A4F,#1B4332)',
                color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 6px 24px rgba(45,106,79,0.3)', marginTop: 4,
                transition: 'opacity 0.2s',
              }}>
              {loading && (
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} />
              )}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(253,246,236,0.35)', marginTop: 20 }}>
          Varnam Naturals Admin Panel · Restricted Access
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
