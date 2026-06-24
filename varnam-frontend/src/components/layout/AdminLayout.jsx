// src/components/layout/AdminLayout.jsx
// Persistent sidebar + topbar shell for all admin pages.

import { useState, useRef } from 'react'
import { Link, NavLink, useNavigate, Outlet } from 'react-router-dom'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'

/* ── Icons ───────────────────────────────────────────────────────────────── */
const I = ({ d, ...p }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...p}>
    {d.map((dd, i) => {
      if (dd.startsWith('C')) return <circle key={i} {...Object.fromEntries(dd.slice(1).split(' ').map(s => s.split(':')))} />
      if (dd.startsWith('R')) return <rect   key={i} {...Object.fromEntries(dd.slice(1).split(' ').map(s => s.split(':')))} />
      return <path key={i} d={dd} />
    })}
  </svg>
)

const IconGrid       = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
const IconPackage    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
const IconTag        = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
const IconOrders     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
const IconUsers      = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
const IconImage      = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
const IconSettings   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
const IconLogout     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
const IconMenu       = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
const IconClose      = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IconStore      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>

/* ── Nav items ───────────────────────────────────────────────────────────── */
const NAV = [
  { to: '/admin',            label: 'Dashboard',  Icon: IconGrid,     exact: true },
  { to: '/admin/products',   label: 'Products',   Icon: IconPackage },
  { to: '/admin/categories', label: 'Categories', Icon: IconTag },
  { to: '/admin/orders',     label: 'Orders',     Icon: IconOrders,   badge: 'orders' },
  { to: '/admin/customers',  label: 'Customers',  Icon: IconUsers },
  { to: '/admin/banners',    label: 'Banners',    Icon: IconImage },
  { to: '/admin/settings',   label: 'Settings',   Icon: IconSettings },
]

/* ── Sidebar ─────────────────────────────────────────────────────────────── */
function Sidebar({ open, onClose, pendingCancels, user, onLogout }) {
  const sidebarRef = useRef(null)
  const overlayRef = useRef(null)

  // GSAP handles open/close — avoids the inline-style display:none
  // always overriding the CSS class, which was the root of the mobile bug.
  useGSAP(() => {
    const sidebar = sidebarRef.current
    const overlay = overlayRef.current
    if (!sidebar || !overlay) return
    if (open) {
      gsap.set(overlay, { display: 'block' })
      gsap.to(overlay,  { opacity: 1, duration: 0.25, ease: 'none' })
      gsap.to(sidebar,  { x: 0, duration: 0.35, ease: 'power3.out' })
    } else {
      gsap.to(overlay, {
        opacity: 0, duration: 0.22, ease: 'none',
        onComplete: () => gsap.set(overlay, { display: 'none' }),
      })
      gsap.to(sidebar, { x: '-100%', duration: 0.3, ease: 'power3.in' })
    }
  }, { dependencies: [open] })

  const linkStyle = (isActive) => ({
    display: 'flex', alignItems: 'center', gap: 11,
    padding: '10px 14px', borderRadius: 11,
    fontFamily: 'var(--font-body)', fontSize: 13.5, fontWeight: isActive ? 600 : 400,
    textDecoration: 'none', transition: 'all 0.15s',
    background: isActive ? 'rgba(253,246,236,0.12)' : 'transparent',
    color: isActive ? '#FDF6EC' : 'rgba(253,246,236,0.55)',
    borderLeft: isActive ? '3px solid #E9B87A' : '3px solid transparent',
  })

  return (
    <>
      {/* Overlay — always mounted, GSAP controls display+opacity */}
      <div
        ref={overlayRef}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 44, display: 'none', opacity: 0,
        }}
      />

      <aside ref={sidebarRef}
        style={{
          width: 230, flexShrink: 0,
          background: 'linear-gradient(180deg, #0F2419 0%, #1B4332 100%)',
          display: 'flex', flexDirection: 'column',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          position: 'fixed', top: 0, left: 0, bottom: 0,
          zIndex: 45, overflowY: 'auto',
          // Start off-screen on mobile; desktop CSS resets to translateX(0)
          transform: 'translateX(-100%)',
        }}
        className="admin-sidebar">

        {/* Logo */}
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="32" height="32">
                <rect width="64" height="64" rx="14" fill="#2D6A4F"/>
                <text x="32" y="46" fontSize="36" textAnchor="middle" fill="#FDF6EC" fontFamily="Georgia,serif" fontWeight="700">V</text>
              </svg>
              <div>
                <p style={{ fontFamily: 'var(--font-heading)', color: '#FDF6EC', fontSize: 15, margin: 0, lineHeight: 1.2 }}>Varnam</p>
                <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(233,184,122,0.8)', fontSize: 10, margin: 0, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Admin Panel</p>
              </div>
            </Link>
            <button onClick={onClose} className="admin-close-btn"
              style={{ background: 'none', border: 'none', color: 'rgba(253,246,236,0.4)', cursor: 'pointer', display: 'none', padding: 4 }}>
              <IconClose />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'rgba(253,246,236,0.25)', letterSpacing: '0.18em', textTransform: 'uppercase', padding: '4px 14px 8px', margin: 0 }}>
            Navigation
          </p>
          {NAV.map(({ to, label, Icon, exact, badge }) => (
            <NavLink key={to} to={to} end={exact}
              onClick={onClose}
              style={({ isActive }) => linkStyle(isActive)}>
              {({ isActive }) => (
                <>
                  <span style={{ opacity: isActive ? 1 : 0.7 }}><Icon /></span>
                  <span style={{ flex: 1 }}>{label}</span>
                  {badge === 'orders' && pendingCancels > 0 && (
                    <span style={{ background: '#C8893A', color: '#fff', borderRadius: 99, fontSize: 10, fontWeight: 700, minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
                      {pendingCancels}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '12px 10px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {/* Visit store */}
          <Link to="/" target="_blank"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(253,246,236,0.4)', textDecoration: 'none', marginBottom: 4, transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(253,246,236,0.75)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(253,246,236,0.4)'}>
            <IconStore /> Visit Store
          </Link>

          {/* User + logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 11, background: 'rgba(255,255,255,0.05)' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(233,184,122,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: 'var(--font-heading)', color: '#E9B87A', fontSize: 14, fontWeight: 600 }}>
                {user?.name?.[0] ?? 'A'}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: '#FDF6EC', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name ?? 'Admin'}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'rgba(253,246,236,0.35)', margin: 0 }}>Administrator</p>
            </div>
            <button onClick={onLogout} title="Logout"
              style={{ background: 'none', border: 'none', color: 'rgba(253,246,236,0.35)', cursor: 'pointer', display: 'flex', padding: 4, transition: 'color 0.15s', flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(253,246,236,0.35)'}>
              <IconLogout />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

/* ── Admin Layout ────────────────────────────────────────────────────────── */
export default function AdminLayout({ pendingCancels = 0 }) {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const mainRef = useRef(null)

  useGSAP(() => {
    gsap.fromTo(mainRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }
    )
  }, { scope: mainRef })

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out')
    navigate('/admin/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8F6F2' }}>
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        pendingCancels={pendingCancels}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main content — offset by sidebar width */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }} className="admin-main">

        {/* Topbar */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 30,
          background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)',
          borderBottom: '1px solid #F0EBE1',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', height: 58,
          boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
        }}>
          {/* Hamburger — mobile only */}
          <button onClick={() => setSidebarOpen(v => !v)}
            className="admin-hamburger"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5C5548', display: 'none', padding: 4 }}>
            <IconMenu />
          </button>

          {/* Page title injected via CSS breadcrumb or just a spacer */}
          <div style={{ flex: 1 }} />

          {/* Right: user pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 99, background: '#F5F0E8' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(45,106,79,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'var(--font-heading)', color: '#2D6A4F', fontSize: 12, fontWeight: 700 }}>
                  {user?.name?.[0] ?? 'A'}
                </span>
              </div>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#5C5548', fontWeight: 500 }}>
                {user?.name?.split(' ')[0] ?? 'Admin'}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main ref={mainRef} style={{ flex: 1, padding: '28px 28px 48px', overflow: 'auto' }}>
          <Outlet />
        </main>
      </div>

      {/* Responsive styles */}
      <style>{`
        /* Desktop: sidebar always visible, reset any translateX */
        .admin-sidebar { transition: none; }
        .admin-main    { margin-left: 230px; }
        @media (min-width: 1024px) {
          /* Force sidebar to be visible on desktop regardless of GSAP state */
          .admin-sidebar { transform: translateX(0) !important; }
        }
        @media (max-width: 1023px) {
          /* Mobile/tablet: sidebar hidden by default (GSAP animates it) */
          .admin-main      { margin-left: 0 !important; }
          .admin-hamburger { display: flex !important; }
          .admin-close-btn { display: flex !important; }
        }
      `}</style>
    </div>
  )
}