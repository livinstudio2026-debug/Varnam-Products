// src/pages/admin/AdminDashboard.jsx — Step 20

import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { adminAPI, reportAPI, getErrorMessage } from '../../services/api'
import toast from 'react-hot-toast'

/* ── Icons ───────────────────────────────────────────────────────────────── */
const IconTrend  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
const IconOrders = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
const IconRupee  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="4" x2="18" y2="4"/><line x1="6" y1="9" x2="18" y2="9"/><path d="M6 14h4a4 4 0 0 0 0-8H6v12l8-8"/></svg>
const IconUsers  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
const IconToday  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
const IconAlert  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
const IconBox    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
const IconDownload = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
const IconChevDown = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
const IconRefresh = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const fmt = (n = 0) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

const fmtNum = (n = 0) =>
  new Intl.NumberFormat('en-IN').format(n)

const STATUS_COLOR = {
  Ordered:          '#3B82F6',
  Packed:           '#8B5CF6',
  Shipped:          '#F59E0B',
  Out_for_Delivery: '#F97316',
  Delivered:        '#10B981',
  Cancelled:        '#EF4444',
  Failed:           '#6B7280',
}
const STATUS_BG = {
  Ordered:          'rgba(59,130,246,0.1)',
  Packed:           'rgba(139,92,246,0.1)',
  Shipped:          'rgba(245,158,11,0.1)',
  Out_for_Delivery: 'rgba(249,115,22,0.1)',
  Delivered:        'rgba(16,185,129,0.1)',
  Cancelled:        'rgba(239,68,68,0.1)',
  Failed:           'rgba(107,114,128,0.1)',
}

const PIE_COLORS = ['#2D6A4F', '#C8893A', '#52B788', '#E9B87A', '#1B4332']

/* ── Stat card ───────────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, color = '#2D6A4F', bgColor = 'rgba(45,106,79,0.08)', index }) {
  const ref    = useRef(null)
  const numRef = useRef(null)

  useGSAP(() => {
    gsap.fromTo(ref.current,
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out', delay: index * 0.08 }
    )
  }, { scope: ref })

  // Count-up animation
  useEffect(() => {
    if (!numRef.current || typeof value !== 'number') return
    const obj = { val: 0 }
    gsap.to(obj, {
      val: value,
      duration: 1.2,
      ease: 'power2.out',
      delay: index * 0.08 + 0.3,
      onUpdate: () => {
        if (numRef.current) {
          numRef.current.textContent = label.toLowerCase().includes('revenue') || label.toLowerCase().includes('sales')
            ? fmt(Math.round(obj.val))
            : fmtNum(Math.round(obj.val))
        }
      },
    })
  }, [value])

  return (
    <div ref={ref}
      style={{ background: '#fff', borderRadius: 18, padding: '22px 22px 18px', border: '1px solid #F0EBE1', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', transition: 'box-shadow 0.2s, transform 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(45,106,79,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
          <Icon />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(16,185,129,0.08)', borderRadius: 99, padding: '3px 8px' }}>
          <span style={{ color: '#10B981', display: 'flex' }}><IconTrend /></span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#10B981', fontWeight: 600 }}>Live</span>
        </div>
      </div>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#A89F8C', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
      <p ref={numRef} style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.3rem,2.5vw,1.8rem)', color: '#26221C', margin: '0 0 4px', lineHeight: 1.2 }}>
        {typeof value === 'number'
          ? (label.toLowerCase().includes('revenue') || label.toLowerCase().includes('sales') ? fmt(value) : fmtNum(value))
          : value}
      </p>
      {sub && <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#A89F8C', margin: 0 }}>{sub}</p>}
    </div>
  )
}

/* ── Status badge ────────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const s = status?.replace(/ /g, '_')
  return (
    <span style={{
      fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, padding: '3px 9px',
      borderRadius: 99, whiteSpace: 'nowrap',
      background: STATUS_BG[s] ?? '#F5F0E8',
      color:      STATUS_COLOR[s] ?? '#5C5548',
    }}>
      {status}
    </span>
  )
}

/* ── Custom chart tooltip ────────────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '10px 14px', border: '1px solid #F0EBE1', boxShadow: '0 4px 20px rgba(0,0,0,0.10)', fontFamily: 'var(--font-body)', fontSize: 12 }}>
      <p style={{ color: '#A89F8C', margin: '0 0 6px' }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color ?? '#26221C', fontWeight: 600, margin: '2px 0' }}>
          {p.name}: {p.dataKey === 'revenue' ? fmt(p.value) : fmtNum(p.value)}
        </p>
      ))}
    </div>
  )
}

/* ── Section header ──────────────────────────────────────────────────────── */
function SectionHeader({ title, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 17, color: '#26221C', margin: 0 }}>{title}</h2>
      {action}
    </div>
  )
}

/* ── Dashboard ───────────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const [dash,    setDash]    = useState(null)
  const [sales,   setSales]   = useState(null)
  const [days,    setDays]    = useState(30)
  const [loading, setLoading] = useState(true)
  const [salesLoading, setSalesLoading] = useState(true)
  const [reportPeriod,  setReportPeriod]  = useState('all')
  const [reporting,     setReporting]     = useState(false)
  const [reportDropdown, setReportDropdown] = useState(false)

  /* Fetch dashboard */
  const fetchDash = useCallback(async () => {
    try {
      const { data } = await adminAPI.getDashboard()
      setDash(data.data)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  /* Fetch sales analytics */
  const fetchSales = useCallback(async () => {
    setSalesLoading(true)
    try {
      const { data } = await adminAPI.getSalesAnalytics(days)
      setSales(data.data)
    } catch {
      // Silent — chart stays blank
    } finally {
      setSalesLoading(false)
    }
  }, [days])

  const handleReport = async () => {
    setReporting(true)
    setReportDropdown(false)
    try {
      const { data } = await reportAPI.generateOrderReport(reportPeriod)
      if (data.success) {
        toast.success(data.message || 'Report sent to your admin email!')
      } else {
        toast.error(data.message || 'Report generation failed')
      }
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setReporting(false)
    }
  }

  useEffect(() => { fetchDash() }, [fetchDash])
  useEffect(() => { fetchSales() }, [fetchSales])

  /* Prepare chart data */
  const dailyData = (sales?.dailySales ?? []).map(d => ({
    date: `${d._id.day}/${d._id.month}`,
    revenue: d.revenue,
    orders:  d.orders,
  }))

  const pieData = (sales?.paymentMethodSplit ?? []).map(p => ({
    name:  p._id || 'Unknown',
    value: p.count,
    revenue: p.revenue,
  }))

  const { stats = {}, recentOrders = [], lowStockProducts = [], ordersByStatus = {} } = dash ?? {}

  const skel = (h = 20, w = '100%', r = 10) => (
    <div className="skeleton" style={{ height: h, width: w, borderRadius: r }} />
  )

  return (
    <div style={{ maxWidth: 1400 }}>

      {/* ── Page title ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.3rem,2.5vw,1.8rem)', color: '#26221C', margin: '0 0 4px' }}>
            Dashboard
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#A89F8C', margin: 0 }}>
            Welcome back. Here's what's happening in your store.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={() => { setLoading(true); fetchDash(); fetchSales() }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: '1px solid #E8E0D0', background: '#fff', fontFamily: 'var(--font-body)', fontSize: 13, color: '#5C5548', cursor: 'pointer' }}>
            <IconRefresh /> Refresh
          </button>

          {/* Report button + period dropdown */}
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(45,106,79,0.3)', boxShadow: '0 2px 8px rgba(45,106,79,0.12)' }}>
              {/* Main trigger */}
              <button onClick={handleReport} disabled={reporting}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: 'none', background: reporting ? '#52B788' : '#2D6A4F', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, cursor: reporting ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}>
                {reporting
                  ? <><div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} /> Sending…</>
                  : <><IconDownload /> Email Report</>}
              </button>
              {/* Dropdown arrow */}
              <button onClick={() => setReportDropdown(d => !d)}
                style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', border: 'none', borderLeft: '1px solid rgba(255,255,255,0.2)', background: reporting ? '#52B788' : '#2D6A4F', color: '#fff', cursor: 'pointer', transition: 'background 0.15s' }}>
                <span style={{ transform: reportDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'flex' }}><IconChevDown /></span>
              </button>
            </div>

            {/* Period options dropdown */}
            {reportDropdown && (
              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', background: '#fff', borderRadius: 12, border: '1px solid #F0EBE1', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', overflow: 'hidden', zIndex: 50, minWidth: 200 }}>
                <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid #F5F0E8' }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: '#A89F8C', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>Report Period</p>
                </div>
                {[
                  { value: 'today', label: 'Today',        sub: "Today's orders only" },
                  { value: 'week',  label: 'This Week',    sub: 'Monday to now' },
                  { value: 'month', label: 'This Month',   sub: 'Current month so far' },
                  { value: 'all',   label: 'All Time',     sub: 'Every order ever' },
                ].map(({ value, label, sub }) => (
                  <button key={value}
                    onClick={() => { setReportPeriod(value); setReportDropdown(false) }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 14px', border: 'none', background: reportPeriod === value ? 'rgba(45,106,79,0.06)' : '#fff', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid #F9F7F4', transition: 'background 0.12s' }}
                    onMouseEnter={e => { if (reportPeriod !== value) e.currentTarget.style.background = '#FAFAF7' }}
                    onMouseLeave={e => { if (reportPeriod !== value) e.currentTarget.style.background = '#fff' }}>
                    <div>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: reportPeriod === value ? '#2D6A4F' : '#26221C', margin: 0 }}>{label}</p>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C', margin: '1px 0 0' }}>{sub}</p>
                    </div>
                    {reportPeriod === value && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                  </button>
                ))}
                <div style={{ padding: '10px 14px' }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C', margin: 0, lineHeight: 1.5 }}>
                    5-sheet Excel report sent to your admin email.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Pending cancellations alert ──────────────────────────── */}
      {(stats.pendingCancelRequests ?? 0) > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 14, padding: '14px 18px', marginBottom: 24 }}>
          <span style={{ color: '#F59E0B', flexShrink: 0 }}><IconAlert /></span>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#92400E', margin: 0, flex: 1 }}>
            <strong>{stats.pendingCancelRequests}</strong> cancellation request{stats.pendingCancelRequests !== 1 ? 's' : ''} pending your review.
          </p>
          <Link to="/admin/orders" style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: '#D97706', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Review now →
          </Link>
        </div>
      )}

      {/* ── Stat cards ──────────────────────────────────────────── */}
      <div className="dash-stats">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 18, padding: 22, border: '1px solid #F0EBE1' }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                {skel(42, 42, 12)} {skel(16, 60, 8)}
              </div>
              {skel(12, '55%', 6)}
              <div style={{ marginTop: 8 }}>{skel(28, '70%', 8)}</div>
            </div>
          ))
        ) : (
          <>
            <StatCard index={0} icon={IconOrders} label="Total Orders"    value={stats.totalOrders}    sub="Confirmed orders"              color="#3B82F6" bgColor="rgba(59,130,246,0.08)" />
            <StatCard index={1} icon={IconRupee}  label="Total Sales"     value={stats.totalSales}     sub="Excl. cancelled & pending"     color="#2D6A4F" bgColor="rgba(45,106,79,0.08)" />
            <StatCard index={2} icon={IconToday}  label="Today's Revenue" value={stats.todayRevenue}   sub={`${stats.todayOrders ?? 0} orders today`} color="#C8893A" bgColor="rgba(200,137,58,0.08)" />
            <StatCard index={3} icon={IconUsers}  label="Customers"       value={stats.totalCustomers} sub="Registered accounts"           color="#8B5CF6" bgColor="rgba(139,92,246,0.08)" />
          </>
        )}
      </div>

      {/* ── Order status pills ───────────────────────────────────── */}
      {!loading && Object.keys(ordersByStatus).length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
          {Object.entries(ordersByStatus).map(([status, count]) => (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #F0EBE1', borderRadius: 99, padding: '6px 14px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLOR[status.replace(/ /g,'_')] ?? '#A89F8C', flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#5C5548' }}>{status}</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, color: '#26221C' }}>{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Charts row ──────────────────────────────────────────── */}
      <div className="dash-charts">

        {/* Revenue area chart */}
        <div style={{ background: '#fff', borderRadius: 18, padding: '22px 18px 16px', border: '1px solid #F0EBE1', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 16, color: '#26221C', margin: 0 }}>Revenue</h2>
            <div style={{ display: 'flex', gap: 6 }}>
              {[7, 30, 90].map(d => (
                <button key={d} onClick={() => setDays(d)}
                  style={{ padding: '4px 12px', borderRadius: 8, border: 'none', fontFamily: 'var(--font-body)', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
                    background: days === d ? '#2D6A4F' : '#F5F0E8',
                    color:      days === d ? '#fff'    : '#5C5548',
                    fontWeight: days === d ? 600 : 400,
                  }}>
                  {d}d
                </button>
              ))}
            </div>
          </div>
          {salesLoading ? (
            <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dailyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2D6A4F" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE1" />
                <XAxis dataKey="date" tick={{ fontFamily: 'var(--font-body)', fontSize: 11, fill: '#A89F8C' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontFamily: 'var(--font-body)', fontSize: 11, fill: '#A89F8C' }} tickLine={false} axisLine={false} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} width={48} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#2D6A4F" strokeWidth={2.5} fill="url(#revGrad)" dot={false} activeDot={{ r: 5, fill: '#2D6A4F' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Payment split pie */}
        <div style={{ background: '#fff', borderRadius: 18, padding: '22px 18px 16px', border: '1px solid #F0EBE1', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 16, color: '#26221C', margin: '0 0 20px' }}>Payment Methods</h2>
          {salesLoading ? (
            <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
          ) : pieData.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A89F8C', fontFamily: 'var(--font-body)', fontSize: 13 }}>
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={72} innerRadius={40} paddingAngle={3}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n, p) => [`${v} orders · ${fmt(p.payload.revenue)}`, p.payload.name]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontFamily: 'var(--font-body)', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Bottom row: Recent orders + Low stock ───────────────── */}
      <div className="dash-bottom">

        {/* Recent orders */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #F0EBE1', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #F5F0E8' }}>
            <SectionHeader
              title="Recent Orders"
              action={<Link to="/admin/orders" style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#2D6A4F', textDecoration: 'none' }}>View all →</Link>}
            />
          </div>
          {loading ? (
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {skel(12, '30%', 6)} {skel(12, '25%', 6)} {skel(20, 64, 99)} {skel(12, '18%', 6)}
                </div>
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 13, color: '#A89F8C' }}>
              No orders yet
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#FAFAF7' }}>
                    {['Order', 'Customer', 'Status', 'Payment', 'Total'].map(h => (
                      <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, color: '#A89F8C', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o, i) => (
                    <tr key={o._id}
                      style={{ borderTop: '1px solid #F5F0E8', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FAFAF7'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '12px 20px' }}>
                        <Link to={`/admin/orders`} style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: '#2D6A4F', textDecoration: 'none' }}>
                          {o.orderNumber}
                        </Link>
                      </td>
                      <td style={{ padding: '12px 20px', fontFamily: 'var(--font-body)', fontSize: 13, color: '#5C5548', maxWidth: 140, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {o.customerName}
                      </td>
                      <td style={{ padding: '12px 20px' }}><StatusBadge status={o.orderStatus} /></td>
                      <td style={{ padding: '12px 20px', fontFamily: 'var(--font-body)', fontSize: 12, color: '#A89F8C' }}>
                        {o.paymentMethod}
                      </td>
                      <td style={{ padding: '12px 20px', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, color: '#26221C' }}>
                        {fmt(o.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low stock */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #F0EBE1', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #F5F0E8' }}>
            <SectionHeader
              title="Low Stock Alerts"
              action={<Link to="/admin/products" style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#2D6A4F', textDecoration: 'none' }}>Manage →</Link>}
            />
          </div>
          {loading ? (
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {skel(40, 40, 10)} <div style={{ flex: 1 }}>{skel(12, '70%', 6)}<div style={{ marginTop: 6 }}>{skel(10, '40%', 5)}</div></div>
                </div>
              ))}
            </div>
          ) : lowStockProducts.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#10B981', margin: 0 }}>✓ All products have healthy stock</p>
            </div>
          ) : (
            <div style={{ padding: '8px 0' }}>
              {lowStockProducts.map(p => (
                <div key={p._id}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderBottom: '1px solid #F9F7F4', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FAFAF7'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  {/* Thumbnail */}
                  <div style={{ width: 40, height: 40, borderRadius: 10, overflow: 'hidden', background: '#F5F0E8', flexShrink: 0 }}>
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A89F8C' }}><IconBox /></div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: '#26221C', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.name}
                    </p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C', margin: 0 }}>
                      {fmt(p.discountPrice > 0 ? p.discountPrice : p.price)}
                    </p>
                  </div>
                  {/* Stock pill */}
                  <span style={{
                    fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, flexShrink: 0,
                    background: p.stock === 0 ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                    color:      p.stock === 0 ? '#EF4444'              : '#D97706',
                  }}>
                    {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Responsive grid */}
      {reportDropdown && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setReportDropdown(false)} />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .dash-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .dash-charts {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 16px;
          margin-bottom: 24px;
        }
        .dash-bottom {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 16px;
        }
        @media (max-width: 1279px) {
          .dash-stats   { grid-template-columns: repeat(2, 1fr); }
          .dash-charts  { grid-template-columns: 1fr; }
          .dash-bottom  { grid-template-columns: 1fr; }
        }
        @media (max-width: 639px) {
          .dash-stats { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  )
}