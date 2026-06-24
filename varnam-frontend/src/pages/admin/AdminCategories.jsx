// src/pages/admin/AdminCategories.jsx  —  Step 23 (Categories)
// APIs:
//   GET    /api/categories          → list all (admin sees active + inactive via full list below)
//   POST   /api/upload/category     → upload image first
//   POST   /api/categories          → create
//   PUT    /api/categories/:id      → edit
//   DELETE /api/categories/:id      → delete

import { useState, useEffect, useRef, useCallback } from 'react'
import { Link }                                      from 'react-router-dom'
import { gsap }                                      from 'gsap'
import { useGSAP }                                   from '@gsap/react'
import toast                                         from 'react-hot-toast'
import { categoryAPI, uploadAPI }                    from '../../services/api'

/* ─── Icons ─────────────────────────────────────────────────────────────────── */
const Ico = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
)
const IconGrid    = () => <Ico size={18} d={<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>} />
const IconPlus    = () => <Ico d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} />
const IconEdit    = () => <Ico d={<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>} />
const IconTrash   = () => <Ico d={<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></>} />
const IconUpload  = () => <Ico size={20} d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>} />
const IconX       = () => <Ico d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>} />
const IconRefresh = () => <Ico d={<><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></>} />
const IconCheck   = () => <Ico d={<polyline points="20 6 9 17 4 12"/>} />
const IconImage   = () => <Ico size={24} d={<><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>} />

/* ─── Helpers ────────────────────────────────────────────────────────────────── */
const slugify = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

/* ─── Modal ─────────────────────────────────────────────────────────────────── */
function Modal({ title, onClose, children }) {
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
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={e => { if (e.target === overlayRef.current) close() }}>
      <div ref={boxRef} style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 480,
        boxShadow: '0 24px 80px rgba(38,34,28,0.22)', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #F0EBE1' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 17, color: '#26221C', margin: 0 }}>{title}</h2>
          <button onClick={close} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, border: '1px solid #E8E0D0', background: '#fff', cursor: 'pointer', color: '#7A7265' }}>
            <IconX />
          </button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  )
}

/* ─── Delete confirm modal ──────────────────────────────────────────────────── */
function DeleteModal({ category, onConfirm, onClose, loading }) {
  return (
    <Modal title="Delete Category" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#7A7265', margin: 0, lineHeight: 1.6 }}>
          Are you sure you want to delete <strong style={{ color: '#26221C' }}>{category.name}</strong>?
          Products in this category will be unlinked but not deleted.
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

/* ─── Category form modal ───────────────────────────────────────────────────── */
function CategoryFormModal({ initial, onSave, onClose }) {
  const [name,         setName]         = useState(initial?.name  || '')
  const [imageUrl,     setImageUrl]     = useState(initial?.image || '')
  const [uploading,    setUploading]    = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [dragOver,     setDragOver]     = useState(false)
  const fileRef = useRef(null)

  const isEdit = !!initial

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) { toast.error('Please select an image file'); return }
    setUploading(true)
    try {
      const { data } = await uploadAPI.uploadCategoryImage(file)
      setImageUrl(data.url || data.data?.url || '')
      toast.success('Image uploaded')
    } catch {
      toast.error('Image upload failed')
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
    if (!name.trim()) { toast.error('Category name is required'); return }
    setSaving(true)
    try {
      await onSave({ name: name.trim(), image: imageUrl || undefined })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={isEdit ? 'Edit Category' : 'New Category'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Image upload */}
        <div>
          <label style={labelStyle}>Category Image</label>
          <div
            onClick={() => !uploading && fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragOver ? '#2D6A4F' : imageUrl ? '#52B788' : '#E8E0D0'}`,
              borderRadius: 14, padding: imageUrl ? 0 : '28px 20px',
              background: dragOver ? 'rgba(45,106,79,0.04)' : '#FAFAF7',
              cursor: uploading ? 'wait' : 'pointer',
              transition: 'all 0.2s', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {imageUrl ? (
              <div style={{ position: 'relative', width: '100%' }}>
                <img src={imageUrl} alt="preview" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
                <button
                  onClick={e => { e.stopPropagation(); setImageUrl('') }}
                  style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(38,34,28,0.7)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <IconX />
                </button>
              </div>
            ) : uploading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <Spinner color="#2D6A4F" size={22} />
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#A89F8C', margin: 0 }}>Uploading…</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: '#A89F8C' }}>
                <IconUpload />
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#A89F8C', margin: 0 }}>
                  Click or drag to upload image
                </p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
        </div>

        {/* Name */}
        <div>
          <label style={labelStyle}>Category Name <span style={{ color: '#DC2626' }}>*</span></label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="e.g. Cold Pressed Oils"
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = '#2D6A4F'; e.target.style.boxShadow = '0 0 0 3px rgba(45,106,79,0.1)' }}
            onBlur={e  => { e.target.style.borderColor = '#E8E0D0'; e.target.style.boxShadow = 'none' }}
          />
          {name && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C', margin: '5px 0 0' }}>
              Slug: <code style={{ background: '#F5F0E8', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>{slugify(name)}</code>
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
          <button onClick={onClose} disabled={saving} style={btnStyle('ghost')}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving || uploading} style={btnStyle('primary')}>
            {saving ? <Spinner /> : isEdit ? <><IconCheck /> Save changes</> : <><IconPlus /> Create category</>}
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ─── Shared style helpers ───────────────────────────────────────────────────── */
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
const btnStyle = (variant) => ({
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
  fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
  transition: 'all 0.18s',
  ...(variant === 'primary' && { background: '#2D6A4F', color: '#fff', boxShadow: '0 4px 12px rgba(45,106,79,0.25)' }),
  ...(variant === 'ghost'   && { background: '#fff', color: '#5C5548', border: '1.5px solid #E8E0D0' }),
  ...(variant === 'danger'  && { background: 'rgba(220,38,38,0.08)', color: '#DC2626', border: '1.5px solid rgba(220,38,38,0.2)' }),
  ...(variant === 'icon'    && { background: '#fff', color: '#7A7265', border: '1.5px solid #E8E0D0', padding: '7px 10px' }),
})

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

/* ─── Category card ──────────────────────────────────────────────────────────── */
function CategoryCard({ category, onEdit, onDelete }) {
  const cardRef = useRef(null)
  const onEnter = () => gsap.to(cardRef.current, { y: -3, boxShadow: '0 8px 28px rgba(45,106,79,0.12)', duration: 0.2, ease: 'power2.out' })
  const onLeave = () => gsap.to(cardRef.current, { y: 0,  boxShadow: '0 2px 12px rgba(45,106,79,0.05)', duration: 0.2, ease: 'power2.out' })

  return (
    <div ref={cardRef} onMouseEnter={onEnter} onMouseLeave={onLeave}
      className="cat-card"
      style={{ background: '#fff', borderRadius: 16, border: '1px solid #F0EBE1', overflow: 'hidden', boxShadow: '0 2px 12px rgba(45,106,79,0.05)', transition: 'border-color 0.2s' }}>

      {/* Image */}
      <div style={{ width: '100%', height: 130, background: '#F5F0E8', overflow: 'hidden', position: 'relative' }}>
        {category.image ? (
          <img src={category.image} alt={category.name} loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={e => { e.target.style.display = 'none' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D0C8B5' }}>
            <IconImage />
          </div>
        )}
        {/* active badge */}
        <div style={{ position: 'absolute', top: 8, right: 8 }}>
          <span style={{
            padding: '3px 9px', borderRadius: 99, fontSize: 10, fontWeight: 700,
            fontFamily: 'var(--font-body)',
            background: category.active ? 'rgba(6,95,70,0.88)' : 'rgba(220,38,38,0.82)',
            color: '#fff',
          }}>
            {category.active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px' }}>
        <p style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, color: '#26221C', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {category.name}
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#A89F8C', margin: '0 0 12px' }}>
          /{category.slug}
        </p>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => onEdit(category)} style={{ ...btnStyle('ghost'), flex: 1, justifyContent: 'center', padding: '7px 10px', fontSize: 12 }}>
            <IconEdit /> Edit
          </button>
          <button onClick={() => onDelete(category)} style={{ ...btnStyle('icon'), padding: '7px 10px' }}>
            <IconTrash />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Main page ──────────────────────────────────────────────────────────────── */
export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [formModal,  setFormModal]  = useState(null)   // null | 'create' | category object
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting,   setDeleting]   = useState(false)

  const headerRef = useRef(null)
  const gridRef   = useRef(null)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await categoryAPI.getAll()
      if (data.success) setCategories(data.data)
    } catch {
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCategories() }, [fetchCategories])

  // Entrance animation
  useGSAP(() => {
    if (headerRef.current)
      gsap.fromTo(headerRef.current, { y: -14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out' })
  }, [])

  useGSAP(() => {
    if (loading || !gridRef.current) return
    gsap.fromTo(gridRef.current.querySelectorAll('.cat-card'),
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.06, duration: 0.4, ease: 'power3.out' }
    )
  }, [loading])

  const handleCreate = async (payload) => {
    try {
      const { data } = await categoryAPI.create(payload)
      if (data.success) {
        setCategories(prev => [...prev, data.data])
        setFormModal(null)
        toast.success('Category created')
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create category')
      throw err
    }
  }

  const handleEdit = async (payload) => {
    try {
      const { data } = await categoryAPI.update(formModal._id, payload)
      if (data.success) {
        setCategories(prev => prev.map(c => c._id === formModal._id ? data.data : c))
        setFormModal(null)
        toast.success('Category updated')
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update category')
      throw err
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await categoryAPI.delete(deleteTarget._id)
      setCategories(prev => prev.filter(c => c._id !== deleteTarget._id))
      setDeleteTarget(null)
      toast.success('Category deleted')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete category')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#F5F0E8 0%,#FAFAF7 100px)', paddingBottom: 80 }}>

      {/* Header */}
      <div ref={headerRef} style={{ background: '#fff', borderBottom: '1px solid #F0EBE1', padding: '18px 0', boxShadow: '0 1px 0 rgba(45,106,79,0.06)' }}>
        <div className="container-main">
          <nav style={{ display: 'flex', gap: 6, fontSize: 12, color: '#A89F8C', marginBottom: 6, fontFamily: 'var(--font-body)' }}>
            <Link to="/admin" style={{ color: '#A89F8C', textDecoration: 'none' }}>Admin</Link>
            <span>/</span><span style={{ color: '#26221C' }}>Categories</span>
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(45,106,79,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2D6A4F' }}>
                <IconGrid />
              </div>
              <div>
                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.1rem,2.5vw,1.4rem)', color: '#26221C', margin: 0 }}>Categories</h1>
                {!loading && <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#A89F8C', margin: '2px 0 0' }}>{categories.length} total</p>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={fetchCategories} disabled={loading} style={btnStyle('ghost')}>
                <span style={{ display: 'flex', animation: loading ? 'spin 0.8s linear infinite' : 'none' }}><IconRefresh /></span>
              </button>
              <button onClick={() => setFormModal('create')} style={btnStyle('primary')}>
                <IconPlus /> New Category
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-main" style={{ paddingTop: 28 }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 16, border: '1px solid #F0EBE1', overflow: 'hidden' }}>
                <div className="skeleton" style={{ height: 130 }} />
                <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="skeleton" style={{ height: 13, width: '70%', borderRadius: 5 }} />
                  <div className="skeleton" style={{ height: 11, width: '50%', borderRadius: 5 }} />
                  <div className="skeleton" style={{ height: 32, borderRadius: 8, marginTop: 4 }} />
                </div>
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
            <div style={{ marginBottom: 16, color: '#D0C8B5' }}><IconGrid /></div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, color: '#26221C', margin: '0 0 8px' }}>No categories yet</h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#A89F8C', margin: '0 0 20px' }}>Create your first product category to get started.</p>
            <button onClick={() => setFormModal('create')} style={btnStyle('primary')}><IconPlus /> New Category</button>
          </div>
        ) : (
          <div ref={gridRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
            {categories.map(cat => (
              <CategoryCard
                key={cat._id}
                category={cat}
                onEdit={c => setFormModal(c)}
                onDelete={c => setDeleteTarget(c)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {formModal && (
        <CategoryFormModal
          initial={formModal === 'create' ? null : formModal}
          onSave={formModal === 'create' ? handleCreate : handleEdit}
          onClose={() => setFormModal(null)}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          category={deleteTarget}
          loading={deleting}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}