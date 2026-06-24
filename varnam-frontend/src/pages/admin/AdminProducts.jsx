// src/pages/admin/AdminProducts.jsx — Step 21
// Full product management: list, create, edit, image upload, toggles, stock, soft-delete

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { gsap }           from 'gsap'
import { useGSAP }        from '@gsap/react'
import toast              from 'react-hot-toast'
import { productAPI, categoryAPI, uploadAPI } from '../../services/api'

/* ── Icons ───────────────────────────────────────────────────────────────── */
const Ico = ({ children, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
)
const IcoPlus     = () => <Ico><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Ico>
const IcoEdit     = () => <Ico><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Ico>
const IcoTrash    = () => <Ico><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></Ico>
const IcoSearch   = () => <Ico><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Ico>
const IcoClose    = () => <Ico><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Ico>
const IcoUpload   = () => <Ico><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></Ico>
const IcoLoader   = () => <Ico><path d="M21 12a9 9 0 1 1-6.219-8.56"/></Ico>
const IcoRestore  = () => <Ico><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></Ico>
const IcoStar     = () => <Ico><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Ico>
const IcoTrophy   = () => <Ico><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></Ico>
const IcoBox      = () => <Ico><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></Ico>
const IcoChevron  = () => <Ico><polyline points="9 18 15 12 9 6"/></Ico>
const IcoFilter   = () => <Ico><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></Ico>
const IcoImage    = () => <Ico><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></Ico>
const IcoX        = () => <Ico size={12}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Ico>

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

const EMPTY_FORM = {
  name: '', description: '', shortDescription: '',
  price: '', discountPrice: '',
  category: '', stock: '',
  ingredients: '', benefits: '',
  images: [],          // array of uploaded URLs
  featured: false, bestSeller: false, active: true,
}

/* ── Small UI atoms ──────────────────────────────────────────────────────── */
function Badge({ on, label, color }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 9px', borderRadius: 99, fontSize: 11, fontWeight: 600,
      fontFamily: 'var(--font-body)',
      background: on ? `${color}18` : 'rgba(107,114,128,0.08)',
      color: on ? color : '#9CA3AF',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: on ? color : '#D1D5DB', flexShrink: 0 }} />
      {label}
    </span>
  )
}

function Toggle({ value, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
      <div onClick={() => onChange(!value)} style={{
        width: 40, height: 22, borderRadius: 99, position: 'relative',
        background: value ? '#2D6A4F' : '#E5E7EB',
        transition: 'background 0.2s', flexShrink: 0,
        boxShadow: value ? '0 0 0 3px rgba(45,106,79,0.15)' : 'none',
      }}>
        <span style={{
          position: 'absolute', top: 3, left: value ? 21 : 3,
          width: 16, height: 16, borderRadius: '50%', background: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          transition: 'left 0.2s',
        }} />
      </div>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#5C5548', userSelect: 'none' }}>{label}</span>
    </label>
  )
}

function Field({ label, error, required, children, hint }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: error ? '#DC2626' : '#5C5548', letterSpacing: '0.04em' }}>
        {label}{required && <span style={{ color: '#EF4444' }}> *</span>}
      </label>
      {children}
      {hint  && !error && <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C', margin: 0 }}>{hint}</p>}
      {error && <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#DC2626', margin: 0 }}>{error}</p>}
    </div>
  )
}

const inputCls = (err) => ({
  width: '100%', padding: '9px 12px', borderRadius: 9,
  border: `1.5px solid ${err ? '#FCA5A5' : '#E8E0D0'}`,
  background: err ? '#FEF2F2' : '#FAFAF7',
  fontFamily: 'var(--font-body)', fontSize: 13, color: '#26221C',
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
})

const textareaCls = (err) => ({
  ...inputCls(err),
  resize: 'vertical', minHeight: 80, lineHeight: 1.55,
})

/* ── Image uploader ──────────────────────────────────────────────────────── */
function ImageUploader({ images, onChange }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)

  const handleFiles = async (files) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!arr.length) return
    setUploading(true)
    try {
      const { data } = await uploadAPI.uploadProductImages(arr)
      if (data.success) {
        // server returns { data: [{ url, publicId }, ...] } or { data: ['url', ...] }
        const urls = data.data.map(d => (typeof d === 'string' ? d : d.url))
        onChange([...images, ...urls])
        toast.success(`${urls.length} image${urls.length > 1 ? 's' : ''} uploaded`)
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (idx) => onChange(images.filter((_, i) => i !== idx))

  const onDrop = (e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }
  const onDragOver = (e) => e.preventDefault()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Drop zone */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDrop={onDrop} onDragOver={onDragOver}
        style={{
          border: '2px dashed #D0C8B5', borderRadius: 12, padding: '24px 16px',
          textAlign: 'center', cursor: uploading ? 'not-allowed' : 'pointer',
          background: '#FAFAF7', transition: 'border-color 0.15s, background 0.15s',
        }}
        onMouseEnter={e => { if (!uploading) { e.currentTarget.style.borderColor = '#2D6A4F'; e.currentTarget.style.background = 'rgba(45,106,79,0.03)' }}}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#D0C8B5'; e.currentTarget.style.background = '#FAFAF7' }}>
        <input ref={inputRef} type="file" multiple accept="image/*"
          style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
        <div style={{ color: uploading ? '#C8893A' : '#A89F8C', display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          {uploading
            ? <span style={{ animation: 'spin 0.8s linear infinite', display: 'flex' }}><IcoLoader /></span>
            : <IcoUpload />}
        </div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: '#5C5548', margin: '0 0 3px' }}>
          {uploading ? 'Uploading…' : 'Click or drag & drop images'}
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C', margin: 0 }}>
          PNG, JPG, WEBP — multiple allowed
        </p>
      </div>

      {/* Uploaded previews */}
      {images.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {images.map((url, i) => (
            <div key={i} style={{ position: 'relative', width: 72, height: 72, borderRadius: 10, overflow: 'hidden', border: '1.5px solid #E8E0D0', background: '#F5F0E8' }}>
              <img src={url} alt={`product-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button onClick={() => removeImage(i)}
                style={{
                  position: 'absolute', top: 3, right: 3,
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.65)', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff',
                }}>
                <IcoX />
              </button>
              {i === 0 && (
                <span style={{ position: 'absolute', bottom: 3, left: 3, background: '#2D6A4F', color: '#fff', fontSize: 8, fontWeight: 700, fontFamily: 'var(--font-body)', padding: '1px 5px', borderRadius: 4, letterSpacing: '0.05em' }}>
                  MAIN
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Product form modal ──────────────────────────────────────────────────── */
function ProductModal({ mode, product, categories, onClose, onSaved }) {
  const isEdit = mode === 'edit'
  const [form, setForm]       = useState(EMPTY_FORM)
  const [errors, setErrors]   = useState({})
  const [saving, setSaving]   = useState(false)
  const overlayRef = useRef(null)
  const drawerRef  = useRef(null)

  // Populate form when editing
  useEffect(() => {
    if (isEdit && product) {
      setForm({
        name:             product.name || '',
        description:      product.description || '',
        shortDescription: product.shortDescription || '',
        price:            product.price ?? '',
        discountPrice:    product.discountPrice ?? '',
        category:         product.category?._id || product.category || '',
        stock:            product.stock ?? '',
        ingredients:      (product.ingredients || []).join(', '),
        benefits:         (product.benefits    || []).join(', '),
        images:           product.images || [],
        featured:         !!product.featured,
        bestSeller:       !!product.bestSeller,
        active:           product.active !== false,
      })
    }
  }, [isEdit, product])

  // Entrance animation
  useGSAP(() => {
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' })
    gsap.fromTo(drawerRef.current,  { x: '100%' },  { x: '0%', duration: 0.38, ease: 'power4.out' })
  }, { scope: overlayRef })

  const close = () => {
    gsap.to(drawerRef.current,  { x: '100%',  duration: 0.28, ease: 'power3.in' })
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.28, ease: 'power2.in', onComplete: onClose })
  }

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => { const n = { ...e }; delete n[k]; return n }) }

  const validate = () => {
    const e = {}
    if (!form.name.trim())             e.name             = 'Required'
    if (!form.description.trim())      e.description      = 'Required'
    if (!form.shortDescription.trim()) e.shortDescription = 'Required'
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) e.price = 'Valid price required'
    if (form.discountPrice && Number(form.discountPrice) >= Number(form.price)) e.discountPrice = 'Must be less than base price'
    if (!form.category)                e.category         = 'Required'
    if (form.stock === '' || isNaN(Number(form.stock)) || Number(form.stock) < 0) e.stock = 'Valid stock required'
    if (form.images.length === 0)      e.images           = 'At least one image required'
    return e
  }

  const handleSave = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); toast.error('Fix the errors above'); return }

    setSaving(true)
    try {
      const payload = {
        name:             form.name.trim(),
        description:      form.description.trim(),
        shortDescription: form.shortDescription.trim(),
        price:            Number(form.price),
        discountPrice:    Number(form.discountPrice) || 0,
        category:         form.category,
        stock:            Number(form.stock),
        images:           form.images,
        ingredients:      form.ingredients.split(',').map(s => s.trim()).filter(Boolean),
        benefits:         form.benefits.split(',').map(s => s.trim()).filter(Boolean),
        featured:         form.featured,
        bestSeller:       form.bestSeller,
        active:           form.active,
      }

      const { data } = isEdit
        ? await productAPI.update(product._id, payload)
        : await productAPI.create(payload)

      if (data.success) {
        toast.success(isEdit ? 'Product updated' : 'Product created')
        onSaved(data.data, isEdit)
        close()
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div ref={overlayRef} style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(15,12,8,0.55)', backdropFilter: 'blur(4px)',
      display: 'flex', justifyContent: 'flex-end',
    }}>
      {/* Click-outside close */}
      <div style={{ flex: 1 }} onClick={close} />

      <div ref={drawerRef} style={{
        width: '100%', maxWidth: 580,
        background: '#fff', display: 'flex', flexDirection: 'column',
        boxShadow: '-12px 0 48px rgba(0,0,0,0.15)',
        height: '100vh', overflow: 'hidden',
        position: 'fixed', top: 0, right: 0, bottom: 0,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #F0EBE1', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, color: '#26221C', margin: 0 }}>
              {isEdit ? 'Edit Product' : 'New Product'}
            </h2>
            {isEdit && product?.name && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#A89F8C', margin: '2px 0 0' }}>{product.name}</p>
            )}
          </div>
          <button onClick={close} style={{ width: 34, height: 34, borderRadius: '50%', background: '#F5F0E8', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5C5548' }}>
            <IcoClose />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          <Field label="Product Name" required error={errors.name}>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Cold-Pressed Coconut Oil 500ml" style={inputCls(errors.name)}
              onFocus={e => e.target.style.borderColor = '#2D6A4F'} onBlur={e => e.target.style.borderColor = errors.name ? '#FCA5A5' : '#E8E0D0'} />
          </Field>

          <Field label="Short Description" required error={errors.shortDescription} hint={`${form.shortDescription.length}/160 chars — shown on product card`}>
            <textarea value={form.shortDescription} onChange={e => set('shortDescription', e.target.value)}
              maxLength={160} placeholder="One line that sells the product…" style={{ ...textareaCls(errors.shortDescription), minHeight: 64 }}
              onFocus={e => e.target.style.borderColor = '#2D6A4F'} onBlur={e => e.target.style.borderColor = errors.shortDescription ? '#FCA5A5' : '#E8E0D0'} />
          </Field>

          <Field label="Full Description" required error={errors.description}>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Detailed product description…" style={textareaCls(errors.description)}
              onFocus={e => e.target.style.borderColor = '#2D6A4F'} onBlur={e => e.target.style.borderColor = errors.description ? '#FCA5A5' : '#E8E0D0'} />
          </Field>

          {/* Pricing row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Base Price (₹)" required error={errors.price}>
              <input type="number" min="0" value={form.price} onChange={e => set('price', e.target.value)} placeholder="299" style={inputCls(errors.price)}
                onFocus={e => e.target.style.borderColor = '#2D6A4F'} onBlur={e => e.target.style.borderColor = errors.price ? '#FCA5A5' : '#E8E0D0'} />
            </Field>
            <Field label="Discount Price (₹)" error={errors.discountPrice} hint="Leave 0 for no discount">
              <input type="number" min="0" value={form.discountPrice} onChange={e => set('discountPrice', e.target.value)} placeholder="0" style={inputCls(errors.discountPrice)}
                onFocus={e => e.target.style.borderColor = '#2D6A4F'} onBlur={e => e.target.style.borderColor = errors.discountPrice ? '#FCA5A5' : '#E8E0D0'} />
            </Field>
          </div>

          {/* Category + Stock */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Category" required error={errors.category}>
              <select value={form.category} onChange={e => set('category', e.target.value)} style={{ ...inputCls(errors.category), cursor: 'pointer' }}>
                <option value="">Select category…</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Stock Quantity" required error={errors.stock}>
              <input type="number" min="0" value={form.stock} onChange={e => set('stock', e.target.value)} placeholder="50" style={inputCls(errors.stock)}
                onFocus={e => e.target.style.borderColor = '#2D6A4F'} onBlur={e => e.target.style.borderColor = errors.stock ? '#FCA5A5' : '#E8E0D0'} />
            </Field>
          </div>

          <Field label="Ingredients" hint="Comma-separated — e.g. Coconut Oil, Vitamin E, Aloe Vera">
            <input value={form.ingredients} onChange={e => set('ingredients', e.target.value)} placeholder="Ingredient 1, Ingredient 2, …" style={inputCls(false)}
              onFocus={e => e.target.style.borderColor = '#2D6A4F'} onBlur={e => e.target.style.borderColor = '#E8E0D0'} />
          </Field>

          <Field label="Benefits" hint="Comma-separated — e.g. Moisturises skin, Reduces inflammation">
            <input value={form.benefits} onChange={e => set('benefits', e.target.value)} placeholder="Benefit 1, Benefit 2, …" style={inputCls(false)}
              onFocus={e => e.target.style.borderColor = '#2D6A4F'} onBlur={e => e.target.style.borderColor = '#E8E0D0'} />
          </Field>

          <Field label="Product Images" required error={errors.images}>
            <ImageUploader images={form.images} onChange={imgs => set('images', imgs)} />
          </Field>

          {/* Flags */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px', background: '#FAFAF7', borderRadius: 12, border: '1px solid #F0EBE1' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, color: '#A89F8C', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>Flags</p>
            <Toggle value={form.featured}    onChange={v => set('featured', v)}    label="Featured — shown on homepage" />
            <Toggle value={form.bestSeller}  onChange={v => set('bestSeller', v)}  label="Best Seller — shown in best sellers section" />
            <Toggle value={form.active}      onChange={v => set('active', v)}      label="Active — visible in storefront" />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #F0EBE1', display: 'flex', gap: 10, flexShrink: 0, background: '#fff' }}>
          <button onClick={close} disabled={saving}
            style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid #E8E0D0', background: '#fff', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: '#5C5548', cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{
              flex: 2, padding: '10px', borderRadius: 10, border: 'none',
              background: saving ? '#52B788' : 'linear-gradient(135deg,#2D6A4F,#1B4332)',
              fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, color: '#fff',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              boxShadow: saving ? 'none' : '0 4px 14px rgba(45,106,79,0.28)',
            }}>
            {saving ? <><span style={{ animation: 'spin 0.8s linear infinite', display: 'flex' }}><IcoLoader /></span> Saving…</> : (isEdit ? 'Save Changes' : 'Create Product')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

/* ── Stock modal ─────────────────────────────────────────────────────────── */
function StockModal({ product, onClose, onUpdated }) {
  const [stock, setStock]   = useState(String(product.stock ?? 0))
  const [saving, setSaving] = useState(false)
  const overlayRef = useRef(null)
  const boxRef     = useRef(null)

  useGSAP(() => {
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2 })
    gsap.fromTo(boxRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'back.out(1.5)' })
  }, { scope: overlayRef })

  const close = () => {
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.2, onComplete: onClose })
  }

  const save = async () => {
    const val = Number(stock)
    if (isNaN(val) || val < 0) { toast.error('Enter a valid stock number'); return }
    setSaving(true)
    try {
      const { data } = await productAPI.updateStock(product._id, val)
      if (data.success) { toast.success('Stock updated'); onUpdated(data.data); close() }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed')
    } finally { setSaving(false) }
  }

  return createPortal(
    <div ref={overlayRef} style={{ position: 'fixed', inset: 0, zIndex: 110, background: 'rgba(15,12,8,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget) close() }}>
      <div ref={boxRef} style={{ background: '#fff', borderRadius: 18, padding: '28px 28px 22px', maxWidth: 340, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, color: '#26221C', margin: '0 0 4px' }}>Update Stock</h3>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#A89F8C', margin: '0 0 18px', lineHeight: 1.5 }}>
          {product.name}<br />Current: <strong style={{ color: '#26221C' }}>{product.stock}</strong> units
        </p>
        <input type="number" min="0" value={stock} onChange={e => setStock(e.target.value)}
          style={{ ...inputCls(false), marginBottom: 16 }}
          onFocus={e => e.target.style.borderColor = '#2D6A4F'}
          onBlur={e => e.target.style.borderColor = '#E8E0D0'}
          autoFocus />
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={close} style={{ flex: 1, padding: '9px', borderRadius: 9, border: '1.5px solid #E8E0D0', background: '#fff', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: '#5C5548', cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving}
            style={{ flex: 2, padding: '9px', borderRadius: 9, border: 'none', background: '#2D6A4F', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {saving ? <><span style={{ animation: 'spin 0.8s linear infinite', display: 'flex' }}><IcoLoader /></span> Saving…</> : 'Update Stock'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

/* ── Delete confirm modal ────────────────────────────────────────────────── */
function DeleteModal({ product, onClose, onDeleted }) {
  const [saving, setSaving] = useState(false)
  const overlayRef = useRef(null)
  const boxRef     = useRef(null)

  useGSAP(() => {
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2 })
    gsap.fromTo(boxRef.current, { y: 20, scale: 0.97, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.4)' })
  }, { scope: overlayRef })

  const close = () => gsap.to(overlayRef.current, { opacity: 0, duration: 0.2, onComplete: onClose })

  const confirm = async () => {
    setSaving(true)
    try {
      await productAPI.delete(product._id)
      toast.success('Product deactivated (soft deleted)')
      onDeleted(product._id)
      close()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Delete failed')
      setSaving(false)
    }
  }

  return createPortal(
    <div ref={overlayRef} style={{ position: 'fixed', inset: 0, zIndex: 110, background: 'rgba(15,12,8,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget) close() }}>
      <div ref={boxRef} style={{ background: '#fff', borderRadius: 18, padding: '28px', maxWidth: 360, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
        <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(220,38,38,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', margin: '0 0 16px' }}>
          <IcoTrash />
        </div>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, color: '#26221C', margin: '0 0 8px' }}>Deactivate Product?</h3>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#5C5548', margin: '0 0 20px', lineHeight: 1.6 }}>
          <strong>{product.name}</strong> will be hidden from the storefront. This is a soft delete — the product can be restored via the "Restore" button.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={close} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid #E8E0D0', background: '#fff', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: '#5C5548', cursor: 'pointer' }}>Cancel</button>
          <button onClick={confirm} disabled={saving}
            style={{ flex: 2, padding: '10px', borderRadius: 10, border: 'none', background: '#DC2626', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {saving ? <><span style={{ animation: 'spin 0.8s linear infinite', display: 'flex' }}><IcoLoader /></span> Deactivating…</> : 'Deactivate'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

/* ── Product row ─────────────────────────────────────────────────────────── */
function ProductRow({ product, categories, onEdit, onStock, onDelete, onToggle }) {
  const rowRef   = useRef(null)
  const price    = product.discountPrice > 0 ? product.discountPrice : product.price
  const hasDisc  = product.discountPrice > 0
  const isActive = product.active

  const handleToggle = async (type) => {
    // Optimistic — immediate visual feedback, rollback on failure handled by parent
    onToggle(product._id, type)
    try {
      if (type === 'featured')    await productAPI.toggleFeatured(product._id)
      if (type === 'bestSeller')  await productAPI.toggleBestSeller(product._id)
      if (type === 'active')      await productAPI.toggleStatus(product._id)
    } catch (err) {
      toast.error('Toggle failed — reverting')
      onToggle(product._id, type) // revert
    }
  }

  return (
    <tr ref={rowRef} style={{ borderBottom: '1px solid #F5F0E8', transition: 'background 0.12s' }}
      onMouseEnter={e => e.currentTarget.style.background = '#FAFAF7'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

      {/* Image + name */}
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', background: '#F5F0E8', flexShrink: 0, border: '1px solid #E8E0D0' }}>
            {product.images?.[0]
              ? <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C4B9A8' }}><IcoImage /></div>
            }
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: '#26221C', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>
              {product.name}
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C', margin: '2px 0 0' }}>
              {product.category?.name || '—'}
            </p>
          </div>
        </div>
      </td>

      {/* Price */}
      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, color: '#26221C', margin: 0 }}>{fmt(price)}</p>
        {hasDisc && <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C', margin: '1px 0 0', textDecoration: 'line-through' }}>{fmt(product.price)}</p>}
      </td>

      {/* Stock */}
      <td style={{ padding: '12px 16px' }}>
        <button onClick={() => onStock(product)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: product.stock === 0 ? 'rgba(220,38,38,0.08)' : product.stock < 10 ? 'rgba(245,158,11,0.08)' : 'rgba(45,106,79,0.07)',
            color:      product.stock === 0 ? '#DC2626' : product.stock < 10 ? '#D97706' : '#2D6A4F',
            fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700,
            transition: 'all 0.15s',
          }}>
          <IcoBox />
          {product.stock} units
        </button>
      </td>

      {/* Flags */}
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          <button onClick={() => handleToggle('featured')} title={product.featured ? 'Remove from featured' : 'Mark as featured'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: product.featured ? '#C8893A' : '#D1D5DB', transition: 'color 0.15s', display: 'flex' }}
            onMouseEnter={e => { if (!product.featured) e.currentTarget.style.color = '#C8893A' }}
            onMouseLeave={e => { if (!product.featured) e.currentTarget.style.color = '#D1D5DB' }}>
            <IcoStar />
          </button>
          <button onClick={() => handleToggle('bestSeller')} title={product.bestSeller ? 'Remove best seller' : 'Mark as best seller'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: product.bestSeller ? '#2D6A4F' : '#D1D5DB', transition: 'color 0.15s', display: 'flex' }}
            onMouseEnter={e => { if (!product.bestSeller) e.currentTarget.style.color = '#2D6A4F' }}
            onMouseLeave={e => { if (!product.bestSeller) e.currentTarget.style.color = '#D1D5DB' }}>
            <IcoTrophy />
          </button>
        </div>
      </td>

      {/* Status */}
      <td style={{ padding: '12px 16px' }}>
        <button onClick={() => handleToggle('active')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <Badge on={isActive} label={isActive ? 'Active' : 'Inactive'} color="#2D6A4F" />
        </button>
      </td>

      {/* Actions */}
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <button onClick={() => onEdit(product)} title="Edit"
            style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #E8E0D0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5C5548', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#F5F0E8'; e.currentTarget.style.borderColor = '#C4B9A8' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#E8E0D0' }}>
            <IcoEdit />
          </button>
          {isActive ? (
            <button onClick={() => onDelete(product)} title="Deactivate"
              style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #FCA5A5', background: '#FEF2F2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#FEF2F2' }}>
              <IcoTrash />
            </button>
          ) : (
            <button onClick={() => handleToggle('active')} title="Restore"
              style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid rgba(45,106,79,0.3)', background: 'rgba(45,106,79,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2D6A4F', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(45,106,79,0.12)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(45,106,79,0.06)' }}>
              <IcoRestore />
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

/* ── Skeleton row ────────────────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr style={{ borderBottom: '1px solid #F5F0E8' }}>
      {[80, 60, 50, 60, 50, 70].map((w, i) => (
        <td key={i} style={{ padding: '14px 16px' }}>
          <div style={{ height: 14, width: `${w}%`, borderRadius: 6, background: '#F0EBE1', animation: 'pulse 1.5s ease-in-out infinite' }} />
        </td>
      ))}
    </tr>
  )
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function AdminProducts() {
  const [products, setProducts]     = useState([])
  const [categories, setCategories] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 })
  const [loading, setLoading]       = useState(true)
  const [page, setPage]             = useState(1)
  const [search, setSearch]         = useState('')
  const [statusFilter, setStatusFilter] = useState('all')  // 'all' | 'active' | 'inactive'

  // Modals
  const [modal, setModal]         = useState(null)  // 'create' | 'edit'
  const [editTarget, setEditTarget] = useState(null)
  const [stockTarget, setStockTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const tableRef  = useRef(null)
  const headerRef = useRef(null)

  // Load categories once
  useEffect(() => {
    categoryAPI.getAll()
      .then(({ data }) => { if (data.success) setCategories(data.data) })
      .catch(() => {})
  }, [])

  // Load products
  const loadProducts = useCallback(async (pg = page) => {
    setLoading(true)
    try {
      const params = { page: pg, limit: 15 }
      const { data } = await productAPI.getAll(params)
      if (data.success) {
        setProducts(data.data)
        setPagination(data.pagination)
      }
    } catch { toast.error('Failed to load products') }
    finally { setLoading(false) }
  }, [page])

  useEffect(() => { loadProducts(page) }, [page])

  // Entrance animation
  useGSAP(() => {
    if (headerRef.current)
      gsap.fromTo(headerRef.current, { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' })
  }, [])

  useGSAP(() => {
    if (!loading && tableRef.current) {
      gsap.fromTo(tableRef.current.querySelectorAll('tbody tr'),
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, stagger: 0.03, duration: 0.35, ease: 'power3.out' }
      )
    }
  }, [loading])

  // Optimistic toggle
  const handleToggle = (id, type) => {
    setProducts(prev => prev.map(p => {
      if (p._id !== id) return p
      if (type === 'featured')   return { ...p, featured:   !p.featured   }
      if (type === 'bestSeller') return { ...p, bestSeller: !p.bestSeller }
      if (type === 'active')     return { ...p, active:     !p.active     }
      return p
    }))
  }

  const handleSaved = (saved, isEdit) => {
    if (isEdit) {
      setProducts(prev => prev.map(p => p._id === saved._id ? saved : p))
    } else {
      loadProducts(1)
      setPage(1)
    }
  }

  const handleDeleted = (id) => {
    setProducts(prev => prev.map(p => p._id === id ? { ...p, active: false } : p))
  }

  const handleStockUpdated = (updated) => {
    setProducts(prev => prev.map(p => p._id === updated._id ? { ...p, stock: updated.stock } : p))
  }

  // Client-side search + filter on current page data
  const visible = products.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.category?.name?.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || (statusFilter === 'active' ? p.active : !p.active)
    return matchSearch && matchStatus
  })

  const activeCount   = products.filter(p => p.active).length
  const inactiveCount = products.filter(p => !p.active).length

  return (
    <div>
      {/* Header */}
      <div ref={headerRef} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.3rem,2vw,1.7rem)', color: '#26221C', margin: '0 0 4px' }}>Products</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#A89F8C', margin: 0 }}>
            {pagination.total} total · {activeCount} active · {inactiveCount} inactive
          </p>
        </div>
        <button onClick={() => setModal('create')}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '10px 18px', borderRadius: 11, border: 'none',
            background: 'linear-gradient(135deg,#2D6A4F,#1B4332)',
            color: '#fff', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', boxShadow: '0 4px 14px rgba(45,106,79,0.28)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 7px 20px rgba(45,106,79,0.35)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(45,106,79,0.28)' }}>
          <IcoPlus /> Add Product
        </button>
      </div>

      {/* Table card */}
      <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #F0EBE1', boxShadow: '0 2px 16px rgba(45,106,79,0.06)', overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid #F5F0E8', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, border: '1.5px solid #E8E0D0', background: '#FAFAF7', flex: 1, minWidth: 200 }}>
            <span style={{ color: '#A89F8C', flexShrink: 0 }}><IcoSearch /></span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or category…"
              style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-body)', fontSize: 13, color: '#26221C', width: '100%' }} />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A89F8C', display: 'flex', padding: 0 }}><IcoClose /></button>
            )}
          </div>

          {/* Status filter */}
          <div style={{ display: 'flex', gap: 4, background: '#F5F0E8', borderRadius: 10, padding: 3 }}>
            {[['all', 'All'], ['active', 'Active'], ['inactive', 'Inactive']].map(([val, lbl]) => (
              <button key={val} onClick={() => setStatusFilter(val)}
                style={{
                  padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
                  background: statusFilter === val ? '#fff' : 'transparent',
                  color: statusFilter === val ? '#26221C' : '#A89F8C',
                  boxShadow: statusFilter === val ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s',
                }}>
                {lbl}
              </button>
            ))}
          </div>

          {/* Reload */}
          <button onClick={() => loadProducts(page)} title="Refresh"
            style={{ width: 36, height: 36, borderRadius: 9, border: '1.5px solid #E8E0D0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5C5548', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#F5F0E8'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
            <IcoRestore />
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table ref={tableRef} style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFAF7', borderBottom: '1px solid #F0EBE1' }}>
                {['Product', 'Price', 'Stock', 'Flags', 'Status', ''].map((h, i) => (
                  <th key={i} style={{ padding: '10px 16px', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, color: '#A89F8C', letterSpacing: '0.07em', textTransform: 'uppercase', textAlign: i === 5 ? 'right' : 'left', whiteSpace: 'nowrap' }}>
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
                    <tr>
                      <td colSpan={6} style={{ padding: '48px 24px', textAlign: 'center' }}>
                        <div style={{ color: '#C4B9A8', marginBottom: 10, display: 'flex', justifyContent: 'center' }}><IcoBox /></div>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#A89F8C', margin: 0 }}>
                          {search ? `No products matching "${search}"` : 'No products yet'}
                        </p>
                      </td>
                    </tr>
                  )
                  : visible.map(p => (
                    <ProductRow key={p._id} product={p} categories={categories}
                      onEdit={p => { setEditTarget(p); setModal('edit') }}
                      onStock={setStockTarget}
                      onDelete={setDeleteTarget}
                      onToggle={handleToggle}
                    />
                  ))
              }
            </tbody>
          </table>
        </div>

        {/* Pagination — only when not filtering client-side */}
        {!loading && !search && statusFilter === 'all' && pagination.pages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid #F5F0E8', flexWrap: 'wrap', gap: 10 }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#A89F8C', margin: 0 }}>
              Page {pagination.page} of {pagination.pages} ({pagination.total} products)
            </p>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid #E8E0D0', background: '#fff', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, color: '#5C5548' }}>
                ← Prev
              </button>
              {Array.from({ length: Math.min(pagination.pages, 7) }).map((_, i) => {
                const n = i + 1
                return (
                  <button key={n} onClick={() => setPage(n)}
                    style={{ width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, background: page === n ? '#2D6A4F' : 'transparent', color: page === n ? '#fff' : '#5C5548', transition: 'all 0.15s' }}>
                    {n}
                  </button>
                )
              })}
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid #E8E0D0', background: '#fff', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, cursor: page === pagination.pages ? 'not-allowed' : 'pointer', opacity: page === pagination.pages ? 0.4 : 1, color: '#5C5548' }}>
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {(modal === 'create' || modal === 'edit') && (
        <ProductModal
          mode={modal}
          product={modal === 'edit' ? editTarget : null}
          categories={categories}
          onClose={() => { setModal(null); setEditTarget(null) }}
          onSaved={handleSaved}
        />
      )}
      {stockTarget  && <StockModal  product={stockTarget}  onClose={() => setStockTarget(null)}  onUpdated={handleStockUpdated} />}
      {deleteTarget && <DeleteModal product={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} />}

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.45; } }
      `}</style>
    </div>
  )
}