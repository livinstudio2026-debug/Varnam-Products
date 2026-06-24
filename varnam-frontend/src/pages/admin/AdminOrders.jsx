// src/pages/admin/AdminOrders.jsx — Step 22
// Order management: list, status tabs, order detail modal, status advance,
// cancel with refund, cancellation request review (approve / reject).
// All modals use createPortal to escape the overflow:auto admin <main>.

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import toast from 'react-hot-toast'
import { orderAPI, adminAPI } from '../../services/api'

/* ─── Icons ──────────────────────────────────────────────────────────────── */
const Ico = ({ d, children, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
)
const IcoSearch    = () => <Ico><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Ico>
const IcoClose     = () => <Ico><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Ico>
const IcoLoader    = () => <Ico><path d="M21 12a9 9 0 1 1-6.219-8.56"/></Ico>
const IcoChevronR  = () => <Ico><polyline points="9 18 15 12 9 6"/></Ico>
const IcoChevronL  = () => <Ico><polyline points="15 18 9 12 15 6"/></Ico>
const IcoArrowUp   = () => <Ico><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></Ico>
const IcoRefresh   = () => <Ico><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></Ico>
const IcoCancel    = () => <Ico><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></Ico>
const IcoCheck     = () => <Ico><polyline points="20 6 9 17 4 12"/></Ico>
const IcoBox       = () => <Ico><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></Ico>
const IcoUser      = () => <Ico><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></Ico>
const IcoEye       = () => <Ico><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></Ico>
const IcoAlert     = () => <Ico><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></Ico>

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const fmtDateShort = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

/* ─── Status / Payment config ────────────────────────────────────────────── */
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

const P = {
  'Pending':  { color: '#6B7280' },
  'Paid':     { color: '#065F46' },
  'Failed':   { color: '#DC2626' },
  'Refunded': { color: '#7C3AED' },
  'Cancelled':{ color: '#6B7280' },
}

// Valid next statuses per current status (mirrors server's isValidStatusTransition)
const NEXT_STATUS = {
  'Pending Manual Review': ['Ordered', 'Cancelled'],
  'Ordered':               ['Packed',  'Cancelled'],
  'Packed':                ['Shipped', 'Cancelled'],
  'Shipped':               ['Out For Delivery'],
  'Out For Delivery':      ['Delivered'],
}

/* ─── Status badge ───────────────────────────────────────────────────────── */
function StatusBadge({ status, small }) {
  const cfg = S[status] || S['Ordered']
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: small ? '2px 8px' : '3px 10px', borderRadius: 99,
      background: cfg.bg, color: cfg.color,
      fontSize: small ? 10 : 11, fontWeight: 700, whiteSpace: 'nowrap',
      fontFamily: 'var(--font-body)',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {status}
    </span>
  )
}

/* ─── Skeleton row ───────────────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr style={{ borderBottom: '1px solid #F5F0E8' }}>
      {[55, 45, 60, 35, 45, 35, 40].map((w, i) => (
        <td key={i} style={{ padding: '13px 14px' }}>
          <div style={{ height: 13, width: `${w}%`, borderRadius: 6, background: '#F0EBE1', animation: 'pulse 1.5s ease-in-out infinite' }} />
        </td>
      ))}
    </tr>
  )
}

/* ─── Pagination ─────────────────────────────────────────────────────────── */
function Pagination({ page, pages, total, onChange }) {
  if (pages <= 1) return null
  const nums = Array.from({ length: pages }, (_, i) => i + 1)
    .filter(n => n === 1 || n === pages || Math.abs(n - page) <= 1)
    .reduce((acc, n, i, arr) => { if (i > 0 && n - arr[i - 1] > 1) acc.push('…'); acc.push(n); return acc }, [])

  const btn = (label, onClick, disabled, active) => (
    <button key={String(label)} onClick={onClick} disabled={disabled} style={{
      minWidth: 32, height: 32, borderRadius: 8, border: active ? 'none' : '1.5px solid #E8E0D0',
      background: active ? '#2D6A4F' : disabled ? 'transparent' : '#fff',
      color: active ? '#fff' : disabled ? '#D0C8B5' : '#3D3830',
      fontSize: 12, fontWeight: active ? 700 : 500, cursor: disabled ? 'default' : 'pointer',
      fontFamily: 'var(--font-body)', padding: '0 8px',
      boxShadow: active ? '0 3px 10px rgba(45,106,79,0.25)' : 'none', transition: 'all 0.15s',
    }}>{label}</button>
  )
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderTop: '1px solid #F5F0E8', flexWrap: 'wrap', gap: 8 }}>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C', margin: 0 }}>
        Page {page} of {pages} · {total} orders
      </p>
      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
        {btn(<IcoChevronL />, () => onChange(page - 1), page === 1, false)}
        {nums.map((n, i) => n === '…'
          ? <span key={`e${i}`} style={{ width: 24, textAlign: 'center', color: '#A89F8C', fontSize: 12 }}>…</span>
          : btn(n, () => onChange(n), false, n === page)
        )}
        {btn(<IcoChevronR />, () => onChange(page + 1), page === pages, false)}
      </div>
    </div>
  )
}

/* ─── Order detail + action modal ────────────────────────────────────────── */
function OrderDetailModal({ order: initialOrder, onClose, onOrderUpdated }) {
  const [order, setOrder]           = useState(initialOrder)
  const [advancing, setAdvancing]   = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [skipRefund, setSkipRefund] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const overlayRef = useRef(null)
  const panelRef   = useRef(null)

  useGSAP(() => {
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.22 })
    gsap.fromTo(panelRef.current,   { x: '100%' }, { x: '0%', duration: 0.36, ease: 'power4.out' })
  }, { scope: overlayRef })

  const close = () => {
    gsap.to(panelRef.current,   { x: '100%', duration: 0.26, ease: 'power3.in' })
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.26, onComplete: onClose })
  }

  const nextStatuses = NEXT_STATUS[order.orderStatus] || []

  const handleAdvance = async (newStatus) => {
    setAdvancing(true)
    try {
      const { data } = await orderAPI.updateStatus(order._id, newStatus)
      if (data.success) {
        const updated = data.data
        setOrder(updated)
        onOrderUpdated(updated)
        toast.success(`Status → ${newStatus}`)
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Status update failed')
    } finally { setAdvancing(false) }
  }

  const handleCancel = async () => {
    setCancelling(true)
    try {
      const { data } = await orderAPI.cancelOrder(order._id, skipRefund)
      if (data.success) {
        const updated = data.data
        setOrder(updated)
        onOrderUpdated(updated)
        setCancelOpen(false)
        toast.success('Order cancelled')
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Cancellation failed')
    } finally { setCancelling(false) }
  }

  const isPaid     = order.paymentMethod === 'RAZORPAY' && order.paymentStatus === 'Paid'
  const canCancel  = ['Pending Manual Review', 'Ordered', 'Packed'].includes(order.orderStatus)

  return createPortal(
    <div ref={overlayRef} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15,12,8,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{ flex: 1 }} onClick={close} />

      <div ref={panelRef} style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 600, background: '#fff', display: 'flex', flexDirection: 'column', boxShadow: '-12px 0 48px rgba(0,0,0,0.14)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: '1px solid #F0EBE1', flexShrink: 0 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, color: '#26221C', margin: 0 }}>{order.orderNumber}</h2>
              <StatusBadge status={order.orderStatus} />
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#A89F8C', margin: '3px 0 0' }}>
              {fmtDate(order.createdAt)} · {order.paymentMethod}
              {' · '}
              <span style={{ color: P[order.paymentStatus]?.color || '#6B7280', fontWeight: 600 }}>{order.paymentStatus}</span>
            </p>
          </div>
          <button onClick={close} style={{ width: 32, height: 32, borderRadius: '50%', background: '#F5F0E8', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5C5548' }}>
            <IcoClose />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Customer */}
          <Section title="Customer" icon={<IcoUser />}>
            <Row label="Name"    value={order.customerName} />
            <Row label="Email"   value={order.customerEmail} />
            <Row label="Phone"   value={order.customerPhone} />
            {order.user && <Row label="Account" value="Registered customer" accent />}
          </Section>

          {/* Shipping address */}
          <Section title="Shipping Address">
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#3D3830', lineHeight: 1.65, margin: 0 }}>
              {order.shippingAddress.street}<br />
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
            </p>
          </Section>

          {/* Order items */}
          <Section title={`Items (${order.orderItems.length})`} icon={<IcoBox />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {order.orderItems.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#FAFAF7', borderRadius: 11, border: '1px solid #F0EBE1' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 9, overflow: 'hidden', background: '#F5F0E8', flexShrink: 0, border: '1px solid #E8E0D0' }}>
                    {item.product?.images?.[0]
                      ? <img src={item.product.images[0]} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C4B9A8' }}><IcoBox /></div>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: '#26221C', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C', margin: '2px 0 0' }}>Qty: {item.quantity} × {fmt(item.price)}</p>
                  </div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, color: '#26221C', margin: 0, flexShrink: 0 }}>
                    {fmt(item.quantity * item.price)}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          {/* Price breakdown */}
          <Section title="Price Summary">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <PriceRow label="Subtotal"     value={fmt(order.subtotal)} />
              <PriceRow label="Shipping"     value={order.shippingFee === 0 ? 'FREE' : fmt(order.shippingFee)} accent={order.shippingFee === 0} />
              <div style={{ height: 1, background: '#F0EBE1', margin: '4px 0' }} />
              <PriceRow label="Total" value={fmt(order.totalPrice)} bold />
            </div>
          </Section>

          {/* Cancellation request — if one exists */}
          {order.cancellationRequest?.status && (
            <CancelRequestSection order={order} onOrderUpdated={(updated) => { setOrder(updated); onOrderUpdated(updated) }} />
          )}

        </div>

        {/* Footer actions */}
        <div style={{ padding: '14px 22px', borderTop: '1px solid #F0EBE1', display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0, background: '#fff' }}>

          {/* Advance status buttons */}
          {nextStatuses.filter(s => s !== 'Cancelled').length > 0 && (
            <div style={{ display: 'flex', gap: 8 }}>
              {nextStatuses.filter(s => s !== 'Cancelled').map(s => (
                <button key={s} onClick={() => handleAdvance(s)} disabled={advancing}
                  style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#2D6A4F,#1B4332)', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, cursor: advancing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: advancing ? 0.7 : 1, boxShadow: '0 3px 12px rgba(45,106,79,0.25)' }}>
                  {advancing
                    ? <><span style={{ animation: 'spin 0.8s linear infinite', display: 'flex' }}><IcoLoader /></span> Updating…</>
                    : <><IcoArrowUp /> Mark as {s}</>
                  }
                </button>
              ))}
            </div>
          )}

          {/* Cancel order */}
          {canCancel && !cancelOpen && (
            <button onClick={() => setCancelOpen(true)}
              style={{ padding: '9px', borderRadius: 10, border: '1.5px solid #FCA5A5', background: '#FEF2F2', color: '#DC2626', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <IcoCancel /> Cancel Order
            </button>
          )}

          {/* Cancel confirmation panel */}
          {cancelOpen && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: '#DC2626', margin: 0 }}>
                Confirm cancellation of {order.orderNumber}?
              </p>
              {isPaid && (
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={skipRefund} onChange={e => setSkipRefund(e.target.checked)}
                    style={{ marginTop: 2, accentColor: '#DC2626', width: 14, height: 14, flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#5C5548', lineHeight: 1.5 }}>
                    Skip Razorpay refund API call — I've already refunded via the Razorpay dashboard
                  </span>
                </label>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setCancelOpen(false); setSkipRefund(false) }}
                  style={{ flex: 1, padding: '8px', borderRadius: 9, border: '1.5px solid #E8E0D0', background: '#fff', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: '#5C5548', cursor: 'pointer' }}>
                  Go back
                </button>
                <button onClick={handleCancel} disabled={cancelling}
                  style={{ flex: 2, padding: '8px', borderRadius: 9, border: 'none', background: '#DC2626', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, cursor: cancelling ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {cancelling
                    ? <><span style={{ animation: 'spin 0.8s linear infinite', display: 'flex' }}><IcoLoader /></span> Cancelling…</>
                    : 'Confirm Cancel'
                  }
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>,
    document.body
  )
}

/* ─── Cancel request section (inside detail modal) ───────────────────────── */
function CancelRequestSection({ order, onOrderUpdated }) {
  const req = order.cancellationRequest
  const [note, setNote]       = useState('')
  const [saving, setSaving]   = useState(null) // 'approve' | 'reject' | null
  const isPending = req.status === 'Pending'

  const handle = async (action) => {
    setSaving(action)
    try {
      let data
      if (action === 'approve') {
        ({ data } = await adminAPI.approveCancelRequest(order._id))
      } else {
        ({ data } = await adminAPI.rejectCancelRequest(order._id, note))
      }
      if (data.success) {
        onOrderUpdated(data.data)
        toast.success(action === 'approve' ? 'Request approved — order cancelled' : 'Request rejected')
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || `${action} failed`)
    } finally { setSaving(null) }
  }

  const statusColor = { Pending: '#D97706', Approved: '#065F46', Rejected: '#DC2626' }

  return (
    <Section title="Cancellation Request" icon={<IcoAlert />} accent="amber">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, color: statusColor[req.status] || '#6B7280', background: `${statusColor[req.status]}18`, padding: '2px 9px', borderRadius: 99 }}>
            {req.status}
          </span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C' }}>{fmtDateShort(req.requestedAt)}</span>
        </div>

        <div style={{ background: '#FAFAF7', borderRadius: 10, padding: '10px 12px', border: '1px solid #F0EBE1' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#5C5548', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
            "{req.reason}"
          </p>
        </div>

        {req.adminNote && (
          <div style={{ background: 'rgba(220,38,38,0.04)', borderRadius: 10, padding: '8px 12px', border: '1px solid rgba(220,38,38,0.12)' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C', margin: '0 0 3px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Admin note</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#5C5548', margin: 0 }}>{req.adminNote}</p>
          </div>
        )}

        {isPending && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Optional rejection note for customer…"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #E8E0D0', background: '#FAFAF7', fontFamily: 'var(--font-body)', fontSize: 12, color: '#26221C', outline: 'none', resize: 'vertical', minHeight: 72, boxSizing: 'border-box', lineHeight: 1.55 }}
              onFocus={e => e.target.style.borderColor = '#2D6A4F'}
              onBlur={e => e.target.style.borderColor = '#E8E0D0'}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => handle('reject')} disabled={!!saving}
                style={{ flex: 1, padding: '9px', borderRadius: 9, border: '1.5px solid #FCA5A5', background: '#FEF2F2', color: '#DC2626', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                {saving === 'reject' ? <><span style={{ animation: 'spin 0.8s linear infinite', display: 'flex' }}><IcoLoader /></span> Rejecting…</> : <><IcoClose /> Reject</>}
              </button>
              <button onClick={() => handle('approve')} disabled={!!saving}
                style={{ flex: 1, padding: '9px', borderRadius: 9, border: 'none', background: '#2D6A4F', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                {saving === 'approve' ? <><span style={{ animation: 'spin 0.8s linear infinite', display: 'flex' }}><IcoLoader /></span> Approving…</> : <><IcoCheck /> Approve</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </Section>
  )
}

/* ─── Shared detail-panel building blocks ────────────────────────────────── */
function Section({ title, icon, children, accent }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon && <span style={{ color: accent === 'amber' ? '#C8893A' : '#A89F8C' }}>{icon}</span>}
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: accent === 'amber' ? '#C8893A' : '#A89F8C', margin: 0 }}>{title}</p>
      </div>
      <div style={{ background: '#FAFAF7', borderRadius: 12, border: '1px solid #F0EBE1', padding: '12px 14px' }}>
        {children}
      </div>
    </div>
  )
}
function Row({ label, value, accent }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #F5F0E8' }}>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#A89F8C' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: accent ? 600 : 500, color: accent ? '#2D6A4F' : '#26221C' }}>{value}</span>
    </div>
  )
}
function PriceRow({ label, value, bold, accent }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#A89F8C' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: bold ? 15 : 12, fontWeight: bold ? 700 : 500, color: accent ? '#2D6A4F' : '#26221C' }}>{value}</span>
    </div>
  )
}

/* ─── Order table row ────────────────────────────────────────────────────── */
function OrderRow({ order, onView }) {
  const totalQty = order.orderItems?.reduce((s, i) => s + i.quantity, 0) || 0

  return (
    <tr style={{ borderBottom: '1px solid #F5F0E8', transition: 'background 0.12s', cursor: 'pointer' }}
      onClick={() => onView(order)}
      onMouseEnter={e => e.currentTarget.style.background = '#FAFAF7'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Order number */}
      <td style={{ padding: '11px 14px' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, color: '#2D6A4F', margin: 0 }}>{order.orderNumber}</p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: '#A89F8C', margin: '2px 0 0' }}>{fmtDateShort(order.createdAt)}</p>
      </td>

      {/* Customer */}
      <td style={{ padding: '11px 14px' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: '#26221C', margin: 0, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.customerName}</p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: '#A89F8C', margin: '2px 0 0', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.customerEmail}</p>
      </td>

      {/* Total */}
      <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, color: '#26221C', margin: 0 }}>{fmt(order.totalPrice)}</p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: '#A89F8C', margin: '2px 0 0' }}>{totalQty} item{totalQty !== 1 ? 's' : ''}</p>
      </td>

      {/* Payment */}
      <td style={{ padding: '11px 14px' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, color: P[order.paymentStatus]?.color || '#6B7280', margin: 0 }}>{order.paymentStatus}</p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: '#A89F8C', margin: '2px 0 0' }}>{order.paymentMethod}</p>
      </td>

      {/* Status */}
      <td style={{ padding: '11px 14px' }}><StatusBadge status={order.orderStatus} small /></td>

      {/* Cancel request indicator */}
      <td style={{ padding: '11px 14px' }}>
        {order.cancellationRequest?.status === 'Pending' && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(217,119,6,0.1)', color: '#D97706', borderRadius: 99, fontSize: 10, fontWeight: 700, padding: '2px 8px', fontFamily: 'var(--font-body)' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#D97706' }} />
            Pending
          </span>
        )}
      </td>

      {/* View button */}
      <td style={{ padding: '11px 14px', textAlign: 'right' }}>
        <button onClick={e => { e.stopPropagation(); onView(order) }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 11px', borderRadius: 8, border: '1.5px solid #E8E0D0', background: '#fff', color: '#5C5548', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F5F0E8'; e.currentTarget.style.borderColor = '#C4B9A8' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#E8E0D0' }}>
          <IcoEye /> View
        </button>
      </td>
    </tr>
  )
}

/* ─── Status tabs ────────────────────────────────────────────────────────── */
const TABS = [
  { key: 'all',                   label: 'All' },
  { key: 'Pending Manual Review', label: 'Review' },
  { key: 'Ordered',               label: 'Ordered' },
  { key: 'Packed',                label: 'Packed' },
  { key: 'Shipped',               label: 'Shipped' },
  { key: 'Out For Delivery',      label: 'Out for Delivery' },
  { key: 'Delivered',             label: 'Delivered' },
  { key: 'Cancelled',             label: 'Cancelled' },
  { key: 'cancel-requests',       label: '⚑ Cancel Requests', special: true },
]

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function AdminOrders() {
  const [orders, setOrders]         = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 })
  const [loading, setLoading]       = useState(true)
  const [tab, setTab]               = useState('all')
  const [page, setPage]             = useState(1)
  const [search, setSearch]         = useState('')
  const [viewOrder, setViewOrder]   = useState(null)

  // Cancel requests sub-tab
  const [cancelRequests, setCancelRequests]   = useState([])
  const [crLoading, setCrLoading]             = useState(false)
  const [crFilter, setCrFilter]               = useState('Pending') // 'Pending' | 'Approved' | 'Rejected'

  const tableRef  = useRef(null)
  const headerRef = useRef(null)

  /* ── Fetch orders ──────────────────────────────────────────────────────── */
  const fetchOrders = useCallback(async (pg = 1, currentTab = tab) => {
    setLoading(true)
    try {
      let data
      if (currentTab === 'all') {
        ;({ data } = await orderAPI.getAll({ page: pg, limit: 20 }))
      } else {
        ;({ data } = await orderAPI.getByStatus(currentTab, { page: pg, limit: 20 }))
      }
      if (data.success) {
        setOrders(data.data)
        setPagination(data.pagination || { total: 0, page: pg, pages: 1 })
      }
    } catch { toast.error('Failed to load orders') }
    finally { setLoading(false) }
  }, [tab])

  /* ── Fetch cancel requests ─────────────────────────────────────────────── */
  const fetchCancelRequests = useCallback(async (status = crFilter) => {
    setCrLoading(true)
    try {
      const { data } = await adminAPI.getCancelRequests(status)
      if (data.success) setCancelRequests(data.data)
    } catch { toast.error('Failed to load cancel requests') }
    finally { setCrLoading(false) }
  }, [crFilter])

  useEffect(() => {
    if (tab === 'cancel-requests') { fetchCancelRequests(crFilter); return }
    fetchOrders(page, tab)
  }, [tab, page])

  useEffect(() => {
    if (tab === 'cancel-requests') fetchCancelRequests(crFilter)
  }, [crFilter])

  /* ── Entrance animation ────────────────────────────────────────────────── */
  useGSAP(() => {
    if (headerRef.current)
      gsap.fromTo(headerRef.current, { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' })
  }, [])

  useGSAP(() => {
    if (!loading && tableRef.current) {
      gsap.fromTo(tableRef.current.querySelectorAll('tbody tr'),
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, stagger: 0.025, duration: 0.3, ease: 'power3.out' }
      )
    }
  }, [loading])

  /* ── Handlers ──────────────────────────────────────────────────────────── */
  const handleTabChange = (key) => {
    setTab(key); setPage(1); setSearch('')
  }

  const handleOrderUpdated = (updated) => {
    setOrders(prev => prev.map(o => o._id === updated._id ? updated : o))
    if (viewOrder?._id === updated._id) setViewOrder(updated)
    // refresh cancel-requests badge count
    if (tab === 'cancel-requests') fetchCancelRequests(crFilter)
  }

  /* ── Client-side search filter ─────────────────────────────────────────── */
  const visible = search
    ? orders.filter(o => {
        const q = search.toLowerCase()
        return o.orderNumber.toLowerCase().includes(q) ||
               o.customerName.toLowerCase().includes(q) ||
               o.customerEmail.toLowerCase().includes(q)
      })
    : orders

  /* ── Render ────────────────────────────────────────────────────────────── */
  return (
    <div>
      {/* Page header */}
      <div ref={headerRef} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.3rem,2vw,1.7rem)', color: '#26221C', margin: '0 0 4px' }}>Orders</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#A89F8C', margin: 0 }}>
            {loading ? 'Loading…' : `${pagination.total} total orders`}
          </p>
        </div>
        <button
          onClick={() => tab === 'cancel-requests' ? fetchCancelRequests(crFilter) : fetchOrders(page)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1.5px solid #E8E0D0', background: '#fff', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: '#5C5548', cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#2D6A4F'; e.currentTarget.style.color = '#2D6A4F' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E0D0'; e.currentTarget.style.color = '#5C5548' }}>
          <IcoRefresh /> Refresh
        </button>
      </div>

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16, borderBottom: '1px solid #F0EBE1', paddingBottom: 12 }}>
        {TABS.map(({ key, label, special }) => (
          <button key={key} onClick={() => handleTabChange(key)}
            style={{
              padding: '6px 13px', borderRadius: 9, border: tab === key ? 'none' : '1.5px solid #E8E0D0',
              background: tab === key ? (special ? '#D97706' : '#2D6A4F') : '#fff',
              color: tab === key ? '#fff' : special ? '#D97706' : '#5C5548',
              fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: tab === key ? 700 : 500,
              cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
              boxShadow: tab === key ? `0 3px 10px rgba(${special ? '217,119,6' : '45,106,79'},0.25)` : 'none',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Cancel requests view ──────────────────────────────────────────── */}
      {tab === 'cancel-requests' ? (
        <CancelRequestsView
          requests={cancelRequests}
          loading={crLoading}
          filter={crFilter}
          onFilterChange={setCrFilter}
          onViewOrder={(order) => setViewOrder(order)}
          onRequestHandled={() => fetchCancelRequests(crFilter)}
        />
      ) : (
        /* ── Orders table ──────────────────────────────────────────────── */
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #F0EBE1', boxShadow: '0 2px 16px rgba(45,106,79,0.06)', overflow: 'hidden' }}>

          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '1px solid #F5F0E8', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, border: '1.5px solid #E8E0D0', background: '#FAFAF7', flex: 1, minWidth: 220 }}>
              <span style={{ color: '#A89F8C', flexShrink: 0 }}><IcoSearch /></span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search order number, name or email…"
                style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-body)', fontSize: 13, color: '#26221C', width: '100%' }} />
              {search && (
                <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A89F8C', display: 'flex', padding: 0 }}><IcoClose /></button>
              )}
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table ref={tableRef} style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FAFAF7', borderBottom: '1px solid #F0EBE1' }}>
                  {['Order', 'Customer', 'Total', 'Payment', 'Status', 'Cancel Req.', ''].map((h, i) => (
                    <th key={i} style={{ padding: '9px 14px', fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, color: '#A89F8C', letterSpacing: '0.07em', textTransform: 'uppercase', textAlign: i === 6 ? 'right' : 'left', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                  : visible.length === 0
                  ? (
                    <tr><td colSpan={7} style={{ padding: '48px 24px', textAlign: 'center' }}>
                      <div style={{ color: '#C4B9A8', display: 'flex', justifyContent: 'center', marginBottom: 10 }}><IcoBox /></div>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#A89F8C', margin: 0 }}>
                        {search ? `No orders matching "${search}"` : 'No orders found'}
                      </p>
                    </td></tr>
                  )
                  : visible.map(o => <OrderRow key={o._id} order={o} onView={setViewOrder} />)
                }
              </tbody>
            </table>
          </div>

          {/* Pagination — not shown when search is active */}
          {!search && (
            <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
          )}
        </div>
      )}

      {/* Order detail modal */}
      {viewOrder && (
        <OrderDetailModal
          order={viewOrder}
          onClose={() => setViewOrder(null)}
          onOrderUpdated={handleOrderUpdated}
        />
      )}

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.45; } }
      `}</style>
    </div>
  )
}

/* ─── Cancel Requests view (own section) ─────────────────────────────────── */
function CancelRequestsView({ requests, loading, filter, onFilterChange, onViewOrder, onRequestHandled }) {
  const [acting, setActing] = useState({}) // { [orderId]: 'approve'|'reject' }
  const [notes, setNotes]   = useState({}) // { [orderId]: string }

  const handle = async (order, action) => {
    setActing(a => ({ ...a, [order._id]: action }))
    try {
      let data
      if (action === 'approve') {
        ;({ data } = await adminAPI.approveCancelRequest(order._id))
      } else {
        ;({ data } = await adminAPI.rejectCancelRequest(order._id, notes[order._id] || ''))
      }
      if (data.success) {
        toast.success(action === 'approve' ? 'Request approved' : 'Request rejected')
        onRequestHandled()
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || `${action} failed`)
    } finally { setActing(a => { const n = { ...a }; delete n[order._id]; return n }) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 6 }}>
        {['Pending', 'Approved', 'Rejected'].map(s => (
          <button key={s} onClick={() => onFilterChange(s)}
            style={{ padding: '5px 14px', borderRadius: 9, border: filter === s ? 'none' : '1.5px solid #E8E0D0', background: filter === s ? '#2D6A4F' : '#fff', color: filter === s ? '#fff' : '#5C5548', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: filter === s ? 700 : 500, cursor: 'pointer', transition: 'all 0.15s' }}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #F0EBE1', padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#A89F8C' }}>
          <span style={{ animation: 'spin 0.8s linear infinite', display: 'flex' }}><IcoLoader /></span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13 }}>Loading…</span>
        </div>
      ) : requests.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #F0EBE1', padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#A89F8C', margin: 0 }}>No {filter.toLowerCase()} cancel requests</p>
        </div>
      ) : (
        requests.map(order => {
          const req = order.cancellationRequest
          const isActing = !!acting[order._id]
          const statusColor = { Pending: '#D97706', Approved: '#065F46', Rejected: '#DC2626' }

          return (
            <div key={order._id} style={{ background: '#fff', borderRadius: 16, border: '1px solid #F0EBE1', boxShadow: '0 2px 12px rgba(45,106,79,0.05)', overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ display: 'flex', align: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '12px 16px', borderBottom: '1px solid #F5F0E8', background: '#FAFAF7' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, color: '#2D6A4F' }}>{order.orderNumber}</span>
                  <StatusBadge status={order.orderStatus} small />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, color: statusColor[req.status], background: `${statusColor[req.status]}15`, padding: '2px 8px', borderRadius: 99 }}>{req.status}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C' }}>{order.customerName} · {fmtDateShort(req.requestedAt)}</span>
                  <button onClick={() => onViewOrder(order)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, border: '1.5px solid #E8E0D0', background: '#fff', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, color: '#5C5548', cursor: 'pointer' }}>
                    <IcoEye /> View Order
                  </button>
                </div>
              </div>

              {/* Reason */}
              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#3D3830', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
                  "{req.reason}"
                </p>

                {/* Admin note (if rejected) */}
                {req.adminNote && (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#A89F8C', margin: 0 }}>
                    Admin note: <em>{req.adminNote}</em>
                  </p>
                )}

                {/* Action area — only for Pending */}
                {req.status === 'Pending' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <textarea
                      value={notes[order._id] || ''}
                      onChange={e => setNotes(n => ({ ...n, [order._id]: e.target.value }))}
                      placeholder="Optional rejection note…"
                      style={{ width: '100%', padding: '8px 11px', borderRadius: 9, border: '1.5px solid #E8E0D0', background: '#FAFAF7', fontFamily: 'var(--font-body)', fontSize: 12, color: '#26221C', outline: 'none', resize: 'vertical', minHeight: 60, boxSizing: 'border-box', lineHeight: 1.5 }}
                      onFocus={e => e.target.style.borderColor = '#2D6A4F'}
                      onBlur={e => e.target.style.borderColor = '#E8E0D0'}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handle(order, 'reject')} disabled={isActing}
                        style={{ flex: 1, padding: '8px', borderRadius: 9, border: '1.5px solid #FCA5A5', background: '#FEF2F2', color: '#DC2626', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, cursor: isActing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                        {acting[order._id] === 'reject' ? <><span style={{ animation: 'spin 0.8s linear infinite', display: 'flex' }}><IcoLoader /></span> Rejecting…</> : <><IcoClose /> Reject</>}
                      </button>
                      <button onClick={() => handle(order, 'approve')} disabled={isActing}
                        style={{ flex: 1, padding: '8px', borderRadius: 9, border: 'none', background: '#2D6A4F', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, cursor: isActing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                        {acting[order._id] === 'approve' ? <><span style={{ animation: 'spin 0.8s linear infinite', display: 'flex' }}><IcoLoader /></span> Approving…</> : <><IcoCheck /> Approve</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}