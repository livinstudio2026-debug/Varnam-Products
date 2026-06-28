// src/pages/admin/AdminBanners.jsx  —  Step 23 (Banners)
// APIs:
//   GET    /api/banners/all              → all banners including inactive
//   POST   /api/upload/banner            → upload image first
//   POST   /api/banners                  → create
//   PUT    /api/banners/:id              → edit
//   PATCH  /api/banners/status/:id       → toggle active
//   DELETE /api/banners/:id              → delete record
//   DELETE /api/upload                   → delete image from Cloudinary (call separately)

import { useState, useEffect, useRef, useCallback } from 'react'
import { Link }                                      from 'react-router-dom'
import { gsap }                                      from 'gsap'
import { useGSAP }                                   from '@gsap/react'
import toast                                         from 'react-hot-toast'
import { bannerAPI, uploadAPI }                      from '../../services/api'

/* ─── Icons ─────────────────────────────────────────────────────────────────── */
const Ico = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
)
const IconImage   = ({ size = 18 }) => <Ico size={size} d={<><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>} />
const IconPlus    = () => <Ico d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} />
const IconEdit    = () => <Ico d={<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>} />
const IconTrash   = () => <Ico d={<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></>} />
const IconUpload  = () => <Ico size={20} d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>} />
const IconX       = () => <Ico d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>} />
const IconRefresh = () => <Ico d={<><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></>} />
const IconToggle  = () => <Ico d={<><rect x="1" y="5" width="22" height="14" rx="7"/><circle cx="16" cy="12" r="4" fill="currentColor" stroke="none"/></>} />
const IconCheck   = () => <Ico d={<polyline points="20 6 9 17 4 12"/>} />
const IconEye     = () => <Ico d={<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>} />
const IconEyeOff  = () => <Ico d={<><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>} />

/* ─── Shared styles ──────────────────────────────────────────────────────────── */
const labelStyle = {
  display: 'block', fontFamily: 'var(--font-body)',
  fontSize: 12, fontWeight: 600, color: '#3D3830', marginBottom: 7,
}
const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  padding: '10px 12px', borderRadius: 10,
  border: '1.5px solid #E8E0D0', background: '#FAFAF7',
  fontFamily: 'var(--font-body)', fontSize: 13, color: '#26221C',
  outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
}
const focus = (e) => { e.target.style.borderColor = '#2D6A4F'; e.target.style.boxShadow = '0 0 0 3px rgba(45,106,79,0.1)' }
const blur  = (e) => { e.target.style.borderColor = '#E8E0D0'; e.target.style.boxShadow = 'none' }

const btnStyle = (variant) => ({
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
  fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
  transition: 'all 0.18s',
  ...(variant === 'primary' && { background: '#2D6A4F', color: '#fff', boxShadow: '0 4px 12px rgba(45,106,79,0.25)' }),
  ...(variant === 'ghost'   && { background: '#fff', color: '#5C5548', border: '1.5px solid #E8E0D0' }),
  ...(variant === 'danger'  && { background: 'rgba(220,38,38,0.08)', color: '#DC2626', border: '1.5px solid rgba(220,38,38,0.2)' }),
  ...(variant === 'icon'    && { background: '#fff', color: '#7A7265', border: '1.5px solid #E8E0D0', padding: '7px 9px' }),
})

function Spinner({ color = '#fff', size = 14 }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid ${color}40`, borderTopColor: color,
      display: 'inline-block', animation: 'spin 0.7s linear infinite', flexShrink: 0,
    }} />
  )
}

/* ─── Modal wrapper ──────────────────────────────────────────────────────────── */
function Modal({ title, onClose, children, wide }) {
  const overlayRef = useRef(null)
  const boxRef     = useRef(null)

  useGSAP(() => {
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2 })
    gsap.fromTo(boxRef.current, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.28, ease: 'power3.out' })
  }, [])

  const close = () => {
    gsap.to(boxRef.current,     { y: 16, opacity: 0, duration: 0.18, ease: 'power2.in' })
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.2, onComplete: onClose })
  }

  return (
    <div ref={overlayRef} style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(38,34,28,0.45)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',          /* uniform on all sides — works on 320px phones */
    }} onClick={e => { if (e.target === overlayRef.current) close() }}>
      <div ref={boxRef} style={{
        background: '#fff', borderRadius: 20, width: '100%',
        maxWidth: wide ? 640 : 500,
        maxHeight: '92vh',
        display: 'flex', flexDirection: 'column',   /* header fixed, body scrolls */
        boxShadow: '0 24px 80px rgba(38,34,28,0.22)',
        overflow: 'hidden',                          /* clip border-radius cleanly */
      }}>
        {/* sticky header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #F0EBE1', flexShrink: 0 }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 17, color: '#26221C', margin: 0 }}>{title}</h2>
          <button onClick={close} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, border: '1px solid #E8E0D0', background: '#fff', cursor: 'pointer', color: '#7A7265' }}>
            <IconX />
          </button>
        </div>
        {/* scrollable body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  )
}

/* ─── Delete confirm ─────────────────────────────────────────────────────────── */
function DeleteModal({ banner, onConfirm, onClose, loading }) {
  return (
    <Modal title="Delete Banner" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {banner.image && (
          <img src={banner.image} alt={banner.title} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 10, border: '1px solid #F0EBE1' }} />
        )}
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#7A7265', margin: 0, lineHeight: 1.6 }}>
          Delete <strong style={{ color: '#26221C' }}>{banner.title || 'this banner'}</strong>?
          The Cloudinary image will also be removed if a publicId is stored.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={loading} style={btnStyle('ghost')}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={btnStyle('danger')}>
            {loading ? <Spinner /> : <><IconTrash /> Delete</>}
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ─── Banner form modal ──────────────────────────────────────────────────────── */
function BannerFormModal({ initial, onSave, onClose }) {
  const isEdit = !!initial

  const [form, setForm] = useState({
    title:      initial?.title      || '',
    subtitle:   initial?.subtitle   || '',
    buttonText: initial?.buttonText || '',
    buttonLink: initial?.buttonLink || '',
    order:      initial?.order ?? 0,
    image:      initial?.image      || '',
    publicId:   initial?.publicId   || '',
  })
  const [uploading, setUploading] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [dragOver,  setDragOver]  = useState(false)
  const fileRef = useRef(null)

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) { toast.error('Select an image file'); return }
    setUploading(true)
    try {
      const { data } = await uploadAPI.uploadBannerImage(file)
      const url = data.url || data.data?.url || ''
      const pid = data.publicId || data.data?.publicId || ''
      setForm(prev => ({ ...prev, image: url, publicId: pid }))
      toast.success('Image uploaded')
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleSubmit = async () => {
    if (!form.image) { toast.error('Please upload a banner image'); return }
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={isEdit ? 'Edit Banner' : 'New Banner'} onClose={onClose} wide>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Image */}
        <div>
          <label style={labelStyle}>Banner Image <span style={{ color: '#DC2626' }}>*</span></label>
          <div
            onClick={() => !uploading && fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragOver ? '#2D6A4F' : form.image ? '#52B788' : '#E8E0D0'}`,
              borderRadius: 12, cursor: uploading ? 'wait' : 'pointer',
              background: dragOver ? 'rgba(45,106,79,0.04)' : '#FAFAF7',
              overflow: 'hidden', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              minHeight: form.image ? 'auto' : 120,
            }}
          >
            {form.image ? (
              <div style={{ position: 'relative', width: '100%' }}>
                <img src={form.image} alt="preview" style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} />
                <button
                  onClick={e => { e.stopPropagation(); setForm(prev => ({ ...prev, image: '', publicId: '' })) }}
                  style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(38,34,28,0.7)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <IconX />
                </button>
              </div>
            ) : uploading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '24px 0' }}>
                <Spinner color="#2D6A4F" size={22} />
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#A89F8C', margin: 0 }}>Uploading…</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '24px 0', color: '#A89F8C' }}>
                <IconUpload />
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, margin: 0 }}>Click or drag to upload</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, margin: 0, color: '#C8BDB0' }}>Recommended: 1440×600px</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
        </div>

        {/* Two-column fields — stacks to 1-col on tablet/mobile */}
        <div className="banner-form-grid">
          <div>
            <label style={labelStyle}>Title</label>
            <input value={form.title} onChange={set('title')} placeholder="Headline text" style={inputStyle} onFocus={focus} onBlur={blur} />
          </div>
          <div>
            <label style={labelStyle}>Subtitle</label>
            <input value={form.subtitle} onChange={set('subtitle')} placeholder="Supporting text" style={inputStyle} onFocus={focus} onBlur={blur} />
          </div>
          <div>
            <label style={labelStyle}>Button Text</label>
            <input value={form.buttonText} onChange={set('buttonText')} placeholder="e.g. Shop Now" style={inputStyle} onFocus={focus} onBlur={blur} />
          </div>
          <div>
            <label style={labelStyle}>Button Link</label>
            <input value={form.buttonLink} onChange={set('buttonLink')} placeholder="/shop or https://…" style={inputStyle} onFocus={focus} onBlur={blur} />
          </div>
        </div>

        <div className="banner-order-row">
          <label style={labelStyle}>Display Order</label>
          <input
            type="number" min={0}
            value={form.order}
            onChange={e => setForm(prev => ({ ...prev, order: Number(e.target.value) }))}
            style={inputStyle}
            onFocus={focus} onBlur={blur}
          />
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C', margin: '5px 0 0' }}>Lower = shown first</p>
        </div>

        <div className="banner-form-footer">
          <button onClick={onClose} disabled={saving} style={btnStyle('ghost')}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving || uploading} style={btnStyle('primary')}>
            {saving ? <Spinner /> : isEdit ? <><IconCheck /> Save changes</> : <><IconPlus /> Create banner</>}
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ─── Banner row ─────────────────────────────────────────────────────────────── */
function BannerRow({ banner, onEdit, onDelete, onToggle, toggling }) {
  const rowRef = useRef(null)

  return (
    <div ref={rowRef} className="banner-row" style={{
      background: '#fff', borderRadius: 16, border: '1px solid #F0EBE1',
      overflow: 'hidden', boxShadow: '0 2px 12px rgba(45,106,79,0.04)',
      opacity: banner.active ? 1 : 0.65, transition: 'opacity 0.3s',
    }}>
      {/* Inner flex — row on desktop, column on mobile via CSS class */}
      <div className="banner-row-inner">
        {/* Thumbnail */}
        <div className="banner-thumb">
          {banner.image
            ? <img src={banner.image} alt={banner.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: 88 }} onError={e => { e.target.style.display = 'none' }} />
            : <div style={{ width: '100%', minHeight: 88, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D0C8B5' }}><IconImage size={28} /></div>
          }
          <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(38,34,28,0.6)', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5 }}>
            #{banner.order}
          </div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, padding: '14px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, color: '#26221C', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {banner.title || <span style={{ color: '#A89F8C', fontStyle: 'italic' }}>No title</span>}
            </p>
            <span style={{
              padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-body)',
              background: banner.active ? 'rgba(6,95,70,0.09)' : 'rgba(220,38,38,0.09)',
              color: banner.active ? '#065F46' : '#DC2626',
            }}>
              {banner.active ? 'Active' : 'Hidden'}
            </span>
          </div>
          {banner.subtitle && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#7A7265', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {banner.subtitle}
            </p>
          )}
          {banner.buttonText && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C', margin: 0 }}>
              Button: <strong>{banner.buttonText}</strong>{banner.buttonLink && ` → ${banner.buttonLink}`}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="banner-actions">
          <button
            onClick={() => onToggle(banner)}
            disabled={toggling === banner._id}
            title={banner.active ? 'Hide banner' : 'Show banner'}
            style={{
              ...btnStyle('icon'),
              color: banner.active ? '#065F46' : '#A89F8C',
              borderColor: banner.active ? 'rgba(6,95,70,0.25)' : '#E8E0D0',
              background: banner.active ? 'rgba(6,95,70,0.06)' : '#fff',
            }}
          >
            {toggling === banner._id ? <Spinner color={banner.active ? '#065F46' : '#A89F8C'} /> : banner.active ? <IconEye /> : <IconEyeOff />}
          </button>
          <button onClick={() => onEdit(banner)} style={btnStyle('icon')} title="Edit"><IconEdit /></button>
          <button onClick={() => onDelete(banner)} style={{ ...btnStyle('icon'), color: '#DC2626', borderColor: 'rgba(220,38,38,0.2)' }} title="Delete"><IconTrash /></button>
        </div>
      </div>
    </div>
  )
}

/* ─── Main page ──────────────────────────────────────────────────────────────── */
export default function AdminBanners() {
  const [banners,   setBanners]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [formModal, setFormModal] = useState(null)  // null | 'create' | banner object
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting,  setDeleting]  = useState(false)
  const [toggling,  setToggling]  = useState(null)  // banner._id being toggled

  const headerRef = useRef(null)
  const listRef   = useRef(null)

  const fetchBanners = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await bannerAPI.getAll()
      if (data.success) setBanners(data.data)
    } catch {
      toast.error('Failed to load banners')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchBanners() }, [fetchBanners])

  useGSAP(() => {
    if (headerRef.current)
      gsap.fromTo(headerRef.current, { y: -14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out' })
  }, [])

  useGSAP(() => {
    if (loading || !listRef.current) return
    gsap.fromTo(listRef.current.querySelectorAll('.banner-row'),
      { x: -16, opacity: 0 },
      { x: 0, opacity: 1, stagger: 0.07, duration: 0.4, ease: 'power3.out' }
    )
  }, [loading])

  const handleCreate = async (payload) => {
    try {
      const { data } = await bannerAPI.create(payload)
      if (data.success) {
        setBanners(prev => [...prev, data.data].sort((a, b) => a.order - b.order))
        setFormModal(null)
        toast.success('Banner created')
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create banner')
      throw err
    }
  }

  const handleEdit = async (payload) => {
    try {
      const { data } = await bannerAPI.update(formModal._id, payload)
      if (data.success) {
        setBanners(prev => prev.map(b => b._id === formModal._id ? data.data : b).sort((a, b) => a.order - b.order))
        setFormModal(null)
        toast.success('Banner updated')
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update banner')
      throw err
    }
  }

  const handleToggle = async (banner) => {
    setToggling(banner._id)
    try {
      const { data } = await bannerAPI.toggleStatus(banner._id)
      if (data.success) {
        setBanners(prev => prev.map(b => b._id === banner._id ? data.data : b))
      }
    } catch {
      toast.error('Failed to toggle banner status')
    } finally {
      setToggling(null)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      // Delete Cloudinary asset first if publicId exists
      if (deleteTarget.publicId) {
        try { await uploadAPI.deleteAsset(deleteTarget.publicId) } catch { /* non-fatal */ }
      }
      await bannerAPI.delete(deleteTarget._id)
      setBanners(prev => prev.filter(b => b._id !== deleteTarget._id))
      setDeleteTarget(null)
      toast.success('Banner deleted')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete banner')
    } finally {
      setDeleting(false)
    }
  }

  const activeBanners   = banners.filter(b => b.active)
  const inactiveBanners = banners.filter(b => !b.active)

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#F5F0E8 0%,#FAFAF7 100px)', paddingBottom: 80 }}>

      {/* Header */}
      <div ref={headerRef} style={{ background: '#fff', borderBottom: '1px solid #F0EBE1', padding: '18px 0', boxShadow: '0 1px 0 rgba(45,106,79,0.06)' }}>
        <div className="container-main">
          <nav style={{ display: 'flex', gap: 6, fontSize: 12, color: '#A89F8C', marginBottom: 6, fontFamily: 'var(--font-body)' }}>
            <Link to="/admin" style={{ color: '#A89F8C', textDecoration: 'none' }}>Admin</Link>
            <span>/</span><span style={{ color: '#26221C' }}>Banners</span>
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(45,106,79,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2D6A4F' }}>
                <IconImage />
              </div>
              <div>
                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.1rem,2.5vw,1.4rem)', color: '#26221C', margin: 0 }}>Banners</h1>
                {!loading && (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#A89F8C', margin: '2px 0 0' }}>
                    {activeBanners.length} active · {inactiveBanners.length} hidden
                  </p>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={fetchBanners} disabled={loading} style={btnStyle('ghost')}>
                <span style={{ display: 'flex', animation: loading ? 'spin 0.8s linear infinite' : 'none' }}><IconRefresh /></span>
              </button>
              <button onClick={() => setFormModal('create')} style={btnStyle('primary')}>
                <IconPlus /> New Banner
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-main" style={{ paddingTop: 28 }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 16, border: '1px solid #F0EBE1', display: 'flex', overflow: 'hidden' }}>
                <div className="skeleton" style={{ width: 160, minHeight: 88, flexShrink: 0 }} />
                <div style={{ flex: 1, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="skeleton" style={{ height: 13, width: '40%', borderRadius: 5 }} />
                  <div className="skeleton" style={{ height: 11, width: '60%', borderRadius: 5 }} />
                </div>
              </div>
            ))}
          </div>
        ) : banners.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 24px', textAlign: 'center' }}>
            <div style={{ marginBottom: 14, color: '#D0C8B5' }}><IconImage size={48} /></div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, color: '#26221C', margin: '0 0 8px' }}>No banners yet</h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#A89F8C', margin: '0 0 20px' }}>Add homepage banners to promote products and offers.</p>
            <button onClick={() => setFormModal('create')} style={btnStyle('primary')}><IconPlus /> New Banner</button>
          </div>
        ) : (
          <div ref={listRef} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Active */}
            {activeBanners.length > 0 && (
              <section>
                <h2 style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, color: '#065F46', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>
                  Active ({activeBanners.length})
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {activeBanners.map(b => (
                    <BannerRow key={b._id} banner={b} onEdit={setFormModal} onDelete={setDeleteTarget} onToggle={handleToggle} toggling={toggling} />
                  ))}
                </div>
              </section>
            )}

            {/* Hidden */}
            {inactiveBanners.length > 0 && (
              <section>
                <h2 style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, color: '#A89F8C', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>
                  Hidden ({inactiveBanners.length})
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {inactiveBanners.map(b => (
                    <BannerRow key={b._id} banner={b} onEdit={setFormModal} onDelete={setDeleteTarget} onToggle={handleToggle} toggling={toggling} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {formModal && (
        <BannerFormModal
          initial={formModal === 'create' ? null : formModal}
          onSave={formModal === 'create' ? handleCreate : handleEdit}
          onClose={() => setFormModal(null)}
        />
      )}
      {deleteTarget && (
        <DeleteModal banner={deleteTarget} loading={deleting} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />
      )}

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        /* ── Skeleton ── */
        .skeleton {
          background: linear-gradient(90deg, #F5F0E8 25%, #EDE8DF 50%, #F5F0E8 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }

        /* ── Banner row: always horizontal, stack only on tiny mobile ── */
        .banner-row-inner {
          display: flex;
          align-items: stretch;
        }
        .banner-thumb {
          width: 160px;
          flex-shrink: 0;
          background: #F5F0E8;
          position: relative;
          overflow: hidden;
        }
        .banner-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 14px;
          flex-shrink: 0;
        }
        @media (max-width: 480px) {
          .banner-row-inner   { flex-direction: column; }
          .banner-thumb       { width: 100%; height: 110px; }
          .banner-thumb img   { height: 110px !important; min-height: unset !important; }
          .banner-actions     { padding: 10px 14px 14px; justify-content: flex-end; border-top: 1px solid #F5F0E8; }
        }

        /* ── Form modal: two-col → one-col ── */
        /* Breakpoint is 560px — covers tablet modals where the modal is
           already narrow because of the 16px overlay padding on each side */
        .banner-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 560px) {
          .banner-form-grid { grid-template-columns: 1fr; }
        }

        /* ── Order field: constrained on desktop, full-width on mobile ── */
        .banner-order-row {
          max-width: 160px;
        }
        @media (max-width: 560px) {
          .banner-order-row { max-width: 100%; }
        }

        /* ── Footer buttons: right-aligned row, stack on tiny mobile ── */
        .banner-form-footer {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          padding-top: 4px;
          border-top: 1px solid #F5F0E8;
          flex-wrap: wrap;
        }
        @media (max-width: 400px) {
          .banner-form-footer          { flex-direction: column-reverse; }
          .banner-form-footer > button { width: 100%; justify-content: center; }
        }
      `}</style>
    </div>
  )
}