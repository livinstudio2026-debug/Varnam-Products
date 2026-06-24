// src/components/ui/ProductCard.jsx

import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import toast from 'react-hot-toast'
import { useCartStore } from '../../store/cartStore'

/* ── Quick-view icon ─────────────────────────────────────────────────────── */
const EyeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)

const CartPlusIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

/* ─────────────────────────────────────────────────────────────────────────── */

export default function ProductCard({ product, showStockBadge = false, className = '' }) {
  const { addItem, isInCart } = useCartStore()

  const cardRef    = useRef(null)
  const imgRef     = useRef(null)
  const shineRef   = useRef(null)
  const overlayRef = useRef(null)
  const infoRef    = useRef(null)
  const btnRef     = useRef(null)

  const [adding, setAdding] = useState(false)

  if (!product) return null

  const { _id, name, slug, price, discountPrice, images, stock } = product
  const hasDiscount    = discountPrice > 0
  const effectivePrice = hasDiscount ? discountPrice : price
  const discountPct    = hasDiscount ? Math.round(((price - discountPrice) / price) * 100) : 0
  const inCart         = isInCart(_id)
  const outOfStock     = stock === 0

  /* ── Hover animations ──────────────────────────────────────────────────── */
  const onEnter = () => {
    // Card lift
    gsap.to(cardRef.current, {
      y: -6,
      boxShadow: '0 20px 48px rgba(45,106,79,0.18), 0 4px 16px rgba(45,106,79,0.10)',
      duration: 0.35,
      ease: 'power3.out',
    })
    // Image zoom
    gsap.to(imgRef.current, {
      scale: 1.09,
      duration: 0.55,
      ease: 'power2.out',
    })
    // Shine sweep
    gsap.fromTo(shineRef.current,
      { x: '-110%', opacity: 1 },
      { x: '110%', opacity: 1, duration: 0.55, ease: 'power2.out' }
    )
    // Overlay fade in
    gsap.to(overlayRef.current, { opacity: 1, duration: 0.25 })
    // Quick-action buttons slide up
    gsap.to(infoRef.current, { y: 0, opacity: 1, duration: 0.28, ease: 'power3.out' })
    // Add-to-cart button highlight
    if (!outOfStock && !inCart && btnRef.current) {
      gsap.to(btnRef.current, {
        background: '#1B4332',
        duration: 0.2,
      })
    }
  }

  const onLeave = () => {
    gsap.to(cardRef.current, {
      y: 0,
      boxShadow: '0 2px 12px rgba(45,106,79,0.06)',
      duration: 0.4,
      ease: 'power3.out',
    })
    gsap.to(imgRef.current, { scale: 1, duration: 0.45, ease: 'power3.out' })
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.25 })
    gsap.to(infoRef.current, { y: 8, opacity: 0, duration: 0.2 })
    if (!outOfStock && !inCart && btnRef.current) {
      gsap.to(btnRef.current, { background: '#2D6A4F', duration: 0.2 })
    }
  }

  /* ── Add to cart with micro-animation ─────────────────────────────────── */
  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (outOfStock || adding) return

    setAdding(true)
    // Button bounce
    gsap.fromTo(btnRef.current,
      { scale: 0.88 },
      { scale: 1, duration: 0.45, ease: 'elastic.out(1.2, 0.5)' }
    )

    addItem(product, 1)
    toast.success(`${name} added to cart`, { id: _id })

    setTimeout(() => setAdding(false), 600)
  }

  return (
    <Link
      to={`/shop/${slug}`}
      ref={cardRef}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      aria-label={`View ${name}`}
      className={className}
      style={{
        display: 'block',
        textDecoration: 'none',
        borderRadius: 18,
        overflow: 'hidden',
        background: '#fff',
        border: '1px solid #F0EBE1',
        boxShadow: '0 2px 12px rgba(45,106,79,0.06)',
        willChange: 'transform, box-shadow',
        position: 'relative',
      }}
    >
      {/* ── Image area ──────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '1/1', background: '#FAFAF7' }}>
        <img
          ref={imgRef}
          src={images?.[0] ?? '/placeholder-product.jpg'}
          alt={name}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', willChange: 'transform', display: 'block' }}
        />

        {/* Shine sweep overlay */}
        <div ref={shineRef} style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.28) 50%, transparent 60%)',
          transform: 'translateX(-110%)',
          zIndex: 3,
        }} />

        {/* Dark gradient overlay — appears on hover */}
        <div ref={overlayRef} style={{
          position: 'absolute', inset: 0, opacity: 0, pointerEvents: 'none',
          background: 'linear-gradient(to top, rgba(27,67,50,0.42) 0%, transparent 60%)',
          zIndex: 2,
        }} />

        {/* Quick-view pill — slides up on hover */}
        <div ref={infoRef} style={{
          position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%) translateY(8px)',
          opacity: 0, zIndex: 4, whiteSpace: 'nowrap',
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
          borderRadius: 99, padding: '6px 14px',
          fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500,
          color: '#2D6A4F', boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          pointerEvents: 'none',
        }}>
          <EyeIcon /> Quick View
        </div>

        {/* Discount badge */}
        {hasDiscount && (
          <span style={{
            position: 'absolute', top: 10, left: 10, zIndex: 5,
            background: 'linear-gradient(135deg, #C8893A, #E9B87A)',
            color: '#fff', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
            padding: '3px 9px', borderRadius: 99,
            boxShadow: '0 2px 10px rgba(200,137,58,0.35)',
          }}>
            {discountPct}% off
          </span>
        )}

        {/* Low stock badge */}
        {showStockBadge && !outOfStock && stock <= 5 && (
          <span style={{
            position: 'absolute', top: hasDiscount ? 34 : 10, left: 10, zIndex: 5,
            background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)',
            color: '#D97706', fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
            padding: '2px 8px', borderRadius: 99, border: '1px solid rgba(217,119,6,0.2)',
          }}>
            Only {stock} left
          </span>
        )}

        {/* Out of stock overlay */}
        {outOfStock && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 5,
            background: 'rgba(255,255,255,0.68)', backdropFilter: 'blur(3px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              background: '#26221C', color: '#fff',
              fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500,
              padding: '5px 14px', borderRadius: 99,
            }}>
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* ── Info area ───────────────────────────────────────────────────── */}
      <div style={{ padding: '14px 16px 16px' }}>

        <h3 style={{
          fontFamily: 'var(--font-body)', fontWeight: 500,
          color: '#26221C', fontSize: 13, lineHeight: 1.4,
          margin: '0 0 10px',
          display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {name}
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, flexShrink: 0 }}>
            <span style={{
              fontFamily: 'var(--font-body)', fontWeight: 700,
              color: '#26221C', fontSize: 15,
            }}>
              ₹{effectivePrice}
            </span>
            {hasDiscount && (
              <span style={{
                fontFamily: 'var(--font-body)', fontSize: 12,
                color: '#B8AFA0', textDecoration: 'line-through',
              }}>
                ₹{price}
              </span>
            )}
          </div>

          {/* Add to cart button */}
          <button
            ref={btnRef}
            onClick={handleAddToCart}
            disabled={outOfStock}
            aria-label={inCart ? `${name} in cart` : `Add ${name} to cart`}
            style={{
              flexShrink: 0,
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500,
              padding: '6px 12px', borderRadius: 10,
              cursor: outOfStock ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
              border: inCart ? '1px solid rgba(45,106,79,0.25)' : 'none',
              ...(outOfStock
                ? { background: '#F5F0E8', color: '#B8AFA0' }
                : inCart
                  ? { background: 'rgba(45,106,79,0.08)', color: '#2D6A4F' }
                  : { background: '#2D6A4F', color: '#fff', boxShadow: '0 2px 8px rgba(45,106,79,0.25)' }
              ),
            }}
          >
            {inCart
              ? <><CheckIcon /> In Cart</>
              : <><CartPlusIcon /> Add</>
            }
          </button>
        </div>
      </div>
    </Link>
  )
}