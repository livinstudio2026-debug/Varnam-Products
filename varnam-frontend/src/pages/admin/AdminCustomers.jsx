// src/pages/admin/AdminCustomers.jsx
// API:
//   GET  /api/admin/customers           → { success, data: [], pagination }
//   GET  /api/admin/customers/:id       → { success, data: { customer, orders, stats } }
//   PATCH /api/admin/customers/block/:id → { success, data: { isBlocked } }

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import toast from 'react-hot-toast'
import { adminAPI } from '../../services/api'

/* ─── helpers ─────────────────────────────────────────────────────── */
const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

const initials = (name = '') =>
  name.trim().split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('')

/* ─── icons ───────────────────────────────────────────────────────── */
const Ico = ({ children, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
)
const IcoSearch   = () => <Ico><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Ico>
const IcoClose    = () => <Ico><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Ico>
const IcoRefresh  = () => <Ico><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></Ico>
const IcoChevL    = () => <Ico><polyline points="15 18 9 12 15 6"/></Ico>
const IcoChevR    = () => <Ico><polyline points="9 18 15 12 9 6"/></Ico>
const IcoUser     = () => <Ico><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></Ico>
const IcoMail     = () => <Ico><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></Ico>
const IcoPhone    = () => <Ico><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l1.27-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></Ico>
const IcoCal      = () => <Ico><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></Ico>
const IcoOrders   = () => <Ico><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></Ico>
const IcoBlock    = () => <Ico><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></Ico>
const IcoUnblock  = () => <Ico><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></Ico>
const IcoEye      = () => <Ico><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></Ico>
const IcoAlert    = () => <Ico><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></Ico>
const IcoCheck    = () => <Ico><polyline points="20 6 9 17 4 12"/></Ico>
const IcoUsers    = () => <Ico size={22}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Ico>

/* ─── order status config ─────────────────────────────────────────── */
const S = {
  'Pending Payment':       { color: '#6B7280', bg: 'rgba(107,114,128,0.09)', dot: '#9CA3AF' },
  'Pending Manual Review': { color: '#D97706', bg: 'rgba(217,119,6,0.09)',   dot: '#F59E0B' },
  'Ordered':               { color: '#2D6A4F', bg: 'rgba(45,106,79,0.09)',   dot: '#52B788' },
  'Packed':                { color: '#1D4ED8', bg: 'rgba(29,78,216,0.09)',   dot: '#3B82F6' },
  'Shipped':               { color: '#C8893A', bg: 'rgba(200,137,58,0.09)',  dot: '#C8893A' },
  'Out For Delivery':      { color: '#7C3AED', bg: 'rgba(124,58,237,0.09)', dot: '#8B5CF6' },
  'Delivered':             { color: '#065F46', bg: 'rgba(6,95,70,0.09)',     dot: '#10B981' },
  'Cancelled':             { color: '#DC2626', bg: 'rgba(220,38,38,0.09)',   dot: '#EF4444' },
}

/* ─── Avatar ─────────────────────────────────────────────────────── */
function Avatar({ name, size = 36, blocked }) {
  const colors = ['#2D6A4F','#C8893A','#7C3AED','#1D4ED8','#065F46','#D97706']
  const bg = colors[(name?.charCodeAt(0) || 0) % colors.length]
  return (
    <div style={{ position: 'relative', width: size, height: size, borderRadius: '50%', background: blocked ? '#9CA3AF' : bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 2px 8px ${blocked ? 'rgba(156,163,175,0.3)' : bg + '44'}` }}>
      <span style={{ fontFamily: 'var(--font-heading)', fontSize: size * 0.38, color: '#fff', fontWeight: 700, letterSpacing: '-0.02em' }}>
        {initials(name)}
      </span>
      {blocked && (
        <div style={{ position: 'absolute', bottom: -1, right: -1, width: 14, height: 14, borderRadius: '50%', background: '#DC2626', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/><circle cx="12" cy="12" r="10"/></svg>
        </div>
      )}
    </div>
  )
}

/* ─── Status badge ────────────────────────────────────────────────── */
function OrderStatusBadge({ status }) {
  const cfg = S[status] || S['Ordered']
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 99, background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot }} />
      {status}
    </span>
  )
}

/* ─── Skeleton row ────────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr>
      {[1,2,3,4,5,6].map(i => (
        <td key={i} style={{ padding: '14px 16px' }}>
          <div className="skeleton" style={{ height: 14, borderRadius: 8, width: i === 1 ? 140 : i === 2 ? 200 : 90 }} />
        </td>
      ))}
    </tr>
  )
}

/* ─── Customer detail modal ───────────────────────────────────────── */
function CustomerModal({ customerId, onClose, onBlockToggled }) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [blocking,setBlocking]= useState(false)
  const [confirmBlock, setConfirmBlock] = useState(false)
  const backdropRef = useRef(null)
  const cardRef     = useRef(null)

  useEffect(() => {
    adminAPI.getCustomerById(customerId)
      .then(({ data: res }) => setData(res.data))
      .catch(() => toast.error('Failed to load customer'))
      .finally(() => setLoading(false))
  }, [customerId])

  useGSAP(() => {
    if (!backdropRef.current || !cardRef.current) return
    gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.22, ease: 'none' })
    gsap.fromTo(cardRef.current,
      { y: 32, opacity: 0, scale: 0.97 },
      { y: 0, opacity: 1, scale: 1, duration: 0.32, ease: 'power3.out' }
    )
  }, [])

  const handleClose = () => {
    const tl = gsap.timeline({ onComplete: onClose })
    tl.to(cardRef.current,     { y: 20, opacity: 0, scale: 0.97, duration: 0.2, ease: 'power2.in' })
    tl.to(backdropRef.current, { opacity: 0, duration: 0.18, ease: 'none' }, '-=0.1')
  }

  const handleToggleBlock = async () => {
    if (!confirmBlock) { setConfirmBlock(true); return }
    setBlocking(true)
    try {
      const { data: res } = await adminAPI.toggleBlockCustomer(customerId)
      const nowBlocked = res.data?.isBlocked
      toast.success(nowBlocked ? 'Customer blocked' : 'Customer unblocked')
      setData(d => ({ ...d, customer: { ...d.customer, isBlocked: nowBlocked } }))
      onBlockToggled(customerId, nowBlocked)
      setConfirmBlock(false)
    } catch {
      toast.error('Failed to update customer status')
    } finally {
      setBlocking(false)
    }
  }

  const customer = data?.customer
  const orders   = data?.orders  || []
  const stats    = data?.stats   || {}

  return createPortal(
    <div ref={backdropRef}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.48)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', overflowY: 'auto' }}
      onClick={handleClose}>
      <div ref={cardRef}
        style={{ background: '#fff', borderRadius: 22, width: '100%', maxWidth: 680, boxShadow: '0 32px 80px rgba(0,0,0,0.18)', overflow: 'hidden', marginBottom: 24 }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #F0EBE1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg,rgba(45,106,79,0.03),rgba(82,183,136,0.03))' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 17, color: '#26221C', margin: 0 }}>Customer Detail</h2>
          <button onClick={handleClose} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#F5F0E8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5C5548' }}>
            <IcoClose />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #F0EBE1', borderTopColor: '#2D6A4F', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : !customer ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#A89F8C', fontFamily: 'var(--font-body)' }}>Customer not found.</div>
        ) : (
          <>
            {/* Profile section */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F5F0E8' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                <Avatar name={customer.name} size={52} blocked={customer.isBlocked} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 17, color: '#26221C', margin: 0 }}>{customer.name}</h3>
                    {customer.isBlocked && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 10px', borderRadius: 99, background: 'rgba(220,38,38,0.08)', color: '#DC2626', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)' }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#DC2626' }} /> Blocked
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 6 }}>
                    {[
                      { icon: <IcoMail />,  val: customer.email },
                      { icon: <IcoPhone />, val: customer.phone || '—' },
                      { icon: <IcoCal />,   val: `Joined ${fmtDate(customer.createdAt)}` },
                    ].map(({ icon, val }) => (
                      <div key={val} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#7A7265', fontFamily: 'var(--font-body)', fontSize: 12 }}>
                        <span style={{ color: '#A89F8C' }}>{icon}</span>{val}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Block / Unblock button */}
                {!confirmBlock ? (
                  <button onClick={handleToggleBlock} disabled={blocking}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 10, border: `1.5px solid ${customer.isBlocked ? 'rgba(45,106,79,0.3)' : '#FECACA'}`, background: customer.isBlocked ? 'rgba(45,106,79,0.04)' : 'rgba(220,38,38,0.04)', color: customer.isBlocked ? '#2D6A4F' : '#DC2626', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, cursor: blocking ? 'wait' : 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {customer.isBlocked ? <><IcoUnblock /> Unblock</> : <><IcoBlock /> Block</>}
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => setConfirmBlock(false)} style={{ padding: '7px 12px', borderRadius: 9, border: '1px solid #E8E0D0', background: '#fff', fontFamily: 'var(--font-body)', fontSize: 12, cursor: 'pointer', color: '#5C5548' }}>Cancel</button>
                    <button onClick={handleToggleBlock} disabled={blocking}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 9, border: 'none', background: customer.isBlocked ? '#2D6A4F' : '#DC2626', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, cursor: blocking ? 'wait' : 'pointer' }}>
                      {blocking ? <><span style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Wait…</> : `Confirm ${customer.isBlocked ? 'Unblock' : 'Block'}`}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderBottom: '1px solid #F5F0E8' }} className="customer-modal-stats">
              {[
                { label: 'Total Orders',  value: stats.orderCount  ?? orders.length ?? 0 },
                { label: 'Total Spent',   value: fmt(stats.totalSpend ?? 0) },
                { label: 'Avg. Order',    value: fmt(stats.orderCount > 0 ? Math.round(stats.totalSpend / stats.orderCount) : 0) },
              ].map(({ label, value }, i) => (
                <div key={label} style={{ padding: '14px 16px', borderRight: i < 2 ? '1px solid #F5F0E8' : 'none', textAlign: 'center' }}>
                  <p style={{ fontFamily: 'var(--font-heading)', fontSize: 18, color: '#26221C', margin: '0 0 2px' }}>{value}</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Orders list */}
            <div style={{ padding: '16px 24px' }}>
              <h4 style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: '#A89F8C', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 12px' }}>
                Order History ({orders.length})
              </h4>
              {orders.length === 0 ? (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#A89F8C', textAlign: 'center', padding: '20px 0', margin: 0 }}>No orders found.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxHeight: 280, overflowY: 'auto', borderRadius: 12, border: '1px solid #F0EBE1' }}>
                  {orders.map((o, i) => (
                    <div key={o._id}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderBottom: i < orders.length - 1 ? '1px solid #F5F0E8' : 'none', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 120 }}>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: '#26221C', margin: '0 0 2px', letterSpacing: '0.03em' }}>{o.orderNumber}</p>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C', margin: 0 }}>{fmtDate(o.createdAt)}</p>
                      </div>
                      <OrderStatusBadge status={o.orderStatus} />
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: '#26221C', whiteSpace: 'nowrap' }}>{fmt(o.totalPrice)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}

/* ─── Block confirmation in table ─────────────────────────────────── */
function BlockCell({ customer, onToggle }) {
  const [confirming, setConfirming] = useState(false)
  const [loading,    setLoading]    = useState(false)

  const handleClick = async () => {
    if (!confirming) { setConfirming(true); return }
    setLoading(true)
    try {
      const { data } = await adminAPI.toggleBlockCustomer(customer._id)
      const nowBlocked = data.data?.isBlocked
      toast.success(nowBlocked ? `${customer.name} blocked` : `${customer.name} unblocked`)
      onToggle(customer._id, nowBlocked)
    } catch {
      toast.error('Failed to update status')
    } finally {
      setLoading(false)
      setConfirming(false)
    }
  }

  if (loading) return (
    <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #F0EBE1', borderTopColor: '#2D6A4F', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
  )

  if (confirming) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <button onClick={handleClick}
        style={{ padding: '4px 9px', borderRadius: 7, border: 'none', background: customer.isBlocked ? '#2D6A4F' : '#DC2626', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
        Confirm
      </button>
      <button onClick={() => setConfirming(false)}
        style={{ padding: '4px 8px', borderRadius: 7, border: '1px solid #E8E0D0', background: '#fff', fontFamily: 'var(--font-body)', fontSize: 11, cursor: 'pointer', color: '#5C5548' }}>
        Cancel
      </button>
    </div>
  )

  return (
    <button onClick={handleClick}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 8, border: `1.5px solid ${customer.isBlocked ? 'rgba(45,106,79,0.25)' : 'rgba(220,38,38,0.25)'}`, background: customer.isBlocked ? 'rgba(45,106,79,0.04)' : 'rgba(220,38,38,0.04)', color: customer.isBlocked ? '#2D6A4F' : '#DC2626', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.opacity = '0.8' }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}>
      {customer.isBlocked ? <><IcoUnblock /> Unblock</> : <><IcoBlock /> Block</>}
    </button>
  )
}

/* ─── Main page ───────────────────────────────────────────────────── */
export default function AdminCustomers() {
  const [customers,    setCustomers]    = useState([])
  const [total,        setTotal]        = useState(0)
  const [page,         setPage]         = useState(1)
  const [pages,        setPages]        = useState(1)
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [searchInput,  setSearchInput]  = useState('')
  const [filter,       setFilter]       = useState('all')  // 'all' | 'blocked' | 'active'
  const [selectedId,   setSelectedId]   = useState(null)

  const pageRef   = useRef(null)
  const tableRef  = useRef(null)
  const searchRef = useRef(null)
  const LIMIT = 12

  const load = useCallback(async (pg = 1, q = search, f = filter) => {
    setLoading(true)
    try {
      const params = { page: pg, limit: LIMIT }
      if (q)          params.search  = q
      if (f !== 'all') params.blocked = f === 'blocked' ? true : false
      const { data } = await adminAPI.getCustomers(params)
      if (data.success) {
        setCustomers(data.data || [])
        setTotal(data.pagination?.total || 0)
        setPage(data.pagination?.page   || 1)
        setPages(data.pagination?.pages  || 1)
      }
    } catch {
      toast.error('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }, [search, filter])

  useEffect(() => { load(1, search, filter) }, [search, filter]) // eslint-disable-line

  // Entrance animation
  useGSAP(() => {
    if (!pageRef.current) return
    gsap.fromTo(pageRef.current.querySelectorAll('.anim-in'),
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.07, duration: 0.45, ease: 'power3.out' }
    )
  }, { scope: pageRef })

  // Table row entrance on data load
  useGSAP(() => {
    if (!tableRef.current || loading) return
    gsap.fromTo(tableRef.current.querySelectorAll('tbody tr'),
      { opacity: 0, x: -8 },
      { opacity: 1, x: 0, stagger: 0.03, duration: 0.3, ease: 'power2.out' }
    )
  }, { dependencies: [loading, customers], scope: tableRef })

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput.trim())
    setPage(1)
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setSearch('')
  }

  const handleBlockToggled = (id, isBlocked) => {
    setCustomers(cs => cs.map(c => c._id === id ? { ...c, isBlocked } : c))
  }

  const totalActive  = customers.filter(c => !c.isBlocked).length
  const totalBlocked = customers.filter(c =>  c.isBlocked).length

  return (
    <div ref={pageRef}>
      {/* ── Page header ────────────────────────────────────────────── */}
      <div className="anim-in" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, color: '#26221C', margin: '0 0 4px' }}>Customers</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#A89F8C', margin: 0 }}>
            {total} registered customer{total !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => load(page)} title="Refresh"
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 10, border: '1px solid #E8E0D0', background: '#fff', fontFamily: 'var(--font-body)', fontSize: 13, color: '#5C5548', cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#2D6A4F'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#E8E0D0'}>
          <IcoRefresh /> Refresh
        </button>
      </div>

      {/* ── Summary stat cards ─────────────────────────────────────── */}
      <div className="anim-in customer-stat-cards">
        {[
          { label: 'Total Customers', value: total,        icon: <IcoUsers />, color: '#2D6A4F', bg: 'rgba(45,106,79,0.07)'  },
          { label: 'Active',           value: totalActive,  icon: <IcoCheck />, color: '#065F46', bg: 'rgba(6,95,70,0.07)'    },
          { label: 'Blocked',          value: totalBlocked, icon: <IcoBlock />, color: '#DC2626', bg: 'rgba(220,38,38,0.07)'  },
        ].map(({ label, value, icon, color, bg }) => (
          <div key={label} style={{ background: '#fff', borderRadius: 14, border: '1px solid #F0EBE1', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>{icon}</div>
            <div>
              <p style={{ fontFamily: 'var(--font-heading)', fontSize: 20, color: '#26221C', margin: 0, lineHeight: 1.2 }}>{value}</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search + filter bar ─────────────────────────────────────── */}
      <div className="anim-in" style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <form onSubmit={handleSearch} style={{ display: 'flex', flex: '1 1 180px', minWidth: 0, gap: 0, background: '#fff', borderRadius: 11, border: '1.5px solid #E8E0D0', overflow: 'hidden', transition: 'border-color 0.2s' }}
          onFocusCapture={e => e.currentTarget.style.borderColor = '#2D6A4F'}
          onBlurCapture={e  => e.currentTarget.style.borderColor = '#E8E0D0'}>
          <div style={{ padding: '0 12px', display: 'flex', alignItems: 'center', color: '#A89F8C' }}><IcoSearch /></div>
          <input ref={searchRef} value={searchInput} onChange={e => setSearchInput(e.target.value)}
            placeholder="Search name, email or phone…"
            style={{ flex: 1, border: 'none', outline: 'none', padding: '9px 0', fontFamily: 'var(--font-body)', fontSize: 13, color: '#26221C', background: 'transparent', minWidth: 0 }} />
          {searchInput && (
            <button type="button" onClick={handleClearSearch}
              style={{ padding: '0 10px', background: 'none', border: 'none', color: '#A89F8C', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <IcoClose />
            </button>
          )}
          <button type="submit"
            style={{ padding: '0 14px', background: '#2D6A4F', border: 'none', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Search
          </button>
        </form>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 4, background: '#F5F0E8', borderRadius: 10, padding: 4 }}>
          {[
            { key: 'all',     label: 'All' },
            { key: 'active',  label: 'Active' },
            { key: 'blocked', label: 'Blocked' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => { setFilter(key); setPage(1) }}
              style={{ padding: '6px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: key === filter ? 600 : 400, background: key === filter ? '#fff' : 'transparent', color: key === filter ? '#26221C' : '#7A7265', boxShadow: key === filter ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table (desktop) / Card list (mobile) ───────────────────────── */}
      <div className="anim-in" style={{ background: '#fff', borderRadius: 16, border: '1px solid #F0EBE1', overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>

        {/* DESKTOP TABLE */}
        <div className="customer-table-wrap">
          <table ref={tableRef} style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFAF7', borderBottom: '1px solid #F0EBE1' }}>
                {['Customer', 'Email', 'Phone', 'Joined', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, color: '#7A7265', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : !customers.length ? (
                <tr>
                  <td colSpan={6} style={{ padding: '56px 24px', textAlign: 'center' }}>
                    <div style={{ color: '#D0C8B5', display: 'flex', justifyContent: 'center', marginBottom: 12 }}><IcoUsers /></div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#A89F8C', margin: 0 }}>
                      {search ? `No customers found for "${search}"` : 'No customers yet.'}
                    </p>
                  </td>
                </tr>
              ) : (
                customers.map(c => (
                  <tr key={c._id}
                    style={{ borderBottom: '1px solid #F5F0E8', transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FAFAF7'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                        <Avatar name={c.name} size={34} blocked={c.isBlocked} />
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: '#26221C', whiteSpace: 'nowrap' }}>{c.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#5C5548', wordBreak: 'break-all' }}>{c.email}</span>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#5C5548' }}>{c.phone || '—'}</span>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#7A7265' }}>{fmtDate(c.createdAt)}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {c.isBlocked
                        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 99, background: 'rgba(220,38,38,0.08)', color: '#DC2626', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)' }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: '#DC2626' }} /> Blocked</span>
                        : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 99, background: 'rgba(6,95,70,0.07)', color: '#065F46', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)' }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981' }} /> Active</span>
                      }
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button onClick={() => setSelectedId(c._id)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 8, border: '1.5px solid #E8E0D0', background: '#fff', color: '#5C5548', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#2D6A4F'; e.currentTarget.style.color = '#2D6A4F' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E0D0'; e.currentTarget.style.color = '#5C5548' }}>
                          <IcoEye /> View
                        </button>
                        <BlockCell customer={c} onToggle={handleBlockToggled} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARD LIST — hidden on desktop via CSS */}
        <div className="customer-card-list">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ padding: '14px 16px', borderBottom: '1px solid #F5F0E8', display: 'flex', gap: 12, alignItems: 'center' }}>
                <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <div className="skeleton" style={{ height: 12, width: '55%', borderRadius: 5 }} />
                  <div className="skeleton" style={{ height: 11, width: '75%', borderRadius: 5 }} />
                </div>
              </div>
            ))
          ) : !customers.length ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ color: '#D0C8B5', display: 'flex', justifyContent: 'center', marginBottom: 10 }}><IcoUsers /></div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#A89F8C', margin: 0 }}>
                {search ? `No results for "${search}"` : 'No customers yet.'}
              </p>
            </div>
          ) : (
            customers.map(c => (
              <div key={c._id} style={{ padding: '14px 16px', borderBottom: '1px solid #F5F0E8', display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar name={c.name} size={40} blocked={c.isBlocked} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 2 }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: '#26221C' }}>{c.name}</span>
                    {c.isBlocked
                      ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '1px 7px', borderRadius: 99, background: 'rgba(220,38,38,0.08)', color: '#DC2626', fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-body)' }}>Blocked</span>
                      : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '1px 7px', borderRadius: 99, background: 'rgba(6,95,70,0.07)', color: '#065F46', fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-body)' }}>Active</span>
                    }
                  </div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#7A7265', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C', margin: '1px 0 0' }}>Joined {fmtDate(c.createdAt)}</p>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => setSelectedId(c._id)}
                    style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #E8E0D0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5C5548' }}>
                    <IcoEye />
                  </button>
                  <BlockCell customer={c} onToggle={handleBlockToggled} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ padding: '14px 20px', borderTop: '1px solid #F0EBE1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#A89F8C' }}>
              Page {page} of {pages} · {total} customer{total !== 1 ? 's' : ''}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => { const p = page - 1; setPage(p); load(p) }} disabled={page <= 1}
                style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #E8E0D0', background: '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: page <= 1 ? '#D0C8B5' : '#5C5548', transition: 'all 0.15s' }}>
                <IcoChevL />
              </button>
              {/* Page numbers */}
              {Array.from({ length: pages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === pages || Math.abs(p - page) <= 1)
                .reduce((acc, p, i, arr) => {
                  if (i > 0 && p - arr[i-1] > 1) acc.push('...')
                  acc.push(p); return acc
                }, [])
                .map((p, i) => p === '...' ? (
                  <span key={`d${i}`} style={{ width: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body)', fontSize: 13, color: '#A89F8C' }}>…</span>
                ) : (
                  <button key={p} onClick={() => { setPage(p); load(p) }}
                    style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${p === page ? '#2D6A4F' : '#E8E0D0'}`, background: p === page ? '#2D6A4F' : '#fff', color: p === page ? '#fff' : '#5C5548', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: p === page ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>
                    {p}
                  </button>
                ))
              }
              <button onClick={() => { const p = page + 1; setPage(p); load(p) }} disabled={page >= pages}
                style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #E8E0D0', background: '#fff', cursor: page >= pages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: page >= pages ? '#D0C8B5' : '#5C5548', transition: 'all 0.15s' }}>
                <IcoChevR />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Customer detail modal ─────────────────────────────────── */}
      {selectedId && (
        <CustomerModal
          customerId={selectedId}
          onClose={() => setSelectedId(null)}
          onBlockToggled={handleBlockToggled}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Stat cards: 3-col desktop → 1-col on small mobile */
        .customer-stat-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 20px;
        }
        @media (max-width: 480px) {
          .customer-stat-cards { grid-template-columns: 1fr; gap: 8px; }
        }

        /* Desktop table visible, mobile cards hidden */
        .customer-table-wrap { display: block; }
        .customer-card-list  { display: none;  }

        /* On mobile: swap to card list */
        @media (max-width: 640px) {
          .customer-table-wrap { display: none;  }
          .customer-card-list  { display: block; }
        }

        /* Customer modal stats: 3-col → stacked on narrow modal */
        .customer-modal-stats { grid-template-columns: repeat(3,1fr); }
        @media (max-width: 480px) {
          .customer-modal-stats { grid-template-columns: 1fr; }
          .customer-modal-stats > div { border-right: none !important; border-bottom: 1px solid #F5F0E8; text-align: left; padding: 12px 16px; }
        }

        .skeleton {
          background: linear-gradient(90deg, #F5F0E8 25%, #EDE8DF 50%, #F5F0E8 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}
