// src/pages/ProductDetail.jsx  — Step 12
// Fields from server:  name, slug, shortDescription, description, price,
//   discountPrice, images[], stock, ingredients[], benefits[], category{name,slug},
//   featured, bestSeller, ratings, totalSales

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import toast from 'react-hot-toast'
import { productAPI } from '../services/api'
import { useCartStore } from '../store/cartStore'
import ProductCard from '../components/ui/ProductCard'

gsap.registerPlugin(ScrollTrigger)

/* ─── helpers ─────────────────────────────────────────────────────────── */
const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

const pct = (price, disc) =>
  price > 0 && disc > 0 ? Math.round(((price - disc) / price) * 100) : 0

/* ─── icons ────────────────────────────────────────────────────────────── */
const ChevLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)
const ChevRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)
const CartIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
)
const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const MinusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const LeafIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
  </svg>
)
const SparkleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"/>
  </svg>
)
const FlaskIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3h6v7l3.5 7A2 2 0 0 1 16.7 20H7.3a2 2 0 0 1-1.8-3L9 10V3z"/>
    <line x1="9" y1="3" x2="15" y2="3"/>
    <path d="M6.5 15h11"/>
  </svg>
)
const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
)
const ShareIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
)
const TagIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
)
const StarIcon = ({ filled }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? '#C8893A' : 'none'} stroke="#C8893A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)
const ArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
)

/* ─── Image Gallery ──────────────────────────────────────────────────────── */
function Gallery({ images = [], name }) {
  const [selected, setSelected] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const mainRef = useRef(null)
  const thumbsRef = useRef([])

  const go = useCallback((next) => {
    if (!images.length) return
    const to = (next + images.length) % images.length
    if (mainRef.current) {
      gsap.to(mainRef.current, {
        opacity: 0, scale: 0.97, duration: 0.15, ease: 'power2.in',
        onComplete: () => {
          setSelected(to)
          gsap.to(mainRef.current, { opacity: 1, scale: 1, duration: 0.22, ease: 'power3.out' })
        }
      })
    } else {
      setSelected(to)
    }
    // Highlight active thumb
    thumbsRef.current.forEach((t, i) => {
      if (!t) return
      gsap.to(t, { scale: i === to ? 1.05 : 1, duration: 0.2 })
    })
  }, [images.length])

  if (!images.length) {
    return (
      <div className="aspect-square rounded-3xl bg-neutral-100 flex items-center justify-center">
        <LeafIcon />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Main image */}
      <div className="relative aspect-square bg-neutral-50 rounded-3xl overflow-hidden group cursor-zoom-in"
        onClick={() => setZoomed(true)}>
        <img ref={mainRef}
          src={images[selected]}
          alt={`${name} — ${selected + 1}`}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Prev / next */}
        {images.length > 1 && (
          <>
            <button onClick={e => { e.stopPropagation(); go(selected - 1) }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-white transition-all duration-300 opacity-0 group-hover:opacity-100"
              style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)' }}>
              <ChevLeft />
            </button>
            <button onClick={e => { e.stopPropagation(); go(selected + 1) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-white transition-all duration-300 opacity-0 group-hover:opacity-100"
              style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)' }}>
              <ChevRight />
            </button>
            {/* Counter */}
            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-white text-xs font-body font-medium"
              style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}>
              {selected + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button key={i} ref={el => thumbsRef.current[i] = el}
              onClick={() => go(i)}
              className="shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-200"
              style={{ borderColor: i === selected ? '#2D6A4F' : '#E8E0D0' }}>
              <img src={img} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {zoomed && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(16px)' }}
          onClick={() => setZoomed(false)}>
          <img src={images[selected]} alt={name}
            className="max-w-full max-h-full object-contain rounded-2xl"
            style={{ maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()} />
          <button onClick={() => setZoomed(false)}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── Qty Selector ───────────────────────────────────────────────────────── */
function QtySelector({ qty, setQty, max }) {
  return (
    <div className="flex items-center gap-0 border border-neutral-200 rounded-2xl overflow-hidden"
      style={{ width: 'fit-content' }}>
      <button onClick={() => setQty(q => Math.max(1, q - 1))}
        disabled={qty <= 1}
        className="w-11 h-11 flex items-center justify-center text-neutral-500 hover:text-brand-green hover:bg-neutral-50 transition-colors disabled:opacity-30">
        <MinusIcon />
      </button>
      <span className="w-10 text-center font-body font-semibold text-neutral-800 text-sm">
        {qty}
      </span>
      <button onClick={() => setQty(q => Math.min(max, q + 1))}
        disabled={qty >= max}
        className="w-11 h-11 flex items-center justify-center text-neutral-500 hover:text-brand-green hover:bg-neutral-50 transition-colors disabled:opacity-30">
        <PlusIcon />
      </button>
    </div>
  )
}

/* ─── Star Rating ────────────────────────────────────────────────────────── */
function StarRating({ value = 0, max = 5 }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <StarIcon key={i} filled={i < Math.round(value)} />
      ))}
    </div>
  )
}

/* ─── Accordion Tab ─────────────────────────────────────────────────────── */
function AccordionTab({ title, icon: Icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  const bodyRef = useRef(null)

  useEffect(() => {
    if (!bodyRef.current) return
    if (open) {
      gsap.fromTo(bodyRef.current,
        { height: 0, opacity: 0 },
        { height: 'auto', opacity: 1, duration: 0.3, ease: 'power3.out' }
      )
    } else {
      gsap.to(bodyRef.current, { height: 0, opacity: 0, duration: 0.22, ease: 'power2.in' })
    }
  }, [open])

  return (
    <div className="border-b border-neutral-100 last:border-0">
      <button onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between py-4 text-left group">
        <span className="flex items-center gap-2.5 font-body font-semibold text-sm text-neutral-800 group-hover:text-brand-green transition-colors">
          <span className="text-brand-green-light"><Icon /></span>
          {title}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          className="text-neutral-400 transition-transform duration-300 shrink-0"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      <div ref={bodyRef} style={{ height: defaultOpen ? 'auto' : 0, overflow: 'hidden', opacity: defaultOpen ? 1 : 0 }}>
        <div className="pb-5 text-sm font-body text-neutral-500 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  )
}

/* ─── Skeleton ───────────────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid lg:grid-cols-2 gap-12 xl:gap-16">
        <div className="aspect-square rounded-3xl animate-pulse" style={{ background: '#F5F0E8' }} />
        <div className="space-y-5 pt-2">
          {[60, 90, 45, 70, 40].map((w, i) => (
            <div key={i} className="rounded-xl animate-pulse" style={{ height: i === 1 ? 36 : 18, width: `${w}%`, background: '#F5F0E8' }} />
          ))}
          <div className="rounded-2xl animate-pulse h-14 mt-6" style={{ background: '#F5F0E8' }} />
        </div>
      </div>
    </div>
  )
}

/* ─── Related Products Row ───────────────────────────────────────────────── */
function RelatedProducts({ categorySlug, currentId }) {
  const [products, setProducts] = useState([])
  const ref = useRef(null)

  useEffect(() => {
    if (!categorySlug) return
    productAPI.getByCategory(categorySlug)
      .then(({ data }) => {
        const list = (data.data || []).filter(p => p._id !== currentId).slice(0, 6)
        setProducts(list)
      })
      .catch(() => {})
  }, [categorySlug, currentId])

  useGSAP(() => {
    if (!products.length || !ref.current) return
    gsap.fromTo(ref.current.querySelectorAll('.rel-card'),
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.07, duration: 0.5, ease: 'power3.out',
        scrollTrigger: { trigger: ref.current, start: 'top 88%' } })
  }, { dependencies: [products], scope: ref })

  if (!products.length) return null

  return (
    <section ref={ref} className="home-section" style={{ background: '#FAFAF7' }}>
      <div className="container-main">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="flex items-center gap-2 font-body text-[11px] tracking-[0.22em] uppercase mb-2"
              style={{ color: '#C8893A' }}>
              <span className="w-4 h-px" style={{ background: '#C8893A', display: 'inline-block' }} />
              More from this category
            </p>
            <h2 className="font-heading text-2xl sm:text-3xl text-neutral-800">You May Also Like</h2>
          </div>
          {categorySlug && (
            <Link to={`/category/${categorySlug}`}
              className="hidden sm:flex items-center gap-1 font-body text-sm font-medium text-brand-green hover:text-brand-green-dark transition-colors group">
              View all
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                className="transition-transform duration-200 group-hover:translate-x-0.5">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-5">
          {products.map(p => (
            <div key={p._id} className="rel-card">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function ProductDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addItem, isInCart, getItemQty } = useCartStore()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [qty, setQty] = useState(1)

  const infoRef  = useRef(null)
  const imgRef   = useRef(null)
  const ctaRef   = useRef(null)
  const badgeRef = useRef(null)

  // Fetch product
  useEffect(() => {
    setLoading(true)
    setNotFound(false)
    setQty(1)
    window.scrollTo({ top: 0 })

    productAPI.getBySlug(slug)
      .then(({ data }) => {
        setProduct(data.data)
        setLoading(false)
      })
      .catch(err => {
        if (err?.response?.status === 404) setNotFound(true)
        else toast.error('Failed to load product')
        setLoading(false)
      })
  }, [slug])

  // Entrance animation
  useGSAP(() => {
    if (!product || !infoRef.current) return
    const tl = gsap.timeline()
    if (imgRef.current) {
      tl.fromTo(imgRef.current,
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 0.65, ease: 'power3.out' }
      )
    }
    tl.fromTo(infoRef.current.querySelectorAll('.info-row'),
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, stagger: 0.07, duration: 0.5, ease: 'power3.out' },
      '-=0.45'
    )
  }, { dependencies: [product] })

  const handleAddToCart = () => {
    if (!product || product.stock === 0) return
    addItem(product, qty)
    // Bounce the badge
    if (badgeRef.current) {
      gsap.fromTo(badgeRef.current,
        { scale: 1.4, rotate: -8 },
        { scale: 1, rotate: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' }
      )
    }
    toast.success(`${product.name} added to cart`, { id: product._id })
  }

  const handleShare = async () => {
    try {
      await navigator.share({ title: product.name, url: window.location.href })
    } catch {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied!')
    }
  }

  /* Loading */
  if (loading) return <Skeleton />

  /* 404 */
  if (notFound || !product) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mb-5 text-neutral-300">
        <LeafIcon />
      </div>
      <h1 className="font-heading text-2xl text-neutral-800 mb-2">Product Not Found</h1>
      <p className="font-body text-neutral-400 text-sm mb-7">This product doesn't exist or may have been removed.</p>
      <Link to="/shop" className="btn-primary text-sm px-6 py-3">Browse All Products</Link>
    </div>
  )

  const {
    _id, name, shortDescription, description, price, discountPrice,
    images, stock, ingredients, benefits, category,
    featured, bestSeller, ratings, totalSales
  } = product

  const effectivePrice = discountPrice > 0 ? discountPrice : price
  const discount       = pct(price, discountPrice)
  const outOfStock     = stock === 0
  const lowStock       = !outOfStock && stock <= 5
  const inCart         = isInCart(_id)
  const cartQty        = getItemQty(_id)

  return (
    <div className="bg-white">
      {/* Breadcrumb */}
      <div className="container-main pt-6 pb-0">
        <nav className="flex items-center gap-1.5 text-xs font-body text-neutral-400">
          <Link to="/" className="hover:text-brand-green transition-colors">Home</Link>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          <Link to="/shop" className="hover:text-brand-green transition-colors">Shop</Link>
          {category?.name && (
            <>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              <Link to={`/category/${category.slug}`} className="hover:text-brand-green transition-colors">
                {category.name}
              </Link>
            </>
          )}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          <span className="text-neutral-600 truncate max-w-[180px]">{name}</span>
        </nav>
      </div>

      {/* Main content */}
      <div className="container-main py-8 lg:py-12">
        <div className="grid lg:grid-cols-2 gap-10 xl:gap-16 items-start">

          {/* ── Left: Gallery ── */}
          <div ref={imgRef} style={{ opacity: 0 }}>
            <Gallery images={images} name={name} />
          </div>

          {/* ── Right: Info ── */}
          <div ref={infoRef} className="flex flex-col gap-0">

            {/* Badges row */}
            <div className="info-row flex flex-wrap gap-2 mb-4" style={{ opacity: 0 }}>
              {category?.name && (
                <Link to={`/category/${category.slug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-body text-xs font-medium transition-colors"
                  style={{ background: 'rgba(45,106,79,0.08)', color: '#2D6A4F' }}>
                  <TagIcon /> {category.name}
                </Link>
              )}
              {bestSeller && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-body text-xs font-semibold"
                  style={{ background: 'rgba(200,137,58,0.1)', color: '#C8893A' }}>
                  ★ Best Seller
                </span>
              )}
              {featured && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-body text-xs font-semibold"
                  style={{ background: 'rgba(82,183,136,0.12)', color: '#1B4332' }}>
                  ✦ Featured
                </span>
              )}
            </div>

            {/* Name */}
            <h1 className="info-row font-heading text-2xl sm:text-3xl lg:text-[2rem] text-neutral-900 leading-tight mb-3"
              style={{ opacity: 0 }}>
              {name}
            </h1>

            {/* Ratings + sales */}
            {(ratings > 0 || totalSales > 0) && (
              <div className="info-row flex items-center gap-4 mb-4" style={{ opacity: 0 }}>
                {ratings > 0 && (
                  <div className="flex items-center gap-1.5">
                    <StarRating value={ratings} />
                    <span className="font-body text-sm text-neutral-500">{ratings.toFixed(1)}</span>
                  </div>
                )}
                {totalSales > 0 && (
                  <span className="font-body text-xs text-neutral-400">{totalSales} sold</span>
                )}
              </div>
            )}

            {/* Short description */}
            <p className="info-row font-body text-sm text-neutral-500 leading-relaxed mb-5"
              style={{ opacity: 0 }}>
              {shortDescription}
            </p>

            {/* Price block */}
            <div className="info-row flex items-baseline gap-3 mb-2" style={{ opacity: 0 }}>
              <span className="font-heading text-3xl text-neutral-900">{fmt(effectivePrice)}</span>
              {discount > 0 && (
                <>
                  <span className="font-body text-base text-neutral-400 line-through">{fmt(price)}</span>
                  <span ref={badgeRef}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full font-body text-xs font-bold"
                    style={{ background: '#FEF2E7', color: '#C8893A' }}>
                    {discount}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Savings callout */}
            {discount > 0 && (
              <p className="info-row font-body text-xs text-brand-green-light mb-5 flex items-center gap-1.5"
                style={{ opacity: 0 }}>
                <CheckIcon /> You save {fmt(price - effectivePrice)} on this product
              </p>
            )}

            {/* Stock status */}
            <div className="info-row mb-6" style={{ opacity: 0 }}>
              {outOfStock ? (
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl font-body text-sm font-medium"
                  style={{ background: '#FEF2F2', color: '#DC2626' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  Out of Stock
                </div>
              ) : lowStock ? (
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl font-body text-sm font-medium"
                  style={{ background: '#FFFBEB', color: '#D97706' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  Only {stock} left in stock
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl font-body text-sm font-medium"
                  style={{ background: '#ECFDF5', color: '#065F46' }}>
                  <CheckIcon /> In Stock
                </div>
              )}
            </div>

            {/* Qty + Add to cart */}
            {!outOfStock && (
              <div ref={ctaRef} className="info-row flex flex-wrap items-center gap-3 mb-6" style={{ opacity: 0 }}>
                <QtySelector qty={qty} setQty={setQty} max={Math.min(stock, 10)} />

                <button onClick={handleAddToCart}
                  className="flex-1 min-w-[160px] flex items-center justify-center gap-2 font-body font-semibold text-sm py-3.5 px-6 rounded-2xl transition-all duration-200 active:scale-[0.97]"
                  style={{
                    background: inCart ? 'rgba(45,106,79,0.08)' : '#2D6A4F',
                    color: inCart ? '#2D6A4F' : '#fff',
                    border: inCart ? '1.5px solid rgba(45,106,79,0.25)' : 'none',
                    boxShadow: inCart ? 'none' : '0 4px 20px rgba(45,106,79,0.28)',
                  }}>
                  {inCart ? <CheckIcon /> : <CartIcon />}
                  {inCart ? `In Cart (${cartQty})` : 'Add to Cart'}
                </button>

                {/* Share */}
                <button onClick={handleShare}
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-neutral-500 hover:text-brand-green transition-colors"
                  style={{ border: '1.5px solid #E8E0D0' }}
                  title="Share product">
                  <ShareIcon />
                </button>
              </div>
            )}

            {/* Trust strip */}
            <div className="info-row grid grid-cols-3 gap-3 mb-6" style={{ opacity: 0 }}>
              {[
                { Icon: LeafIcon,   label: '100% Organic' },
                { Icon: ShieldIcon, label: 'No Chemicals' },
                { Icon: FlaskIcon,  label: 'Cold Pressed' },
              ].map(({ Icon, label }) => (
                <div key={label}
                  className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl text-center"
                  style={{ background: 'rgba(45,106,79,0.05)', border: '1px solid rgba(45,106,79,0.08)' }}>
                  <span className="text-brand-green"><Icon /></span>
                  <span className="font-body text-[10px] font-semibold text-neutral-600 leading-tight">{label}</span>
                </div>
              ))}
            </div>

            {/* Accordion: Description, Benefits, Ingredients */}
            <div className="info-row border border-neutral-100 rounded-2xl overflow-hidden divide-y divide-neutral-100"
              style={{ opacity: 0 }}>
              <div className="px-5">
                <AccordionTab title="Description" icon={LeafIcon} defaultOpen>
                  <p className="whitespace-pre-line">{description}</p>
                </AccordionTab>
              </div>

              {benefits?.length > 0 && (
                <div className="px-5">
                  <AccordionTab title="Benefits" icon={SparkleIcon}>
                    <ul className="space-y-2">
                      {benefits.map((b, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#52B788' }} />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </AccordionTab>
                </div>
              )}

              {ingredients?.length > 0 && (
                <div className="px-5">
                  <AccordionTab title="Ingredients" icon={FlaskIcon}>
                    <ul className="space-y-2">
                      {ingredients.map((ing, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#C8893A', opacity: 0.7 }} />
                          {ing}
                        </li>
                      ))}
                    </ul>
                  </AccordionTab>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Related products */}
      <RelatedProducts categorySlug={category?.slug} currentId={_id} />
    </div>
  )
}
