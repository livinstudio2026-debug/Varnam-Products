// src/pages/OrderDetail.jsx  —  Step 18
// Covers:
//   GET  /api/orders/:id                  → full order detail (guest accessible)
//   POST /api/orders/:id/cancel-request   → submit cancel request
//   GET  /api/orders/:id/cancel-request   → poll cancel request status

import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useParams, useNavigate }              from 'react-router-dom'
import { gsap }                                      from 'gsap'
import { useGSAP }                                   from '@gsap/react'
import toast                                         from 'react-hot-toast'
import { orderAPI }                                  from '../services/api'

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */
const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

const fmtDateTime = (d) =>
  new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

/* ─────────────────────────────────────────────────────────────────────────────
   STATUS CONFIG  (matches Orders.jsx exactly)
───────────────────────────────────────────────────────────────────────────── */
const STATUS_CONFIG = {
  'Pending Payment':       { color: '#6B7280', bg: 'rgba(107,114,128,0.09)', dot: '#9CA3AF', label: 'Pending Payment',    step: 0 },
  'Pending Manual Review': { color: '#D97706', bg: 'rgba(217,119,6,0.09)',   dot: '#F59E0B', label: 'Under Review',       step: 0 },
  'Ordered':               { color: '#2D6A4F', bg: 'rgba(45,106,79,0.09)',   dot: '#52B788', label: 'Ordered',            step: 1 },
  'Packed':                { color: '#1D4ED8', bg: 'rgba(29,78,216,0.09)',   dot: '#3B82F6', label: 'Packed',             step: 2 },
  'Shipped':               { color: '#C8893A', bg: 'rgba(200,137,58,0.09)',  dot: '#C8893A', label: 'Shipped',            step: 3 },
  'Out For Delivery':      { color: '#7C3AED', bg: 'rgba(124,58,237,0.09)', dot: '#8B5CF6', label: 'Out for Delivery',   step: 4 },
  'Delivered':             { color: '#065F46', bg: 'rgba(6,95,70,0.09)',     dot: '#10B981', label: 'Delivered',          step: 5 },
  'Cancelled':             { color: '#DC2626', bg: 'rgba(220,38,38,0.09)',   dot: '#EF4444', label: 'Cancelled',          step: -1 },
}

const PAYMENT_CONFIG = {
  'Pending':   { color: '#6B7280', label: 'Pending' },
  'Paid':      { color: '#065F46', label: 'Paid' },
  'Failed':    { color: '#DC2626', label: 'Failed' },
  'Refunded':  { color: '#7C3AED', label: 'Refunded' },
  'Cancelled': { color: '#6B7280', label: 'Cancelled' },
}

// Statuses where cancellation is allowed
const CANCELLABLE = ['Ordered', 'Packed']

/* ─────────────────────────────────────────────────────────────────────────────
   ICONS
───────────────────────────────────────────────────────────────────────────── */
const Ico = ({ d, size = 18, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {d}
  </svg>
)

const IconArrowLeft    = () => <Ico d={<><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>} />
const IconBox          = () => <Ico d={<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>} />
const IconMapPin       = () => <Ico d={<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>} />
const IconCreditCard   = () => <Ico d={<><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></>} />
const IconClock        = () => <Ico d={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>} />
const IconXCircle      = () => <Ico d={<><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>} size={20} />
const IconCheckCircle  = () => <Ico d={<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>} size={20} />
const IconAlertCircle  = () => <Ico d={<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>} size={20} />
const IconTruck        = () => <Ico d={<><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 4v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>} />
const IconChevronRight = ({ size = 16 }) => <Ico d={<polyline points="9 18 15 12 9 6"/>} size={size} />
const IconRefresh      = () => <Ico d={<><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></>} size={16} />

/* ─────────────────────────────────────────────────────────────────────────────
   STATUS BADGE
───────────────────────────────────────────────────────────────────────────── */
function StatusBadge({ status, large = false }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['Ordered']
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: large ? '6px 14px' : '3px 10px',
      borderRadius: 99,
      background: cfg.bg, color: cfg.color,
      fontSize: large ? 13 : 11, fontWeight: 700,
      fontFamily: 'var(--font-body)', letterSpacing: '0.02em',
    }}>
      <span style={{ width: large ? 8 : 6, height: large ? 8 : 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   STATUS TIMELINE  (Ordered → Packed → Shipped → Out for Delivery → Delivered)
───────────────────────────────────────────────────────────────────────────── */
const STEPS = ['Ordered', 'Packed', 'Shipped', 'Out For Delivery', 'Delivered']

function StatusTimeline({ status }) {
  const isCancelled = status === 'Cancelled'
  const currentStep = STATUS_CONFIG[status]?.step ?? 0

  if (isCancelled) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 0' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(220,38,38,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626', flexShrink: 0 }}>
        <IconXCircle />
      </div>
      <div>
        <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, color: '#DC2626', fontSize: 14, margin: 0 }}>Order Cancelled</p>
        <p style={{ fontFamily: 'var(--font-body)', color: '#A89F8C', fontSize: 12, margin: '2px 0 0' }}>This order has been cancelled</p>
      </div>
    </div>
  )

  return (
    <div style={{ padding: '8px 0 4px' }}>
      {/* Desktop: horizontal */}
      <div className="timeline-desktop" style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
        {STEPS.map((step, i) => {
          const done    = currentStep > i
          const active  = currentStep === i + 1
          const pending = currentStep < i + 1
          const cfg = STATUS_CONFIG[step]

          return (
            <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              {/* connector line before this dot */}
              {i > 0 && (
                <div style={{
                  position: 'absolute', top: 15, right: '50%', left: '-50%',
                  height: 2,
                  background: done || active
                    ? 'linear-gradient(90deg,#52B788,#2D6A4F)'
                    : '#E8E0D0',
                  zIndex: 0,
                }} />
              )}
              {/* dot */}
              <div style={{
                position: 'relative', zIndex: 1,
                width: 32, height: 32, borderRadius: '50%',
                background: done ? '#2D6A4F' : active ? '#FDF6EC' : '#F5F0E8',
                border: active ? '2px solid #2D6A4F' : done ? 'none' : '2px solid #E8E0D0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: active ? '0 0 0 4px rgba(45,106,79,0.12)' : 'none',
                transition: 'all 0.3s',
              }}>
                {done ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: active ? '#2D6A4F' : '#D0C8B5',
                  }} />
                )}
              </div>
              {/* label */}
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: 11,
                fontWeight: active ? 700 : done ? 500 : 400,
                color: active ? '#2D6A4F' : done ? '#26221C' : '#A89F8C',
                textAlign: 'center', marginTop: 8, lineHeight: 1.3,
                maxWidth: 72,
              }}>
                {cfg?.label || step}
              </p>
            </div>
          )
        })}
      </div>

      <style>{`
        @media (max-width: 600px) {
          .timeline-desktop { flex-direction: column !important; align-items: flex-start !important; gap: 0 !important; }
          .timeline-desktop > div { flex-direction: row !important; align-items: center !important; gap: 12px; width: 100% !important; padding: 6px 0; }
          .timeline-desktop > div > div:first-child { display: none !important; }
          .timeline-desktop > div p { text-align: left !important; max-width: none !important; margin: 0 !important; }
        }
      `}</style>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   CANCEL REQUEST SECTION
   Shows: form (if eligible) OR current request status with polling
───────────────────────────────────────────────────────────────────────────── */
function CancelSection({ order, onCancelSubmitted }) {
  const [requestStatus, setRequestStatus] = useState(null) // null = not fetched yet
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [reason, setReason]               = useState('')
  const [submitting, setSubmitting]       = useState(false)
  const [charCount, setCharCount]         = useState(0)
  const pollRef = useRef(null)

  

  const isCancellable = CANCELLABLE.includes(order.orderStatus)

  // Fetch existing cancel request status
  const fetchCancelStatus = useCallback(async () => {
    try {
      const { data } = await orderAPI.getCancelRequestStatus(order._id)
      if (data.success) setRequestStatus(data?.data?.cancellationRequest)
      else              setRequestStatus(null)
    } catch (err) {
      // 404 means no request exists — that's fine
      if (err?.response?.status === 404) setRequestStatus(null)
    } finally {
      setLoadingStatus(false)
    }
  }, [order._id])

  useEffect(() => {
    fetchCancelStatus()
  }, [fetchCancelStatus])

  // Poll every 30s if request is Pending
  useEffect(() => {
    if (requestStatus?.status === 'Pending') {
      pollRef.current = setInterval(fetchCancelStatus, 30000)
    }
    return () => clearInterval(pollRef.current)
  }, [requestStatus?.status, fetchCancelStatus])

  const handleSubmit = async () => {
    if (!reason.trim())           { toast.error('Please provide a reason for cancellation'); return }
    if (reason.trim().length < 10){ toast.error('Reason must be at least 10 characters'); return }

    setSubmitting(true)
    try {
      await orderAPI.submitCancelRequest(order._id, reason.trim())
      toast.success('Cancellation request submitted')
      onCancelSubmitted()
      await fetchCancelStatus()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isCancellable && !requestStatus && !loadingStatus) return null

  // ── Loading state ──
  if (loadingStatus) return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #F0EBE1', padding: '20px 24px' }}>
      <div className="skeleton" style={{ height: 14, width: 160, borderRadius: 6, marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 80, borderRadius: 10 }} />
    </div>
  )

  // ── Existing request status ──
  if (requestStatus) {
    const isPending  = requestStatus.status === 'Pending'
    const isApproved = requestStatus.status === 'Approved'
    const isRejected = requestStatus.status === 'Rejected'

    return (
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #F0EBE1', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #F5F0E8', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ color: isPending ? '#D97706' : isApproved ? '#065F46' : '#DC2626' }}>
            {isPending ? <IconClock /> : isApproved ? <IconCheckCircle /> : <IconAlertCircle />}
          </div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 15, margin: 0, color: '#26221C' }}>
            Cancellation Request
          </h3>
          <span style={{
            marginLeft: 'auto',
            display: 'inline-flex', alignItems: 'center',
            padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
            fontFamily: 'var(--font-body)',
            background: isPending  ? 'rgba(217,119,6,0.09)'  : isApproved ? 'rgba(6,95,70,0.09)'   : 'rgba(220,38,38,0.09)',
            color:      isPending  ? '#D97706'               : isApproved ? '#065F46'               : '#DC2626',
          }}>
            {requestStatus.status}
          </span>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#A89F8C', margin: '0 0 4px' }}>Your reason</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#26221C', margin: 0, lineHeight: 1.6 }}>
              {requestStatus.reason}
            </p>
          </div>

          {requestStatus.submittedAt && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C', margin: 0 }}>
              Submitted {fmtDateTime(requestStatus.submittedAt)}
            </p>
          )}

          {/* Admin rejection note */}
          {isRejected && requestStatus.adminNote && (
            <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', borderRadius: 10, padding: '12px 14px' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: '#DC2626', margin: '0 0 4px' }}>
                Reason for rejection
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#7A1D1D', margin: 0, lineHeight: 1.6 }}>
                {requestStatus.adminNote}
              </p>
            </div>
          )}

          {isPending && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.15)', borderRadius: 10, padding: '10px 14px' }}>
              <span style={{ animation: 'spin 2s linear infinite', display: 'flex', color: '#D97706' }}><IconRefresh /></span>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#92400E', margin: 0 }}>
                Your request is under review. We'll update you soon. Status refreshes every 30s.
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Submit form (no existing request, order is cancellable) ──
  if (!isCancellable) return null

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #F0EBE1', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #F5F0E8', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ color: '#DC2626' }}><IconXCircle /></div>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 15, margin: 0, color: '#26221C' }}>
          Request Cancellation
        </h3>
      </div>
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#7A7265', margin: 0, lineHeight: 1.6 }}>
          You can request a cancellation while the order is in <strong>Ordered</strong> or <strong>Packed</strong> status.
          Once shipped, cancellations are not accepted. Our team will review your request.
        </p>
        <div>
          <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: '#3D3830', marginBottom: 6 }}>
            Reason for cancellation <span style={{ color: '#DC2626' }}>*</span>
          </label>
          <textarea
            value={reason}
            onChange={e => { setReason(e.target.value); setCharCount(e.target.value.length) }}
            placeholder="Please describe why you want to cancel this order…"
            maxLength={500}
            rows={4}
            disabled={submitting}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '12px 14px', borderRadius: 12,
              border: '1.5px solid #E8E0D0', background: '#FAFAF7',
              fontFamily: 'var(--font-body)', fontSize: 13, color: '#26221C',
              lineHeight: 1.6, resize: 'vertical',
              outline: 'none', transition: 'border-color 0.2s',
            }}
            onFocus={e => { e.target.style.borderColor = '#2D6A4F' }}
            onBlur={e  => { e.target.style.borderColor = '#E8E0D0' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: charCount < 10 ? '#DC2626' : '#A89F8C' }}>
              {charCount < 10 ? `${10 - charCount} more characters required` : ''}
            </span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C' }}>
              {charCount}/500
            </span>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || reason.trim().length < 10}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '11px 22px', borderRadius: 12, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
            background: submitting || reason.trim().length < 10 ? '#F5F0E8' : 'rgba(220,38,38,0.08)',
            color:      submitting || reason.trim().length < 10 ? '#A89F8C' : '#DC2626',
            fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
            border: '1.5px solid',
            borderColor: submitting || reason.trim().length < 10 ? '#E8E0D0' : 'rgba(220,38,38,0.25)',
            transition: 'all 0.2s', alignSelf: 'flex-start',
          }}
        >
          {submitting ? (
            <>
              <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(220,38,38,0.3)', borderTopColor: '#DC2626', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
              Submitting…
            </>
          ) : (
            <> <IconXCircle /> Submit Request </>
          )}
        </button>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION CARD WRAPPER
───────────────────────────────────────────────────────────────────────────── */
function SectionCard({ title, icon, children, noPad = false }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #F0EBE1', overflow: 'hidden', boxShadow: '0 2px 12px rgba(45,106,79,0.04)' }}>
      {title && (
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #F5F0E8', display: 'flex', alignItems: 'center', gap: 10 }}>
          {icon && <div style={{ color: '#2D6A4F' }}>{icon}</div>}
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 15, margin: 0, color: '#26221C' }}>{title}</h2>
        </div>
      )}
      <div style={noPad ? {} : { padding: '18px 20px' }}>
        {children}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   SKELETON
───────────────────────────────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* header skeleton */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #F0EBE1', padding: '20px 24px' }}>
        <div className="skeleton" style={{ height: 13, width: 200, borderRadius: 6, marginBottom: 12 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div className="skeleton" style={{ height: 26, width: 160, borderRadius: 8 }} />
          <div className="skeleton" style={{ height: 28, width: 100, borderRadius: 99 }} />
        </div>
        <div className="skeleton" style={{ height: 2, width: '100%', borderRadius: 1, marginTop: 20 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div className="skeleton" style={{ width: 32, height: 32, borderRadius: '50%' }} />
              <div className="skeleton" style={{ width: 60, height: 10, borderRadius: 5 }} />
            </div>
          ))}
        </div>
      </div>
      {/* items skeleton */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #F0EBE1', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1,2].map(i => (
          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div className="skeleton" style={{ width: 64, height: 64, borderRadius: 12, flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="skeleton" style={{ height: 13, width: '70%', borderRadius: 6 }} />
              <div className="skeleton" style={{ height: 11, width: '40%', borderRadius: 6 }} />
            </div>
            <div className="skeleton" style={{ height: 16, width: 60, borderRadius: 6 }} />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────────────────── */
export default function OrderDetail() {
  const { id }    = useParams()
  const navigate  = useNavigate()

  const [order,   setOrder]   = useState(null)

  
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const pageRef = useRef(null)

  // ── Fetch order ──────────────────────────────────────────────────────────
  const fetchOrder = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await orderAPI.getById(id)
      if (data.success) setOrder(data.data)
      else              setError('Order not found')
    } catch (err) {
      if (err?.response?.status === 404) setError('Order not found')
      else setError(err?.response?.data?.message || 'Failed to load order')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchOrder() }, [fetchOrder])

  // ── Entrance animation ───────────────────────────────────────────────────
  useGSAP(() => {
    if (loading || !pageRef.current) return
    gsap.fromTo(
      pageRef.current.querySelectorAll('.anim-row'),
      { y: 22, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.07, duration: 0.5, ease: 'power3.out' }
    )
  }, [loading])

  // ── Refetch after cancel submitted ──────────────────────────────────────
  const handleCancelSubmitted = () => fetchOrder()

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '40px 24px', textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(220,38,38,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
        <IconAlertCircle />
      </div>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, color: '#26221C', margin: 0 }}>{error}</h2>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={fetchOrder} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, border: '1.5px solid #E8E0D0', background: '#fff', color: '#5C5548', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <IconRefresh /> Retry
        </button>
        <Link to="/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, background: '#2D6A4F', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
          My Orders
        </Link>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#F5F0E8 0%,#FAFAF7 100px)', paddingBottom: 80 }}>

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #F0EBE1', padding: '18px 0', boxShadow: '0 1px 0 rgba(45,106,79,0.06)' }}>
        <div className="container-main">
          {/* breadcrumb */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#A89F8C', marginBottom: 6, fontFamily: 'var(--font-body)', flexWrap: 'wrap' }}>
            <Link to="/"       style={{ color: '#A89F8C', textDecoration: 'none' }}>Home</Link>
            <span>/</span>
            <Link to="/orders" style={{ color: '#A89F8C', textDecoration: 'none' }}>My Orders</Link>
            <span>/</span>
            <span style={{ color: '#26221C', wordBreak: 'break-all' }}>{order?.orderNumber || 'Order Detail'}</span>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate(-1)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, border: '1.5px solid #E8E0D0', background: '#fff', cursor: 'pointer', color: '#5C5548', flexShrink: 0 }}>
              <IconArrowLeft />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(45,106,79,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2D6A4F', flexShrink: 0 }}>
                <IconBox />
              </div>
              <div style={{ minWidth: 0 }}>
                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.1rem,2.5vw,1.5rem)', color: '#26221C', margin: 0, lineHeight: 1.2 }}>
                  Order Detail
                </h1>
                {order && (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#A89F8C', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {order.orderNumber} · {fmtDate(order.createdAt)}
                  </p>
                )}
              </div>
            </div>
            {order && (
              <div style={{ flexShrink: 0 }}>
                <StatusBadge status={order.orderStatus} large />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="container-main" style={{ paddingTop: 24 }}>
        {loading ? <Skeleton /> : !order ? null : (
          <div ref={pageRef}>

            {/* two-column layout on wide screens */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }} className="order-detail-grid">

              {/* ── LEFT COLUMN ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>

                {/* STATUS TIMELINE */}
                <div className="anim-row">
                  <SectionCard title="Order Status" icon={<IconTruck />}>
                    <StatusTimeline status={order.orderStatus} />
                  </SectionCard>
                </div>

                {/* ORDER ITEMS */}
                <div className="anim-row">
                  <SectionCard title={`Items (${order.orderItems?.length || 0})`} icon={<IconBox />} noPad>
                    <div>
                      {order.orderItems?.map((item, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
                          borderBottom: i < order.orderItems.length - 1 ? '1px solid #F5F0E8' : 'none',
                        }}>
                          {/* thumbnail */}
                          <div style={{ width: 64, height: 64, borderRadius: 12, overflow: 'hidden', background: '#FAFAF7', border: '1px solid #F0EBE1', flexShrink: 0 }}>
                            <img
                              src={item.product?.images?.[0] || null}
                              alt={item.name}
                              loading="lazy"
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                              onError={e => { e.target.onerror = null; e.target.style.display = 'none' }}
                            />
                          </div>
                          {/* info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13, color: '#26221C', margin: '0 0 4px', lineHeight: 1.4,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.name}
                            </p>
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#A89F8C', margin: 0 }}>
                              Qty: {item.quantity} × {fmt(item.price)}
                            </p>
                          </div>
                          {/* line total */}
                          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: '#26221C', margin: 0, whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {fmt(item.price * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                </div>

                {/* CANCEL SECTION */}
                <div className="anim-row">
                  <CancelSection order={order} onCancelSubmitted={handleCancelSubmitted} />
                </div>
              </div>

              {/* ── RIGHT COLUMN ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>

                {/* ORDER SUMMARY */}
                <div className="anim-row">
                  <SectionCard title="Order Summary" icon={<IconCreditCard />}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[
                        { label: 'Subtotal',      value: fmt(order.itemsPrice ?? order.subtotal) },
                        { label: 'Shipping',       value: order.shippingFee === 0 ? 'Free' : fmt(order.shippingFee) },
                        ...(order.discount > 0 ? [{ label: 'Discount', value: `-${fmt(order.discount)}`, red: true }] : []),
                      ].map(({ label, value, red }) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#7A7265', flexShrink: 0 }}>{label}</span>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: red ? '#DC2626' : '#26221C', fontWeight: 500 }}>{value}</span>
                        </div>
                      ))}
                      <div style={{ height: 1, background: '#F0EBE1', margin: '4px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: 'var(--font-heading)', fontSize: 15, color: '#26221C', flexShrink: 0 }}>Total</span>
                        <span style={{ fontFamily: 'var(--font-heading)', fontSize: 18, color: '#26221C', fontWeight: 700 }}>{fmt(order.totalPrice)}</span>
                      </div>
                    </div>
                  </SectionCard>
                </div>

                {/* PAYMENT INFO */}
                <div className="anim-row">
                  <SectionCard title="Payment" icon={<IconCreditCard />}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#7A7265', flexShrink: 0 }}>Method</span>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#26221C', fontWeight: 500 }}>
                          {order.paymentMethod === 'COD' ? '💵 Cash on Delivery' : '💳 Online Payment'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#7A7265', flexShrink: 0 }}>Status</span>
                        <span style={{
                          fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700,
                          color: PAYMENT_CONFIG[order.paymentStatus]?.color || '#6B7280',
                          background: `${PAYMENT_CONFIG[order.paymentStatus]?.color || '#6B7280'}15`,
                          padding: '3px 10px', borderRadius: 99,
                        }}>
                          {PAYMENT_CONFIG[order.paymentStatus]?.label || order.paymentStatus}
                        </span>
                      </div>
                      {order.paymentMethod === 'RAZORPAY' && order.razorpayOrderId && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#7A7265', flexShrink: 0 }}>Ref ID</span>
                          <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: '#A89F8C', wordBreak: 'break-all', textAlign: 'right' }}>
                            {order.razorpayOrderId}
                          </span>
                        </div>
                      )}
                    </div>
                  </SectionCard>
                </div>

                {/* SHIPPING ADDRESS */}
                <div className="anim-row">
                  <SectionCard title="Delivery Address" icon={<IconMapPin />}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: '#26221C', margin: 0 }}>
                        {order.customerName || order.shippingAddress?.name || '—'}
                      </p>
                      {(order.customerPhone || order.shippingAddress?.phone) && (
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#7A7265', margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.61 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                          {order.customerPhone || order.shippingAddress.phone}
                        </p>
                      )}
                      {order.customerEmail && (
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#7A7265', margin: 0, display: 'flex', alignItems: 'center', gap: 5, wordBreak: 'break-all' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                          {order.customerEmail}
                        </p>
                      )}
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#7A7265', margin: '4px 0 0', lineHeight: 1.7 }}>
                        {[
                          order.shippingAddress?.street,
                          order.shippingAddress?.city,
                          order.shippingAddress?.state,
                          order.shippingAddress?.postalCode,
                        ].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </SectionCard>
                </div>

                {/* PLACED ON */}
                <div className="anim-row">
                  <SectionCard title="Order Info" icon={<IconClock />}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#7A7265', flexShrink: 0 }}>Order number</span>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#26221C', fontWeight: 600, textAlign: 'right', wordBreak: 'break-all' }}>{order.orderNumber}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#7A7265', flexShrink: 0 }}>Placed on</span>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#26221C', textAlign: 'right' }}>{fmtDateTime(order.createdAt)}</span>
                      </div>
                      {order.updatedAt && order.updatedAt !== order.createdAt && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#7A7265', flexShrink: 0 }}>Last updated</span>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#26221C', textAlign: 'right' }}>{fmtDateTime(order.updatedAt)}</span>
                        </div>
                      )}
                    </div>
                  </SectionCard>
                </div>

                {/* TRACK ORDER LINK */}
                <div className="anim-row">
                  <Link to="/track-order" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 18px', borderRadius: 14,
                    border: '1.5px solid rgba(45,106,79,0.2)',
                    background: 'rgba(45,106,79,0.04)',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(45,106,79,0.08)'; e.currentTarget.style.borderColor = 'rgba(45,106,79,0.35)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(45,106,79,0.04)'; e.currentTarget.style.borderColor = 'rgba(45,106,79,0.2)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div style={{ color: '#2D6A4F', flexShrink: 0 }}><IconTruck /></div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: '#2D6A4F', margin: 0 }}>Track this order publicly</p>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C', margin: '2px 0 0' }}>Use order number to track</p>
                      </div>
                    </div>
                    <div style={{ color: '#2D6A4F', flexShrink: 0 }}><IconChevronRight /></div>
                  </Link>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 900px) {
          .order-detail-grid { grid-template-columns: 1fr 340px !important; }
        }
      `}</style>
    </div>
  )
}
