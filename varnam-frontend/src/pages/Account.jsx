// src/pages/Account.jsx
// Uses: authStore (user data, logout), orderAPI.getMyOrders (recent orders)
// No profile-update endpoint exists in the server — page is read-only display.

import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate }                         from 'react-router-dom'
import { gsap }                                      from 'gsap'
import { useGSAP }                                   from '@gsap/react'
import toast                                         from 'react-hot-toast'
import { useAuthStore }                              from '../store/authStore'
import { orderAPI }                                  from '../services/api'

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */
const fmt = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(n)

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

const memberSince = (d) =>
  new Date(d).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

/* ─────────────────────────────────────────────────────────────────────────────
   STATUS CONFIG  (same as Orders / OrderDetail)
───────────────────────────────────────────────────────────────────────────── */
const STATUS_CONFIG = {
  'Pending Payment':       { color: '#6B7280', bg: 'rgba(107,114,128,0.09)', dot: '#9CA3AF', label: 'Pending Payment'  },
  'Pending Manual Review': { color: '#D97706', bg: 'rgba(217,119,6,0.09)',   dot: '#F59E0B', label: 'Under Review'     },
  'Ordered':               { color: '#2D6A4F', bg: 'rgba(45,106,79,0.09)',   dot: '#52B788', label: 'Ordered'          },
  'Packed':                { color: '#1D4ED8', bg: 'rgba(29,78,216,0.09)',   dot: '#3B82F6', label: 'Packed'           },
  'Shipped':               { color: '#C8893A', bg: 'rgba(200,137,58,0.09)',  dot: '#C8893A', label: 'Shipped'          },
  'Out For Delivery':      { color: '#7C3AED', bg: 'rgba(124,58,237,0.09)', dot: '#8B5CF6', label: 'Out for Delivery' },
  'Delivered':             { color: '#065F46', bg: 'rgba(6,95,70,0.09)',     dot: '#10B981', label: 'Delivered'        },
  'Cancelled':             { color: '#DC2626', bg: 'rgba(220,38,38,0.09)',   dot: '#EF4444', label: 'Cancelled'        },
}

/* ─────────────────────────────────────────────────────────────────────────────
   ICONS
───────────────────────────────────────────────────────────────────────────── */
const Ico = ({ path, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
)

const IconUser        = () => <Ico path={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>} />
const IconMail        = () => <Ico path={<><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>} />
const IconBox         = () => <Ico path={<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>} />
const IconTruck       = () => <Ico path={<><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 4v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>} />
const IconShield      = () => <Ico path={<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></>} />
const IconLogOut      = () => <Ico path={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>} />
const IconChevRight   = () => <Ico path={<polyline points="9 18 15 12 9 6"/>} size={15} />
const IconCalendar    = () => <Ico path={<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>} size={15} />
const IconLeaf        = () => <Ico path={<><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></>} size={20} />
const IconSearch      = () => <Ico path={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>} size={16} />

/* ─────────────────────────────────────────────────────────────────────────────
   AVATAR  — initials-based, consistent colour from name
───────────────────────────────────────────────────────────────────────────── */
function Avatar({ name, size = 72 }) {
  const initials = (name || 'U')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  // deterministic colour from name string
  const colours = ['#2D6A4F', '#1D4ED8', '#7C3AED', '#C8893A', '#065F46', '#9D174D']
  const idx = (name || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colours.length
  const bg  = colours[idx]

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, ${bg}, ${bg}cc)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      boxShadow: `0 4px 20px ${bg}40`,
      border: '3px solid rgba(255,255,255,0.9)',
    }}>
      <span style={{
        fontFamily: 'var(--font-heading)',
        fontSize: size * 0.34,
        fontWeight: 600,
        color: '#fff',
        lineHeight: 1,
        letterSpacing: '0.02em',
      }}>
        {initials}
      </span>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   STAT PILL
───────────────────────────────────────────────────────────────────────────── */
function StatPill({ value, label, color = '#2D6A4F' }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '14px 20px', borderRadius: 14,
      background: `${color}09`,
      border: `1px solid ${color}18`,
      flex: 1, minWidth: 80,
    }}>
      <span style={{ fontFamily: 'var(--font-heading)', fontSize: 22, color, lineHeight: 1, fontWeight: 700 }}>
        {value}
      </span>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C', marginTop: 4, textAlign: 'center', lineHeight: 1.3 }}>
        {label}
      </span>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   ORDER SUMMARY ROW  (compact card for "Recent Orders" section)
───────────────────────────────────────────────────────────────────────────── */
function OrderRow({ order, isLast }) {
  const cfg     = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG['Ordered']
  const preview = order.orderItems?.[0]

  return (
    <Link
      to={`/orders/${order._id}`}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 20px',
          borderBottom: isLast ? 'none' : '1px solid #F5F0E8',
          transition: 'background 0.18s',
          cursor: 'pointer',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#FAFAF7' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
      >
        {/* thumbnail */}
        <div style={{
          width: 48, height: 48, borderRadius: 10,
          background: '#F5F0E8', flexShrink: 0, overflow: 'hidden',
          border: '1px solid #F0EBE1',
        }}>
          {preview?.product?.images?.[0] ? (
            <img
              src={preview.product.images[0]}
              alt={preview.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={e => { e.target.onerror = null; e.target.style.display = 'none' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C8B89A' }}>
              <IconBox />
            </div>
          )}
        </div>

        {/* info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: '#26221C', margin: '0 0 3px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {order.orderNumber}
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#A89F8C', margin: 0 }}>
            {fmtDate(order.createdAt)}
            {order.orderItems?.length > 1 && ` · ${order.orderItems.length} items`}
          </p>
        </div>

        {/* right side */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 9px', borderRadius: 99,
            background: cfg.bg, color: cfg.color,
            fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-body)',
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot }} />
            {cfg.label}
          </span>
          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: '#26221C' }}>
            {fmt(order.totalPrice)}
          </span>
        </div>

        <div style={{ color: '#D0C8B5', flexShrink: 0 }}><IconChevRight /></div>
      </div>
    </Link>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   QUICK LINKS  — grid of action cards below the profile
───────────────────────────────────────────────────────────────────────────── */
const QUICK_LINKS = [
  {
    to:    '/orders',
    icon:  <IconBox />,
    label: 'My Orders',
    sub:   'View all past orders',
    color: '#2D6A4F',
  },
  {
    to:    '/track-order',
    icon:  <IconTruck />,
    label: 'Track Order',
    sub:   'Track by order number',
    color: '#1D4ED8',
  },
  {
    to:    '/shop',
    icon:  <IconLeaf />,
    label: 'Shop',
    sub:   'Browse all products',
    color: '#065F46',
  },
  {
    to:    '/track-order',
    icon:  <IconSearch />,
    label: 'Public Tracker',
    sub:   'Share tracking link',
    color: '#C8893A',
  },
]

/* ─────────────────────────────────────────────────────────────────────────────
   LOGOUT BUTTON with confirmation
───────────────────────────────────────────────────────────────────────────── */
function LogoutButton({ onLogout }) {
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (!confirm) { setConfirm(true); return }
    setLoading(true)
    await onLogout()
    setLoading(false)
  }

  // reset confirm if user moves away
  useEffect(() => {
    if (!confirm) return
    const t = setTimeout(() => setConfirm(false), 4000)
    return () => clearTimeout(t)
  }, [confirm])

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '11px 22px', borderRadius: 12, border: 'none', cursor: 'pointer',
        background: confirm ? 'rgba(220,38,38,0.08)' : '#F5F0E8',
        color:      confirm ? '#DC2626'              : '#5C5548',
        fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
        border: '1.5px solid',
        borderColor: confirm ? 'rgba(220,38,38,0.25)' : '#E8E0D0',
        transition: 'all 0.2s',
      }}
    >
      {loading ? (
        <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(220,38,38,0.3)', borderTopColor: '#DC2626', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
      ) : (
        <IconLogOut />
      )}
      {loading ? 'Signing out…' : confirm ? 'Tap again to confirm' : 'Sign Out'}
    </button>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────────────────── */
export default function Account() {
  const { user, logout }    = useAuthStore()
  const navigate            = useNavigate()

  const [orders,   setOrders]   = useState([])
  const [loadingO, setLoadingO] = useState(true)

  const pageRef = useRef(null)

  /* ── Fetch 5 most recent orders for the preview ── */
  const fetchOrders = useCallback(async () => {
    setLoadingO(true)
    try {
      const { data } = await orderAPI.getMyOrders({ page: 1, limit: 5 })
      if (data.success) setOrders(data.data || [])
    } catch {
      // silently ignore — orders section just won't show
    } finally {
      setLoadingO(false)
    }
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  /* ── Page entrance ── */
  useGSAP(() => {
    if (!pageRef.current) return
    gsap.fromTo(
      pageRef.current.querySelectorAll('.acct-row'),
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.08, duration: 0.5, ease: 'power3.out', delay: 0.05 }
    )
  }, [])

  /* ── Logout ── */
  const handleLogout = async () => {
    await logout()
    toast.success('See you again!')
    navigate('/')
  }

  /* ── Derived stats from orders ── */
  const totalSpent    = orders.reduce((s, o) => s + (o.totalPrice || 0), 0)
  const deliveredCount = orders.filter(o => o.orderStatus === 'Delivered').length
  const activeCount    = orders.filter(o => !['Delivered','Cancelled'].includes(o.orderStatus)).length

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF7', paddingBottom: 80 }}>

      {/* ── Hero header ── */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(160deg,#0D2B1E 0%,#1B4332 50%,#2D6A4F 100%)',
        padding: 'clamp(36px,6vw,64px) 0 clamp(44px,8vw,80px)',
      }}>
        {/* bg glows */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '-30%', right: '-10%', width: '50%', height: '180%', background: 'radial-gradient(ellipse,rgba(200,137,58,0.10) 0%,transparent 65%)' }} />
          <div style={{ position: 'absolute', bottom: '-40%', left: '-5%',  width: '45%', height: '160%', background: 'radial-gradient(ellipse,rgba(82,183,136,0.10) 0%,transparent 65%)' }} />
        </div>
        {/* leaf texture */}
        <svg aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.04 }}
          viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice">
          {[[60,40],[200,80],[380,30],[560,70],[720,45],[100,200],[300,170],[500,210],[700,180]].map(([cx,cy],i) => (
            <g key={i} transform={`translate(${cx},${cy}) rotate(${i*43%180-90})`}>
              <ellipse rx="15" ry="7" fill="#52B788"/>
            </g>
          ))}
        </svg>

        <div className="container-main" style={{ position: 'relative', zIndex: 2 }}>
          {/* breadcrumb */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(253,246,236,0.4)', marginBottom: 24, fontFamily: 'var(--font-body)' }}>
            <Link to="/" style={{ color: 'rgba(253,246,236,0.4)', textDecoration: 'none' }}>Home</Link>
            <span>/</span>
            <span style={{ color: 'rgba(253,246,236,0.7)' }}>My Account</span>
          </nav>

          {/* profile row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <Avatar name={user?.name} size={72} />
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 6,
                background: 'rgba(255,255,255,0.07)', borderRadius: 99, padding: '4px 12px', border: '1px solid rgba(255,255,255,0.10)' }}>
                <span style={{ color: '#E9B87A' }}><IconShield /></span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: '#E9B87A', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                  Verified Member
                </span>
              </div>
              <h1 style={{ fontFamily: 'var(--font-heading)', color: '#FDF6EC', fontSize: 'clamp(1.4rem,4vw,2rem)', margin: '0 0 6px', lineHeight: 1.15 }}>
                {user?.name || 'My Account'}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(253,246,236,0.5)' }}>
                <IconMail />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13 }}>{user?.email}</span>
              </div>
              {user?.createdAt && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(253,246,236,0.35)', marginTop: 4 }}>
                  <IconCalendar />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 12 }}>
                    Member since {memberSince(user.createdAt)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="container-main" ref={pageRef} style={{ paddingTop: 28 }}>
        <div className="acct-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>

          {/* ── LEFT / MAIN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* STATS ROW */}
            <div className="acct-row" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <StatPill
                value={loadingO ? '—' : orders.length < 5 ? orders.length : `${orders.length}+`}
                label="Recent Orders"
                color="#2D6A4F"
              />
              <StatPill
                value={loadingO ? '—' : deliveredCount}
                label="Delivered"
                color="#065F46"
              />
              <StatPill
                value={loadingO ? '—' : activeCount}
                label="Active"
                color="#C8893A"
              />
              <StatPill
                value={loadingO ? '—' : fmt(totalSpent)}
                label="Total Spent"
                color="#1D4ED8"
              />
            </div>

            {/* RECENT ORDERS */}
            <div className="acct-row" style={{ background: '#fff', borderRadius: 18, border: '1px solid #F0EBE1', overflow: 'hidden', boxShadow: '0 2px 12px rgba(45,106,79,0.04)' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#2D6A4F' }}>
                  <IconBox />
                  <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 15, margin: 0, color: '#26221C' }}>Recent Orders</h2>
                </div>
                <Link to="/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: '#2D6A4F', textDecoration: 'none' }}>
                  View all <IconChevRight />
                </Link>
              </div>

              {loadingO ? (
                <div style={{ padding: '20px' }}>
                  {[1,2,3].map(i => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: i < 3 ? '1px solid #F5F0E8' : 'none' }}>
                      <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 10, flexShrink: 0 }} />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                        <div className="skeleton" style={{ height: 12, width: '60%', borderRadius: 6 }} />
                        <div className="skeleton" style={{ height: 10, width: '40%', borderRadius: 6 }} />
                      </div>
                      <div className="skeleton" style={{ height: 22, width: 70, borderRadius: 99 }} />
                    </div>
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(45,106,79,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2D6A4F', margin: '0 auto 14px' }}>
                    <IconBox />
                  </div>
                  <p style={{ fontFamily: 'var(--font-heading)', fontSize: 16, color: '#26221C', margin: '0 0 6px' }}>No orders yet</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#A89F8C', margin: '0 0 18px' }}>
                    Your orders will appear here after your first purchase
                  </p>
                  <Link to="/shop" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 22px', borderRadius: 12, background: '#2D6A4F', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                    Start Shopping <IconChevRight />
                  </Link>
                </div>
              ) : (
                orders.map((order, i) => (
                  <OrderRow key={order._id} order={order} isLast={i === orders.length - 1} />
                ))
              )}
            </div>

            {/* QUICK LINKS GRID */}
            <div className="acct-row">
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 15, color: '#26221C', margin: '0 0 14px' }}>Quick Links</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }} className="quick-grid">
                {QUICK_LINKS.map(({ to, icon, label, sub, color }) => (
                  <Link key={label} to={to}
                    style={{ textDecoration: 'none' }}
                  >
                    <div
                      style={{
                        background: '#fff', borderRadius: 16,
                        border: '1px solid #F0EBE1',
                        padding: '18px 18px',
                        display: 'flex', alignItems: 'center', gap: 14,
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = `${color}30`
                        e.currentTarget.style.boxShadow = `0 4px 16px ${color}12`
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#F0EBE1'
                        e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.03)'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      <div style={{
                        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                        background: `${color}0f`,
                        border: `1px solid ${color}18`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: color,
                      }}>
                        {icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: '#26221C', margin: 0, lineHeight: 1.3 }}>{label}</p>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C', margin: '2px 0 0', lineHeight: 1.3 }}>{sub}</p>
                      </div>
                      <div style={{ color: '#D0C8B5', flexShrink: 0 }}><IconChevRight /></div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT / SIDEBAR ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* PROFILE CARD */}
            <div className="acct-row" style={{ background: '#fff', borderRadius: 18, border: '1px solid #F0EBE1', overflow: 'hidden', boxShadow: '0 2px 12px rgba(45,106,79,0.04)' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #F5F0E8', display: 'flex', alignItems: 'center', gap: 10, color: '#2D6A4F' }}>
                <IconUser />
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 15, margin: 0, color: '#26221C' }}>Profile Details</h2>
              </div>
              <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Full Name',  value: user?.name  || '—' },
                  { label: 'Email',      value: user?.email || '—' },
                  { label: 'Account ID', value: user?._id   || '—', mono: true, truncate: true },
                  { label: 'Role',       value: user?.role === 'admin' ? '🛡️ Admin' : '👤 Customer' },
                  ...(user?.createdAt ? [{ label: 'Member Since', value: memberSince(user.createdAt) }] : []),
                ].map(({ label, value, mono, truncate }) => (
                  <div key={label}>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {label}
                    </p>
                    <p style={{
                      fontFamily: mono ? 'monospace' : 'var(--font-body)',
                      fontSize: mono ? 11 : 13,
                      color: '#26221C',
                      fontWeight: 500,
                      margin: 0,
                      lineHeight: 1.4,
                      ...(truncate ? { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } : {}),
                    }}>
                      {value}
                    </p>
                  </div>
                ))}

                {/* info note — no edit endpoint */}
                <div style={{
                  marginTop: 4,
                  background: 'rgba(45,106,79,0.05)', borderRadius: 10,
                  border: '1px solid rgba(45,106,79,0.10)',
                  padding: '10px 12px',
                }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#7A7265', margin: 0, lineHeight: 1.6 }}>
                    To update your name or password, please contact support or place an order and reach us via the order chat.
                  </p>
                </div>
              </div>
            </div>

            {/* SIGN OUT */}
            <div className="acct-row" style={{ background: '#fff', borderRadius: 18, border: '1px solid #F0EBE1', overflow: 'hidden', boxShadow: '0 2px 12px rgba(45,106,79,0.04)' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #F5F0E8', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ color: '#DC2626' }}><IconLogOut /></div>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 15, margin: 0, color: '#26221C' }}>Sign Out</h2>
              </div>
              <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#7A7265', margin: 0, lineHeight: 1.6 }}>
                  You'll be signed out of your account on this device. Your cart and saved items will remain.
                </p>
                <LogoutButton onLogout={handleLogout} />
              </div>
            </div>

            {/* SECURITY NOTE */}
            <div className="acct-row" style={{
              background: 'linear-gradient(135deg,rgba(45,106,79,0.04),rgba(82,183,136,0.06))',
              borderRadius: 16, border: '1px solid rgba(45,106,79,0.10)',
              padding: '16px 18px',
              display: 'flex', gap: 12, alignItems: 'flex-start',
            }}>
              <div style={{ color: '#2D6A4F', marginTop: 1, flexShrink: 0 }}><IconShield /></div>
              <div>
                <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: '#2D6A4F', margin: '0 0 4px' }}>
                  Your account is secure
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#7A7265', margin: 0, lineHeight: 1.6 }}>
                  Sessions are protected by HTTP-only cookies. We never store your password in plain text.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 900px) {
          .acct-grid { grid-template-columns: 1fr 320px !important; }
        }
        @media (max-width: 479px) {
          .quick-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}