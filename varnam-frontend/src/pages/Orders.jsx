import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import toast from 'react-hot-toast'
import { orderAPI } from '../services/api'

gsap.registerPlugin(ScrollTrigger)

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  'Pending Payment':      { color: '#6B7280', bg: 'rgba(107,114,128,0.09)', dot: '#9CA3AF', label: 'Pending Payment' },
  'Pending Manual Review':{ color: '#D97706', bg: 'rgba(217,119,6,0.09)',   dot: '#F59E0B', label: 'Under Review' },
  'Ordered':              { color: '#2D6A4F', bg: 'rgba(45,106,79,0.09)',   dot: '#52B788', label: 'Ordered' },
  'Packed':               { color: '#1D4ED8', bg: 'rgba(29,78,216,0.09)',   dot: '#3B82F6', label: 'Packed' },
  'Shipped':              { color: '#C8893A', bg: 'rgba(200,137,58,0.09)',  dot: '#C8893A', label: 'Shipped' },
  'Out For Delivery':     { color: '#7C3AED', bg: 'rgba(124,58,237,0.09)', dot: '#8B5CF6', label: 'Out for Delivery' },
  'Delivered':            { color: '#065F46', bg: 'rgba(6,95,70,0.09)',     dot: '#10B981', label: 'Delivered' },
  'Cancelled':            { color: '#DC2626', bg: 'rgba(220,38,38,0.09)',   dot: '#EF4444', label: 'Cancelled' },
}

const PAYMENT_CONFIG = {
  'Pending':  { color: '#6B7280', label: 'Pending' },
  'Paid':     { color: '#065F46', label: 'Paid' },
  'Failed':   { color: '#DC2626', label: 'Failed' },
  'Refunded': { color: '#7C3AED', label: 'Refunded' },
  'Cancelled':{ color: '#6B7280', label: 'Cancelled' },
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconBox = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
)
const IconChevronRight = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)
const IconChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)
const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const IconRefresh = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
)
const IconEmptyBox = () => (
  <svg width="56" height="56" viewBox="0 0 64 64" fill="none">
    <rect x="8" y="20" width="48" height="36" rx="4" stroke="#D0C8B5" strokeWidth="2"/>
    <path d="M8 28H56" stroke="#D0C8B5" strokeWidth="2"/>
    <path d="M24 20V14C24 10.7 27.6 8 32 8C36.4 8 40 10.7 40 14V20" stroke="#D0C8B5" strokeWidth="2" strokeLinecap="round"/>
    <path d="M24 36H40M32 36V48" stroke="#E8E0D0" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['Ordered']
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 99,
      background: cfg.bg, color: cfg.color,
      fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)',
      letterSpacing: '0.02em', whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  )
}

// ─── Payment badge ────────────────────────────────────────────────────────────
function PaymentBadge({ status, method }) {
  const cfg = PAYMENT_CONFIG[status] || PAYMENT_CONFIG['Pending']
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontFamily: 'var(--font-body)',
      color: cfg.color, fontWeight: 600,
    }}>
      {method === 'COD' ? '💵' : '💳'} {method === 'COD' ? 'COD' : 'Online'} · {cfg.label}
    </span>
  )
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #F0EBE1', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="skeleton" style={{ height: 13, width: 160, borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 22, width: 80, borderRadius: 99 }} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {[48, 48, 48].map((w, i) => (
          <div key={i} className="skeleton" style={{ width: w, height: 48, borderRadius: 10, flexShrink: 0 }} />
        ))}
        <div className="skeleton" style={{ width: 60, height: 48, borderRadius: 10, flexShrink: 0 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="skeleton" style={{ height: 12, width: 120, borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 32, width: 100, borderRadius: 10 }} />
      </div>
    </div>
  )
}

// ─── Single order card ────────────────────────────────────────────────────────
function OrderCard({ order }) {
  const ref = useRef(null)

  // Hover lift
  const onEnter = () => gsap.to(ref.current, { y: -3, boxShadow: '0 8px 32px rgba(45,106,79,0.13)', duration: 0.22, ease: 'power2.out' })
  const onLeave = () => gsap.to(ref.current, { y: 0,  boxShadow: '0 2px 12px rgba(45,106,79,0.06)', duration: 0.22, ease: 'power2.out' })

  const displayItems = order.orderItems.slice(0, 4)
  const extraCount  = order.orderItems.length - 4
  const totalQty    = order.orderItems.reduce((s, i) => s + i.quantity, 0)

  return (
    <div
      ref={ref}
      className="order-card"
      style={{ background: '#fff', borderRadius: 18, border: '1px solid #F0EBE1', overflow: 'hidden', boxShadow: '0 2px 12px rgba(45,106,79,0.06)', cursor: 'pointer', transition: 'border-color 0.2s' }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {/* ── Header row ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '14px 20px', borderBottom: '1px solid #F5F0E8' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, color: '#26221C', letterSpacing: '0.02em' }}>
            {order.orderNumber}
          </span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#A89F8C' }}>
            {fmtDate(order.createdAt)}
          </span>
        </div>
        <StatusBadge status={order.orderStatus} />
      </div>

      {/* ── Product thumbnails ── */}
      <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
        {displayItems.map((item, i) => (
          <div key={i} style={{ position: 'relative', width: 52, height: 52, borderRadius: 11, overflow: 'hidden', background: '#FAFAF7', border: '1px solid #F0EBE1', flexShrink: 0 }}>
            <img
              src={item.product?.images?.[0] || null}
              alt={item.name}
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={e => {
                // prevent infinite loop if placeholder also fails
                e.target.onerror = null
                e.target.style.display = 'none'
                e.target.parentElement.style.background = '#F0EBE3'
              }}
            />
            {item.quantity > 1 && (
              <span style={{ position: 'absolute', bottom: 2, right: 2, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 4, padding: '1px 4px', fontFamily: 'var(--font-body)' }}>
                ×{item.quantity}
              </span>
            )}
          </div>
        ))}
        {extraCount > 0 && (
          <div style={{ width: 52, height: 52, borderRadius: 11, background: '#F5F0E8', border: '1px solid #F0EBE1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, color: '#7A7265' }}>+{extraCount}</span>
          </div>
        )}
        {/* spacer */}
        <div style={{ flex: 1 }} />
        {/* item count pill */}
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C', whiteSpace: 'nowrap' }}>
          {totalQty} item{totalQty !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Footer row ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, padding: '12px 20px', borderTop: '1px solid #F5F0E8', background: '#FAFAF7' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 700, color: '#26221C' }}>
            {fmt(order.totalPrice)}
          </span>
          <PaymentBadge status={order.paymentStatus} method={order.paymentMethod} />
        </div>
        <Link
          to={`/orders/${order._id}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 16px', borderRadius: 11, background: 'rgba(45,106,79,0.07)', border: '1px solid rgba(45,106,79,0.15)', color: '#2D6A4F', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'all 0.18s', whiteSpace: 'nowrap' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#2D6A4F'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(45,106,79,0.07)'; e.currentTarget.style.color = '#2D6A4F' }}
          onClick={e => e.stopPropagation()}
        >
          View Details <IconChevronRight size={13} />
        </Link>
      </div>
    </div>
  )
}

// ─── Status filter tabs ───────────────────────────────────────────────────────
const TABS = [
  { key: 'all',       label: 'All Orders' },
  { key: 'active',    label: 'Active' },
  { key: 'Delivered', label: 'Delivered' },
  { key: 'Cancelled', label: 'Cancelled' },
]

const ACTIVE_STATUSES = ['Ordered', 'Packed', 'Shipped', 'Out For Delivery', 'Pending Payment', 'Pending Manual Review']

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null

  const nums = Array.from({ length: pages }, (_, i) => i + 1)
    .filter(n => n === 1 || n === pages || Math.abs(n - page) <= 1)
    .reduce((acc, n, i, arr) => {
      if (i > 0 && n - arr[i - 1] > 1) acc.push('…')
      acc.push(n)
      return acc
    }, [])

  const btn = (content, onClick, disabled, active) => (
    <button
      key={String(content)}
      onClick={onClick}
      disabled={disabled}
      style={{
        minWidth: 36, height: 36, borderRadius: 10, border: active ? 'none' : '1.5px solid #E8E0D0',
        background: active ? '#2D6A4F' : disabled ? 'transparent' : '#fff',
        color: active ? '#fff' : disabled ? '#D0C8B5' : '#3D3830',
        fontSize: 13, fontWeight: active ? 700 : 500, cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'var(--font-body)', transition: 'all 0.18s', padding: '0 10px',
        boxShadow: active ? '0 4px 12px rgba(45,106,79,0.28)' : 'none',
      }}
    >
      {content}
    </button>
  )

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 32, borderTop: '1px solid #F5F0E8', marginTop: 8 }}>
      {btn(<IconChevronLeft />, () => onChange(page - 1), page === 1, false)}
      {nums.map((n, i) =>
        n === '…'
          ? <span key={`e${i}`} style={{ width: 28, textAlign: 'center', color: '#A89F8C', fontSize: 13 }}>…</span>
          : btn(n, () => onChange(n), false, n === page)
      )}
      {btn(<IconChevronRight />, () => onChange(page + 1), page === pages, false)}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyOrders({ tab, onReset }) {
  const messages = {
    all:       { title: "You haven't placed any orders yet", sub: 'Your order history will appear here once you shop.' },
    active:    { title: 'No active orders right now',        sub: 'Orders in progress will show up here.' },
    Delivered: { title: 'No delivered orders',               sub: 'Completed deliveries will appear here.' },
    Cancelled: { title: 'No cancelled orders',               sub: "You haven't cancelled any orders." },
  }
  const { title, sub } = messages[tab] || messages.all

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center' }}>
      <div style={{ marginBottom: 20 }}><IconEmptyBox /></div>
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, color: '#26221C', margin: '0 0 8px' }}>{title}</h3>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#A89F8C', margin: '0 0 24px', maxWidth: 320, lineHeight: 1.6 }}>{sub}</p>
      {tab === 'all' ? (
        <Link to="/shop" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#2D6A4F', color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, padding: '11px 24px', borderRadius: 12, textDecoration: 'none', boxShadow: '0 4px 16px rgba(45,106,79,0.25)' }}>
          Start Shopping <IconChevronRight />
        </Link>
      ) : (
        <button onClick={onReset} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(45,106,79,0.08)', color: '#2D6A4F', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, padding: '10px 22px', borderRadius: 12, border: '1px solid rgba(45,106,79,0.18)', cursor: 'pointer' }}>
          View All Orders
        </button>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Orders() {
  const navigate = useNavigate()

  const [orders, setOrders]         = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 })
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [tab, setTab]               = useState('all')
  const [page, setPage]             = useState(1)

  const headerRef  = useRef(null)
  const tabBarRef  = useRef(null)
  const listRef    = useRef(null)

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await orderAPI.getMyOrders({ page: p, limit: 10 })
      if (data.success) {
        setOrders(data.data)
        setPagination(data.pagination || { total: 0, page: p, pages: 1 })
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to load orders.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchOrders(page) }, [page, fetchOrders])

  // ── Page-load entrance ────────────────────────────────────────────────────
  useGSAP(() => {
    const tl = gsap.timeline()
    if (headerRef.current)
      tl.fromTo(headerRef.current, { y: -16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' })
    if (tabBarRef.current)
      tl.fromTo(tabBarRef.current, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }, '-=0.25')
  }, [])

  // ── Card entrance animation on data load ─────────────────────────────────
  useGSAP(() => {
    if (loading || !listRef.current) return
    const cards = listRef.current.querySelectorAll('.order-card')
    if (!cards.length) return
    gsap.fromTo(cards,
      { opacity: 0, y: 28 },
      { opacity: 1, y: 0, stagger: 0.07, duration: 0.5, ease: 'power3.out' }
    )
  }, [loading, tab])

  // ── Tab filter (client-side — all orders are fetched) ─────────────────────
  const filtered = orders.filter(o => {
    if (tab === 'all')       return true
    if (tab === 'active')    return ACTIVE_STATUSES.includes(o.orderStatus)
    return o.orderStatus === tab
  })

  // ── Tab counts ────────────────────────────────────────────────────────────
  const counts = {
    all:       orders.length,
    active:    orders.filter(o => ACTIVE_STATUSES.includes(o.orderStatus)).length,
    Delivered: orders.filter(o => o.orderStatus === 'Delivered').length,
    Cancelled: orders.filter(o => o.orderStatus === 'Cancelled').length,
  }

  const handlePageChange = (p) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#F5F0E8 0%,#FAFAF7 100px)', fontFamily: 'var(--font-body)', color: '#26221C', paddingBottom: 80 }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div ref={headerRef} style={{ background: '#fff', borderBottom: '1px solid #F0EBE1', padding: '20px 0', boxShadow: '0 1px 0 rgba(45,106,79,0.06)' }}>
        <div className="container-main">
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#A89F8C', marginBottom: 6 }}>
            <Link to="/"  style={{ color: '#A89F8C', textDecoration: 'none' }}>Home</Link>
            <span>/</span>
            <span style={{ color: '#26221C' }}>My Orders</span>
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(45,106,79,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2D6A4F' }}>
                <IconBox />
              </div>
              <div>
                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.2rem,2.5vw,1.6rem)', color: '#26221C', margin: 0, lineHeight: 1.2 }}>
                  My Orders
                </h1>
                {!loading && (
                  <p style={{ fontSize: 12, color: '#A89F8C', margin: '2px 0 0' }}>
                    {pagination.total} order{pagination.total !== 1 ? 's' : ''} in total
                  </p>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', align: 'center', gap: 8 }}>
              <Link to="/track-order" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1.5px solid #E8E0D0', background: '#fff', color: '#5C5548', fontSize: 12, fontWeight: 600, textDecoration: 'none', transition: 'all 0.18s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#2D6A4F'; e.currentTarget.style.color = '#2D6A4F' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E0D0'; e.currentTarget.style.color = '#5C5548' }}>
                <IconSearch /> Track Order
              </Link>
              <button
                onClick={() => fetchOrders(page)}
                disabled={loading}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 10, border: '1.5px solid #E8E0D0', background: '#fff', color: '#5C5548', fontSize: 12, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, transition: 'all 0.18s' }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = '#2D6A4F'; e.currentTarget.style.color = '#2D6A4F' }}}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E0D0'; e.currentTarget.style.color = '#5C5548' }}
              >
                <span style={{ display: 'flex', animation: loading ? 'spin 0.8s linear infinite' : 'none' }}><IconRefresh /></span>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-main" style={{ paddingTop: 28 }}>

        {/* ── Tab bar ───────────────────────────────────────────────────── */}
        <div ref={tabBarRef} style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          {TABS.map(({ key, label }) => {
            const active = tab === key
            const count  = counts[key]
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 11,
                  border: `1.5px solid ${active ? '#2D6A4F' : '#E8E0D0'}`,
                  background: active ? '#2D6A4F' : '#fff',
                  color: active ? '#fff' : '#5C5548',
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  cursor: 'pointer', transition: 'all 0.18s',
                  boxShadow: active ? '0 4px 14px rgba(45,106,79,0.2)' : 'none',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = '#2D6A4F'; e.currentTarget.style.color = '#2D6A4F' }}}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = '#E8E0D0'; e.currentTarget.style.color = '#5C5548' }}}
              >
                {label}
                {!loading && count > 0 && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 18, height: 18, borderRadius: 99, background: active ? 'rgba(255,255,255,0.25)' : 'rgba(45,106,79,0.1)', color: active ? '#fff' : '#2D6A4F', fontSize: 10, fontWeight: 700, padding: '0 5px' }}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* ── Content ───────────────────────────────────────────────────── */}
        {error ? (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <p style={{ color: '#DC2626', fontSize: 14, margin: 0 }}>{error}</p>
            <button onClick={() => fetchOrders(page)} style={{ fontSize: 13, fontWeight: 600, color: '#DC2626', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>
              Retry
            </button>
          </div>
        ) : loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : (
          <>
            {filtered.length === 0 ? (
              <EmptyOrders tab={tab} onReset={() => setTab('all')} />
            ) : (
              <div ref={listRef} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filtered.map(order => (
                  <OrderCard key={order._id} order={order} />
                ))}
              </div>
            )}

            {/* Pagination — only on 'all' tab since filtering is client-side */}
            {tab === 'all' && (
              <Pagination
                page={pagination.page}
                pages={pagination.pages}
                onChange={handlePageChange}
              />
            )}

            {/* Cross-tab pagination note */}
            {tab !== 'all' && pagination.pages > 1 && (
              <p style={{ textAlign: 'center', fontSize: 12, color: '#A89F8C', marginTop: 20, lineHeight: 1.6 }}>
                Showing from this page's results.{' '}
                <button onClick={() => setTab('all')} style={{ color: '#2D6A4F', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>
                  View all orders
                </button>{' '}
                to see complete history.
              </p>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}