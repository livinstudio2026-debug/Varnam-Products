// src/pages/admin/AdminSettings.jsx  —  Step 23 (Settings)
// APIs:
//   GET /api/settings/admin   → pre-fill form
//   PUT /api/settings         → save changes
//
// Fields: freeShippingThreshold, flatShippingFee, codLimit,
//         codEnabled, storeName, storeEmail, storePhone

import { useState, useEffect, useRef } from 'react'
import { Link }                        from 'react-router-dom'
import { gsap }                        from 'gsap'
import { useGSAP }                     from '@gsap/react'
import toast                           from 'react-hot-toast'
import { settingsAPI }                 from '../../services/api'

/* ─── Icons ─────────────────────────────────────────────────────────────────── */
const Ico = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
)
const IconSettings  = ({ size = 18 }) => <Ico size={size} d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>} />
const IconTruck     = ({ size = 16 }) => <Ico size={size} d={<><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 4v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>} />
const IconCash      = ({ size = 16 }) => <Ico size={size} d={<><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 12H2M22 12h-4"/></>} />
const IconStore     = ({ size = 16 }) => <Ico size={size} d={<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"/><polyline points="9 22 9 12 15 12 15 22"/></>} />
const IconSave      = ({ size = 16 }) => <Ico size={size} d={<><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>} />
const IconCheck     = () => <Ico d={<polyline points="20 6 9 17 4 12"/>} />
const IconAlert     = ({ size = 16 }) => <Ico size={size} d={<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>} />

/* ─── Helpers ────────────────────────────────────────────────────────────────── */
const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

/* ─── Section card ───────────────────────────────────────────────────────────── */
function Section({ title, icon, hint, children }) {
  return (
    <div className="settings-section" style={{
      background: '#fff', borderRadius: 18,
      border: '1px solid #F0EBE1',
      boxShadow: '0 2px 16px rgba(45,106,79,0.05)',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '16px 22px', borderBottom: '1px solid #F5F0E8', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ color: '#2D6A4F', marginTop: 1 }}>{icon}</div>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 15, color: '#26221C', margin: 0 }}>{title}</h2>
          {hint && <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#A89F8C', margin: '3px 0 0', lineHeight: 1.5 }}>{hint}</p>}
        </div>
      </div>
      <div style={{ padding: '20px 22px' }}>{children}</div>
    </div>
  )
}

/* ─── Field wrapper ──────────────────────────────────────────────────────────── */
function Field({ label, hint, children, error }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: '#3D3830' }}>
        {label}
      </label>
      {children}
      {hint  && !error && <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C', margin: 0, lineHeight: 1.5 }}>{hint}</p>}
      {error && <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#DC2626', margin: 0 }}>{error}</p>}
    </div>
  )
}

/* ─── Number input with ₹ prefix ─────────────────────────────────────────────── */
function RupeeInput({ value, onChange, min = 0, disabled }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <span style={{
        position: 'absolute', left: 12,
        fontFamily: 'var(--font-body)', fontSize: 13, color: '#7A7265', pointerEvents: 'none',
      }}>₹</span>
      <input
        type="number" min={min} value={value} disabled={disabled}
        onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '10px 12px 10px 28px', borderRadius: 10,
          border: '1.5px solid #E8E0D0', background: disabled ? '#F5F0E8' : '#FAFAF7',
          fontFamily: 'var(--font-body)', fontSize: 13, color: '#26221C',
          outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
        onFocus={e => { e.target.style.borderColor = '#2D6A4F'; e.target.style.boxShadow = '0 0 0 3px rgba(45,106,79,0.1)' }}
        onBlur={e  => { e.target.style.borderColor = '#E8E0D0'; e.target.style.boxShadow = 'none' }}
      />
    </div>
  )
}

/* ─── Text input ─────────────────────────────────────────────────────────────── */
function TextInput({ value, onChange, placeholder, type = 'text', disabled }) {
  return (
    <input
      type={type} value={value} placeholder={placeholder} disabled={disabled}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', boxSizing: 'border-box',
        padding: '10px 12px', borderRadius: 10,
        border: '1.5px solid #E8E0D0', background: disabled ? '#F5F0E8' : '#FAFAF7',
        fontFamily: 'var(--font-body)', fontSize: 13, color: '#26221C',
        outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
      onFocus={e => { e.target.style.borderColor = '#2D6A4F'; e.target.style.boxShadow = '0 0 0 3px rgba(45,106,79,0.1)' }}
      onBlur={e  => { e.target.style.borderColor = '#E8E0D0'; e.target.style.boxShadow = 'none' }}
    />
  )
}

/* ─── Toggle switch ──────────────────────────────────────────────────────────── */
function Toggle({ checked, onChange, label, disabled }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        style={{
          width: 46, height: 26, borderRadius: 99, border: 'none',
          background: checked ? '#2D6A4F' : '#D0C8B5',
          cursor: disabled ? 'not-allowed' : 'pointer',
          position: 'relative', flexShrink: 0,
          transition: 'background 0.25s',
          boxShadow: checked ? '0 2px 8px rgba(45,106,79,0.3)' : 'none',
        }}
      >
        <span style={{
          position: 'absolute', top: 3, left: checked ? 23 : 3,
          width: 20, height: 20, borderRadius: '50%',
          background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          transition: 'left 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        }} />
      </button>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: checked ? '#26221C' : '#7A7265', fontWeight: checked ? 600 : 400 }}>
        {label}
      </span>
    </div>
  )
}

/* ─── Spinner ────────────────────────────────────────────────────────────────── */
function Spinner({ color = '#fff', size = 14 }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid ${color}40`, borderTopColor: color,
      display: 'inline-block', animation: 'spin 0.7s linear infinite', flexShrink: 0,
    }} />
  )
}

/* ─── Main page ──────────────────────────────────────────────────────────────── */
export default function AdminSettings() {
  const [form, setForm] = useState({
    freeShippingThreshold: 499,
    flatShippingFee:       49,
    codLimit:              5000,
    codEnabled:            true,
    storeName:             '',
    storeEmail:            '',
    storePhone:            '',
  })
  const [original, setOriginal] = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [errors,   setErrors]   = useState({})

  const headerRef  = useRef(null)
  const bodyRef    = useRef(null)

  // ── Load settings ─────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const { data } = await settingsAPI.getAdmin()
        if (data.success) {
          const s = data.data
          const loaded = {
            freeShippingThreshold: s.freeShippingThreshold ?? 499,
            flatShippingFee:       s.flatShippingFee       ?? 49,
            codLimit:              s.codLimit              ?? 5000,
            codEnabled:            s.codEnabled            ?? true,
            storeName:             s.storeName             || '',
            storeEmail:            s.storeEmail            || '',
            storePhone:            s.storePhone            || '',
          }
          setForm(loaded)
          setOriginal(loaded)
        }
      } catch {
        toast.error('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ── Entrance animation ─────────────────────────────────────────────────────
  useGSAP(() => {
    if (headerRef.current)
      gsap.fromTo(headerRef.current, { y: -14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out' })
  }, [])

  useGSAP(() => {
    if (loading || !bodyRef.current) return
    gsap.fromTo(bodyRef.current.querySelectorAll('.settings-section'),
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.08, duration: 0.45, ease: 'power3.out' }
    )
  }, [loading])

  // ── Field updater ─────────────────────────────────────────────────────────
  const set = (key) => (value) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {}
    if (form.freeShippingThreshold < 0)
      e.freeShippingThreshold = 'Must be 0 or more'
    if (form.flatShippingFee < 0)
      e.flatShippingFee = 'Must be 0 or more'
    if (form.flatShippingFee > form.freeShippingThreshold)
      e.flatShippingFee = `Shipping fee (₹${form.flatShippingFee}) cannot exceed free-shipping threshold (₹${form.freeShippingThreshold})`
    if (form.codLimit < 0)
      e.codLimit = 'Must be 0 or more'
    if (form.storeEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.storeEmail))
      e.storeEmail = 'Enter a valid email address'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) {
      toast.error('Please fix validation errors before saving')
      return
    }
    setSaving(true)
    try {
      const { data } = await settingsAPI.update(form)
      if (data.success) {
        setOriginal(form)
        toast.success('Settings saved — live immediately')
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  // ── Reset to last saved ───────────────────────────────────────────────────
  const handleReset = () => {
    if (!original) return
    setForm(original)
    setErrors({})
    toast('Reset to last saved values', { icon: '↩️' })
  }

  const isDirty = original && JSON.stringify(form) !== JSON.stringify(original)

  // ── Shipping fee preview ──────────────────────────────────────────────────
  const shippingPreview = () => {
    if (form.flatShippingFee === 0) return 'Free shipping on all orders'
    return `₹${form.flatShippingFee} fee on orders below ₹${form.freeShippingThreshold} · Free above`
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#F5F0E8 0%,#FAFAF7 100px)', paddingBottom: 100 }}>

      {/* Header */}
      <div ref={headerRef} style={{ background: '#fff', borderBottom: '1px solid #F0EBE1', padding: '18px 0', boxShadow: '0 1px 0 rgba(45,106,79,0.06)' }}>
        <div className="container-main">
          <nav style={{ display: 'flex', gap: 6, fontSize: 12, color: '#A89F8C', marginBottom: 6, fontFamily: 'var(--font-body)' }}>
            <Link to="/admin" style={{ color: '#A89F8C', textDecoration: 'none' }}>Admin</Link>
            <span>/</span><span style={{ color: '#26221C' }}>Settings</span>
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(45,106,79,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2D6A4F' }}>
                <IconSettings />
              </div>
              <div>
                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.1rem,2.5vw,1.4rem)', color: '#26221C', margin: 0 }}>Store Settings</h1>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#A89F8C', margin: '2px 0 0' }}>Changes take effect immediately — no deploy needed</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-main" style={{ paddingTop: 28, maxWidth: 760 }}>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[200, 240, 180].map((h, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 18, border: '1px solid #F0EBE1', overflow: 'hidden' }}>
                <div style={{ padding: '16px 22px', borderBottom: '1px solid #F5F0E8' }}>
                  <div className="skeleton" style={{ height: 13, width: 160, borderRadius: 5 }} />
                </div>
                <div className="skeleton" style={{ height: h, margin: '20px 22px', borderRadius: 10 }} />
              </div>
            ))}
          </div>
        ) : (
          <div ref={bodyRef} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ── Shipping ────────────────────────────────────────────────── */}
            <Section
              title="Shipping"
              icon={<IconTruck />}
              hint="Controls the fee charged at checkout and the free-shipping cutoff."
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Field
                    label="Free Shipping Threshold"
                    hint="Orders at or above this amount get free shipping."
                    error={errors.freeShippingThreshold}
                  >
                    <RupeeInput value={form.freeShippingThreshold} onChange={set('freeShippingThreshold')} />
                  </Field>
                  <Field
                    label="Flat Shipping Fee"
                    hint="Charged when the order is below the threshold."
                    error={errors.flatShippingFee}
                  >
                    <RupeeInput value={form.flatShippingFee} onChange={set('flatShippingFee')} />
                  </Field>
                </div>

                {/* Live preview */}
                <div style={{
                  background: 'rgba(45,106,79,0.05)', border: '1px solid rgba(45,106,79,0.15)',
                  borderRadius: 10, padding: '10px 14px',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <div style={{ color: '#2D6A4F', flexShrink: 0 }}><IconTruck size={14} /></div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#2D6A4F', margin: 0 }}>
                    <strong>Preview:</strong> {shippingPreview()}
                  </p>
                </div>
              </div>
            </Section>

            {/* ── Cash on Delivery ─────────────────────────────────────────── */}
            <Section
              title="Cash on Delivery"
              icon={<IconCash />}
              hint="Disable COD entirely or cap the maximum order value allowed for COD."
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Toggle
                  checked={form.codEnabled}
                  onChange={set('codEnabled')}
                  label={form.codEnabled ? 'COD is enabled' : 'COD is disabled'}
                />

                <Field
                  label="COD Order Limit"
                  hint="Orders above this amount cannot use Cash on Delivery. Set to 0 to disable the limit."
                  error={errors.codLimit}
                >
                  <RupeeInput value={form.codLimit} onChange={set('codLimit')} disabled={!form.codEnabled} />
                </Field>

                {!form.codEnabled && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.2)', borderRadius: 10, padding: '10px 14px' }}>
                    <div style={{ color: '#D97706', flexShrink: 0 }}><IconAlert /></div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#92400E', margin: 0 }}>
                      COD is currently disabled. Customers will only see online payment at checkout.
                    </p>
                  </div>
                )}
              </div>
            </Section>

            {/* ── Store info ───────────────────────────────────────────────── */}
            <Section
              title="Store Information"
              icon={<IconStore />}
              hint="Used in order confirmation emails and receipts."
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field label="Store Name">
                  <TextInput value={form.storeName} onChange={set('storeName')} placeholder="Varnam Naturals" />
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Field label="Store Email" error={errors.storeEmail}>
                    <TextInput type="email" value={form.storeEmail} onChange={set('storeEmail')} placeholder="hello@varnam.in" />
                  </Field>
                  <Field label="Store Phone">
                    <TextInput type="tel" value={form.storePhone} onChange={set('storePhone')} placeholder="+91 98765 43210" />
                  </Field>
                </div>
              </div>
            </Section>

            {/* ── Save bar ─────────────────────────────────────────────────── */}
            <div style={{
              position: 'sticky', bottom: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: 12,
              background: '#fff', borderRadius: 16,
              border: `1.5px solid ${isDirty ? 'rgba(45,106,79,0.3)' : '#F0EBE1'}`,
              padding: '14px 20px',
              boxShadow: isDirty ? '0 8px 32px rgba(45,106,79,0.14)' : '0 4px 16px rgba(45,106,79,0.06)',
              transition: 'all 0.3s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {isDirty ? (
                  <>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#C8893A', flexShrink: 0 }} />
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#7A7265', margin: 0 }}>
                      You have unsaved changes
                    </p>
                  </>
                ) : (
                  <>
                    <div style={{ color: '#2D6A4F' }}><IconCheck /></div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#7A7265', margin: 0 }}>
                      All changes saved
                    </p>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {isDirty && (
                  <button onClick={handleReset} disabled={saving} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '9px 16px', borderRadius: 10,
                    border: '1.5px solid #E8E0D0', background: '#fff', color: '#5C5548',
                    fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}>
                    Discard
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving || !isDirty}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    padding: '9px 20px', borderRadius: 10, border: 'none',
                    background: isDirty ? '#2D6A4F' : '#A8C5B5',
                    color: '#fff',
                    fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700,
                    cursor: saving || !isDirty ? 'not-allowed' : 'pointer',
                    boxShadow: isDirty ? '0 4px 14px rgba(45,106,79,0.28)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  {saving ? <><Spinner /> Saving…</> : <><IconSave /> Save settings</>}
                </button>
              </div>
            </div>

          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}